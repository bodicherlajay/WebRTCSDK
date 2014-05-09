/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */
/**
 *  The WebRTC SDK. 
 * @fileOverview Handles all the calls related to web rtc
 * @namespace ATT.rtc.Phone
 */

if (ATT === undefined) {
  var ATT = {};
}

if (Env === undefined) {
  var Env = {};
}

(function (app) {
  'use strict';

  var resourceManager = Env.resourceManager.getInstance(),
    callManager = cmgmt.CallManager.getInstance(),
    setupEventChannel,
    shutdownEventChannel,
    handleError,
    createWebRTCSessionSuccess,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logMgr.configureLogger('WebRTC', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);
  logger = logMgr.getLogger('WebRTC');

  setupEventChannel = function () {
    logger.logTrace('setupEventChannel');

    var session = callManager.getSessionContext(),

      // Set event channel configuration
      // All parameters are required
      // Also, see appConfigModule
      channelConfig = {
        accessToken: session.getAccessToken(),
        endpoint: ATT.appConfig.EventChannelConfig.endpoint,
        sessionId: session.getSessionId(),
        publisher: ATT.event,
        resourceManager: resourceManager,
        publicMethodName: 'getEvents',
        usesLongPolling: (ATT.appConfig.EventChannelConfig.type === 'longpolling')
      };

    ATT.utils.eventChannel = ATT.utils.createEventChannel(channelConfig);
    if (ATT.utils.eventChannel) {
      ATT.utils.eventChannel.startListening();
      logger.logInfo('Event channel setup and running...');
    } else {
      throw 'Event channel setup failed';
    }
  };

  shutdownEventChannel = function () {
    logger.logTrace('shutdownEventChannel');
    ATT.utils.eventChannel.stopListening();
    logger.logInfo('Event channel shutdown successfully');
  };

  handleError = function (config, operation, errorResp) {
    logger.logTrace('handleError: ' + operation);
    logger.logInfo('There was an error performing operation ' + operation);

    var error,
      errObj;

    if (typeof errorResp === 'string') { // String Errors
      error = ATT.errorDictionary.getDefaultError({
        moduleID: 'RTC',
        operationName: operation,
        errorDescription: 'Operation ' + operation + ' failed',
        reasonText: errorResp
      });
    } else if (errorResp.isSdkErr) { // Previously thrown SDK Errors
      error = errorResp;
    } else if (errorResp.getJson) { // Errors from Network/API
      errObj = errorResp.getJson();
      if (errObj.RequestError) {    // Known API errors
        if (errObj.RequestError.ServiceException) { // API Service Exceptions
          error = ATT.errorDictionary.getErrorByOpStatus(operation, errorResp.getResponseStatus(), errObj.RequestError.ServiceException.MessageId);
        } else if (errObj.RequestError.PolicyException) { // API Policy Exceptions
          error = ATT.errorDictionary.getErrorByOpStatus(operation, errorResp.getResponseStatus(), errObj.RequestError.PolicyException.MessageId);
        } else if (errObj.RequestError.Exception) { // API Exceptions
          error = ATT.errorDictionary.getDefaultError({
            moduleID: 'RTC',
            operationName: operation,
            httpStatusCode: errorResp.getResponseStatus(),
            errorDescription: 'Operation ' + operation + ' failed',
            reasonText: errObj.RequestError.Exception.Text
          });
        }
      } else {                      // Unknown API network errors
        error = ATT.errorDictionary.getDefaultError({
          moduleID: 'RTC',
          operationName: operation,
          httpStatusCode: errorResp.getResponseStatus(),
          errorDescription: 'Operation ' + operation + ' failed',
          reasonText: 'WebRTC operation ' + operation + ' failed due to unknown reason'
        });
      }
    }
    if (!error) { // Unknown errors
      error = ATT.errorDictionary.getMissingError();
    }

    logger.logError(error.formatError());
    logger.logDebug(error);

    if (typeof config.error === 'function') {
      config.error(error);
    }
  };

  /**
   * Initializes SDK with Oauth access token and e911Id. E911Id is an optional parameter which is needed for ICMN and VTN customers
   * @memberof ATT.rtc.Phone
   * @function initSession
   * @param {String} accessToken
   * @param {String} e911Id
   * @example Preconditions: Developer hosts the login page and obtained user credentials, 
   * invoked the API endpoint to obtain access token and e911 id.
   * ATT.rtc.Phone.initSDK(“e911id”,”access token”)
   */
  function initSession(accessToken, e911Id) {
    logger.logTrace('initSession');

    try {
      if (!accessToken) {
        throw 'Cannot init SDK session, no access token';
      }
      if (!e911Id) {
        logger.logWarning('Initializing SDK session without e911 id');
      }
    // Set the access Token in the callManager.
      callManager.CreateSession({
        token: accessToken,
        e911Id: e911Id
      });
      logger.logInfo('Initialed SDK session with token and optional e911 id');
    } catch (err) {
      throw "Init Session Error: " + err;
    }
  }

  createWebRTCSessionSuccess = function (config, responseObject) {
    logger.logTrace('createWebRTCSessionSuccess');

    var session = callManager.getSessionContext(),
      sessionId = responseObject && responseObject.getResponseHeader('Location') ? responseObject.getResponseHeader('Location').split('/')[4] : null;

    if (sessionId) {
      logger.logInfo('Successfully created web rtc session on blackflag');

      // Set WebRTC.Session data object that will be needed downstream.
      session.setSessionId(sessionId);
      // Also setup UI callbacks
      session.setUICallbacks(config);

      // setting up event callbacks using RTC Events
      app.RTCEvent.getInstance().hookupEventsToUICallbacks();
      // publish the UI callback for ready state
      app.event.publish(sessionId + '.responseEvent', {
        state:  app.SessionEvents.RTC_SESSION_CREATED,
        data: {
          webRtcSessionId: sessionId
        }
      });

      // fire up the event channel after successfult create session
      setupEventChannel();
    } else {
      logger.logError('Failed to retrieve session id from black flag');
    }
  };

  /**
   * Used to establish webRTC session so that the user can place webRTC calls. 
   * The service parameter indicates the desired service such as audio or video call
   * @memberof ATT.rtc
   * @param {Object} data The required login form data from the UI.
   * @attribute {String} token
   * @attribute {String} e911Locations
   * @example Preconditions: SDK was initialized.
   * ATT.rtc.Phone.login(“audio-session”); //for audio service
   * ATT.rtc.Phone.login(“video-session”); //for video service
   */
  function login(config) {
    logger.logTrace('createWebRTCSession');

    try {
      if (!config) {
        throw 'Cannot login to web rtc, no configuration';
      }
      if (!config.token) {
        throw 'Cannot login to web rtc, no access token';
      }
      var token = config.token,
        e911Id = config.e911Id || null,
        session;

      // create new session with token and optional e911id
      initSession(token, e911Id);

      session = callManager.getSessionContext();
      token = session.getAccessToken();
      e911Id = session.getE911Id();

      // todo: need to decide if callbacks should be mandatory
      if (typeof config.onSessionReady !== 'function') {
        logger.logWarning('No UI success callback specified');
      }
      if (typeof config.onError !== 'function') {
        logger.logWarning('No UI error callback specified');
      }

      resourceManager.doOperation('createWebRTCSession', {
        data: {     // Todo: this needs to be configurable in SDK, not hardcoded.
          'session': {
            'mediaType': 'dtls-srtp',
            'ice': 'true',
            'services': [
              'ip_voice_call',
              'ip_video_call'
            ]
          }
        },
        params: {
          headers: {
            'Authorization': token,
            'x-e911Id': e911Id || "",
            'x-Arg': 'ClientSDK=WebRTCTestAppJavascript1'
          }
        },
        success: createWebRTCSessionSuccess.bind(this, config),
        error: handleError.bind(this, config, 'CreateSession')
      });
    } catch (err) {
      handleError.call(this, config, 'CreateSession', err);
    }
  }

 /**
   * Logs out the user from webRTC session. When invoked webRTC session gets deleted
   * @memberof ATT.rtc
   * @param {Object} data The required login form data from the UI.
   * @attribute {String} token
   * @attribute {String} e911Locations
   * @example 
  ATT.rtc.Phone.logout();
  */
  function logout(config) {
    logger.logTrace('deleteWebRTCSession');

    try {

      // stop media stream
      ATT.UserMediaService.stopStream();
      // stop event channel
      shutdownEventChannel();

      var session = callManager.getSessionContext(),
        dataForDeleteWebRTCSession;

      if (!session) {
        if (typeof config.success === 'function') {
          config.success();
        }
        return;
      }
      dataForDeleteWebRTCSession = {
        params: {
          url: [session.getSessionId()],
          headers: {
            'Authorization': session.getAccessToken(),
            'x-e911Id': session.getE911Id()
          }
        },
        success: function () {
          logger.logInfo('Successfully deleted web rtc session on blackflag');
          if (typeof config.success === 'function') {
            config.success();
          }
        },
        error: handleError.bind(this, config, 'DeleteSession')
      };

    // Call BF to delete WebRTC Session.
      resourceManager.doOperation('deleteWebRTCSession', dataForDeleteWebRTCSession);
    } catch (err) {
      handleError.call(this, config, 'DeleteSession', err);
    }
  }

  /**
   * Used to make outgoing call. This function takes five arguments: the destination(tel or sip uri), 
   * html element id to display the local video/audio, html element id to display remote video,
   * media constraints, configuration object with callback functions 
   * @param {Object} config Dial configuration object.
   * @memberof ATT.rtc.Phone
   * @attribute {String} phoneNumber
   * @attribute {HTMLElement} localVideo
   * @attribute {HTMLElement} remoteVideo
   * @attribute {Object} mediaConstraints
   * @attribute {Object} callbacks UI callbacks. Event object will be passed to these callbacks.
   * @example Preconditions: SDK was initialized with access token and e911 id

   * //audio call
   * //Example 1
   ATT.rtc.Phone.dial(“telephone number or sip uri”,
   localVideo: “localvideo”,
   remoteVideo: “remotevideo”,
   mediaConstraints: {
   audio:true,
   video:false},
   callbacks: {
   onSessionOpen: callback_name,
   onOutgoingCall: callback_name,
   onInProgress: callback_name,
   onCallEnded: callback_name,
   onCallError: callback_name}
   //removed other callbacks for brevity
   );

  //Example 2
   ATT.rtc.Phone(
   OnSessionOpen(event) {
   },
   OnIncomingCall(event) {
   },
   OnInProgress(event) {
   },
   OnRinging(event) {
   },
   OnCallEnded(event) {
   },
   //removed other callbacks for brevity
   OnError(event) {
   }).dial(“telephone or sip uri”,
   localVideo: “localvideo”,
   remoteVideo: “remotevideo”,
   mediaConstraints: {
   audio:true,
   video:false});


   //video call
   ATT.rtc.Phone.dial(“telephone number or sip uri”,
   localVideo: “localvideo”,
   remoteVideo: “remotevideo”,
   mediaConstraints: {
   audio:true,
   video:true},

   */
  function dial(config) {
    callManager.CreateOutgoingCall(config);
    // setting up event callbacks using RTC Events
    app.RTCEvent.getInstance().hookupEventsToUICallbacks();
  }

  /**
   * When call arrives via an incoming call event, call can be answered by using this method
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} phoneNumber
   * @attribute {HTMLElement} localVideo
   * @attribute {HTMLElement} remoteVideo
   * @attribute {Object} mediaConstraints
   * @attribute {Object} callbacks UI callbacks. Event object will be passed to these callbacks.
   * @example 
   Preconditions: SDK was initialized with access token and e911 id

    //Example 1
    //audio call
    ATT.rtc.Phone.answer(
    localVideo: “localvideo”,
    remoteVideo: “remotevideo”,
    mediaConstraints: {
    audio:true,
    video:false},
    success: {
    onSessionOpen: callback_name,
    onInProgress: callback_name,
    onCallEnded: callback_name,
    //removed other callbacks for brevity
    onCallError: callback_name}
    );

    //Example 2
    ATT.rtc.Phone(
    OnSessionOpen(event) {
    },
    OnIncomingCall(event) {
    },
    OnInProgress(event) {
    },
    OnRinging(event) {
    },
    OnCallEnded(event) {
    },
    //removed other callbacks for brevity
    OnError(event) {
    }).answer(localVideo: “localvideo”,
    remoteVideo: “remotevideo”,
    mediaConstraints: {
    audio:true,
    video:false});
    //video call

   */
  function answer(config) {
    callManager.CreateIncomingCall(config);
    // setting up event callbacks using RTC Events
    app.RTCEvent.getInstance().hookupEventsToUICallbacks();
  }

  /**
  * Mutes the local stream (video or audio)
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.mute();
  */
  function mute() {
    callManager.getSessionContext().getCallObject().mute();
  }

  /**
  * Unmutes the local stream
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.unmute();
  */
  function unmute() {
    callManager.getSessionContext().getCallObject().unmute();
  }

  /**
  * Holds the current call and the other party gets notified through event channel
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.hold();
  */
  function hold() {
    if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
      callManager.getSessionContext().getCallObject().hold();
    }
  }

  /**
  * Resumes the current call and the other party gets notified through event channel and the call resumes
  * @memberof ATT.rtc.Phone
  * @example  
  ATT.rtc.Phone.resume();
  */
  function resume() {
    if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
      callManager.getSessionContext().getCallObject().resume();
    }
  }

  /**
  * Hangs up the current call
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.hangup();
  */
  function hangup() {
    if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
      callManager.getSessionContext().getCallObject().end();
    }
  }

  // The SDK public API.
  function configurePublicAPIs() {
    resourceManager.addPublicMethod('init', initSession);
    resourceManager.addPublicMethod('login', login);
    resourceManager.addPublicMethod('logout', logout);
    resourceManager.addPublicMethod('dial', dial);
    resourceManager.addPublicMethod('answer', answer);
    resourceManager.addPublicMethod('hold', hold);
    resourceManager.addPublicMethod('resume', resume);
    resourceManager.addPublicMethod('mute', mute);
    resourceManager.addPublicMethod('unmute', unmute);
    resourceManager.addPublicMethod('hangup', hangup);
  }

  // sub-namespaces on ATT.
  app.RESTClient = RESTClient;

  app.configurePublicAPIs = configurePublicAPIs;

}(ATT || {}));