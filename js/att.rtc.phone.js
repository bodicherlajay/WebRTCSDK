/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */

if (ATT === undefined) {
  var ATT = {};
}

if (Env === undefined) {
  var Env = {};
}

/**
 *  The WebRTC SDK.
 *  @fileOverview Handles all the calls related to web rtc
 *  @namespace ATT.rtc.Phone
 *  @overview ATT RTC SDK [TODO: To be filled by marketing?]
 *  @copyright AT&T [TODO: what we show here]
 *  @class ATT.rtc.Phone
 *  @license [TODO: to be filled by marketing]
 *  @classdesc RTC Phone Implementation [TODO: to be filled by marketing]
 */
(function (app) {
  'use strict';

  var resourceManager = Env.resourceManager.getInstance(),
    callManager = cmgmt.CallManager.getInstance(),
    handleError,
    setupEventChannel,
    shutdownEventChannel,
    createWebRTCSessionSuccess,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logger = logMgr.getLogger('WebRTC', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);

  handleError = function (operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);
    logger.logInfo('There was an error performing operation ' + operation);

    var error = ATT.Error.create(err, operation);

    if (typeof errHandler === 'function') {
      ATT.Error.publish(error, operation, errHandler);
    }
  };

  setupEventChannel = function (config) {
    logger.logDebug('setupEventChannel');

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
      logger.logInfo('Event channel up and running');

      ATT.utils.eventChannel.startListening({
        success: config.success,
        error: config.error
      });
    } else {
      throw 'Event channel setup failed';
    }
  };

  shutdownEventChannel = function () {
    logger.logDebug('shutdownEventChannel');
    ATT.utils.eventChannel.stopListening();
    logger.logInfo('Event channel shutdown successfully');
  };

  function initSession(accessToken, e911Id) {
    logger.logDebug('initSession');

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


  function initCallbacks(callbacks) {
    logger.logDebug('intiCallbacks');
    //Planning not to save the UI callbacks in session context
    logger.logDebug(callbacks);
    try {
      logger.logInfo('getting the Callback for mapping');
    } catch (err) {
      throw "Init Callbacks: " + err;
    }
  }
  function getCallType() {
    logger.logDebug('Call type Audio/Video');

    try {
      logger.logInfo('Trying to get the CallType from the session Context ');
    } catch (err) {
      throw "getcalltype: " + err;
    }
  }
  createWebRTCSessionSuccess = function (config, responseObject) {
    logger.logDebug('createWebRTCSessionSuccess');

    var sessionId = null,
      errorHandler;

    if (config.callbacks && config.callbacks.onError && typeof config.callbacks.onError === 'function') {
      errorHandler = config.callbacks.onError;
    }

    try {
      if (responseObject && responseObject.getResponseHeader('Location')) {
        sessionId = responseObject.getResponseHeader('Location').split('/')[4];
      }

      if (!sessionId) {
        throw 'Failed to retrieve session id';
      }

      logger.logInfo('Successfully created web rtc session, the session id is:' + sessionId);

      // Set WebRTC.Session data object that will be needed downstream.
      // Also setup UI callbacks
      callManager.UpdateSession({
        sessionId: sessionId,
        callbacks: config.callbacks
      });

      // publish the UI callback for ready state
      app.event.publish(sessionId + '.responseEvent', {
        state:  app.SessionEvents.RTC_SESSION_CREATED,
        data: {
          sessionId: sessionId
        }
      });

      // fire up the event channel after successfult create session
      logger.logInfo("Setting up event channel...");
      setupEventChannel({
        success: function (msg) {
          logger.logInfo(msg);
        },
        error: handleError.bind(this, 'EventChannel', errorHandler)
      });

    } catch (err) {
      handleError.call(this, 'CreateSession', errorHandler, err);
    }
  };

  /**
    * @summary Performs RTC login
    * @desc Used to establish webRTC session so that the user can place webRTC calls.
    * The service parameter indicates the desired service such as audio or video call
    * @memberof ATT.rtc.Phone
    * @param {Object} loginParams Login parameters
    * @param {String} loginParams.token  Access token
    * @param {String} [loginParams.e911Id] E911 Id. Optional parameter for NoTN users. Required for ICMN and VTN users
    * @param {Boolean} [loginParams.audioOnly] Set this value to true for audio service.
    *        Optional parameter to indicate only audio service is needed for the session
    * @fires ATT.rtc.Phone.login#[RTCEvent]OnSessionReady  This callback gets invoked when SDK is initialized and ready to make, receive calls
    * @fires ATT.rtc.Phone.login#[RTCEvent]OnIncomingCall  This callback gets invoked when incoming call event is received
    * @fires ATT.rtc.Phone.login#[RTCEvent]OnCallEnded     This callback gets invoked when outgoing/incoming call is ended
    * @fires ATT.rtc.Phone.login#[RTCEvent]OnCallError     This callback gets invoked while encountering issue with outgoing/incoming call
    * @fires ATT.rtc.Phone.login#[RTCEvent]OnError         This callback gets invoked while encountering issues during login process
    * @example
    *
    * ATT.rtc.Phone.login({
    *       token: 'accessToken',
    *       e911Id: 'e911Identifer',
    *       audioOnly: true,
    *       onSessionReady : function (event) {
    *
    *       },
    *       onIncomingCall : function (event) {
    *       },
    *       onCallEnded : function (event) {
    *       },
    *       onCallError :  function (event) {
    *       ,
    *       onError : function (error) {
    *         error.userErrorCode
    *         error.helpText
    *         error.errorDescription);
    *     }
   */
  function login(loginParams) {
    logger.logDebug('createWebRTCSession');
    var token,
      e911Id,
      session,
      services = ['ip_voice_call', 'ip_video_call'],
      errorHandler;

    if (loginParams.callbacks && loginParams.callbacks.onError && typeof loginParams.callbacks.onError === 'function') {
      errorHandler = loginParams.callbacks.onError;
    }

    try {
      if (!loginParams) {
        throw 'Cannot login to web rtc, no configuration';
      }
      if (!loginParams.token) {
        throw 'Cannot login to web rtc, no access token';
      }

      // todo: need to decide if callbacks should be mandatory
      if (!loginParams.callbacks || Object.keys(loginParams.callbacks) <= 0) {
        logger.logWarning('No UI callbacks specified');
      }

      token = loginParams.token;
      e911Id = loginParams.e911Id || null;

      //remove video service for audio only service
      if (loginParams.audioOnly) {
        services = services.slice(0, 1);
      }
      // create new session with token and optional e911id
      initSession(token, e911Id);

      session = callManager.getSessionContext();
      token = session.getAccessToken();
      e911Id = session.getE911Id();

      resourceManager.doOperation('createWebRTCSession', {
        data: {
          'session': {
            'mediaType': 'dtls-srtp',
            'ice': 'true',
            'services': services
          }
        },
        params: {
          headers: {
            'Authorization': token,
            'x-e911Id': e911Id || "",
            'x-Arg': 'ClientSDK=WebRTCTestAppJavascript1'
          }
        },
        success: createWebRTCSessionSuccess.bind(this, loginParams),
        error: handleError.bind(this, 'CreateSession', errorHandler)
      });
    } catch (err) {
      handleError.call(this, 'CreateSession', errorHandler, err);
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
    logger.logDebug('deleteWebRTCSession');

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
        error: handleError.bind(this, 'DeleteSession', config.error)
      };

    // Call BF to delete WebRTC Session.
      resourceManager.doOperation('deleteWebRTCSession', dataForDeleteWebRTCSession);
      callManager.DeleteSession();
    } catch (err) {
      callManager.DeleteSession();
      handleError.call(this, 'DeleteSession', config.error, err);
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
   //Not yet implemented
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
    try {
      callManager.CreateOutgoingCall(config);
    } catch (e) {
      ATT.Error.publish(e);
    }
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
   //Not yet implemented
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
    try {
      callManager.CreateIncomingCall(config);
    } catch (e) {
      ATT.Error.publish(e);
    }
  }

  /**
  * Mutes the local stream (video or audio)
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.mute();
  */
  function mute() {
    try {
      callManager.getSessionContext().getCallObject().mute();
    } catch (e) {
      ATT.Error.publish(e);
    }
  }

  /**
  * Unmutes the local stream
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.unmute();
  */
  function unmute() {
    try {
      callManager.getSessionContext().getCallObject().unmute();
    } catch (e) {
      ATT.Error.publish(e);
    }
  }

  /**
  * Holds the current call and the other party gets notified through event channel
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.hold();
  */
  function hold() {
    try {
      if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
        callManager.getSessionContext().getCallObject().hold();
      }
    } catch (e) {
      ATT.Error.publish(e);
    }
  }

  /**
  * Resumes the current call and the other party gets notified through event channel and the call resumes
  * @memberof ATT.rtc.Phone
  * @example  
  ATT.rtc.Phone.resume();
  */
  function resume() {
    try {
      if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
        callManager.getSessionContext().getCallObject().resume();
      }
    } catch (e) {
      ATT.Error.publish(e);
    }
  }

  /**
  * Hangs up the current call
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.hangup();
  */
  function hangup(options) {
    try {
      if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
         //TODO the callended callback gets triggred on session terminated (callbacks are already register)
        if (callManager.getSessionContext().getCallObject().end()) {
          options.onSuccess();
        }
      }
    } catch (e) {
      ATT.Error.publish(e);
    }
  }

  // The SDK public API.
  function configurePublicAPIs() {
    resourceManager.addPublicMethod('login', login);
    resourceManager.addPublicMethod('logout', logout);
    resourceManager.addPublicMethod('dial', dial);
    resourceManager.addPublicMethod('answer', answer);
    resourceManager.addPublicMethod('hold', hold);
    resourceManager.addPublicMethod('resume', resume);
    resourceManager.addPublicMethod('mute', mute);
    resourceManager.addPublicMethod('unmute', unmute);
    resourceManager.addPublicMethod('initCallback', initCallbacks);
    resourceManager.addPublicMethod('getCallType ', getCallType);
    resourceManager.addPublicMethod('hangup', hangup);
  }

  // sub-namespaces on ATT.
  app.RESTClient = RESTClient;

  app.configurePublicAPIs = configurePublicAPIs;

}(ATT || {}));