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
    createWebRTCSessionSuccess,
    createWebRTCSessionError,
    logMgr = ATT.logManager.getInstance(),
    logger,
    newErrorObj;

  logMgr.configureLogger('WebRTC', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);
  logger = logMgr.getLogger('WebRTC');

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
    logger.logTrace('Initializing SDK session with token and optional e911 id');
    if (!accessToken) {
      return logger.logError('Cannot init SDK session, no access token');
    }
    if (!e911Id) {
      logger.logWarning('Initializing SDK session without e911 id');
    }
    // Set the access Token in the callManager.
    callManager.CreateSession({
      token: accessToken,
      e911Id: e911Id
    });
    logger.logTrace('Initialed SDK session with token and optional e911 id');
  }

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
    if (!config) {
      return logger.logError('Cannot login to web rtc, no configuration');
    }
    if (!config.token) {
      return logger.logError('Cannot login to web rtc, no access token');
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
      logger.logError('No UI success callback specified');
    }
    if (typeof config.onError !== 'function') {
      logger.logError('No UI error callback specified');
    }

    logger.logTrace('Creating WebRTC session...');
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
      error: createWebRTCSessionError.bind(this, config)
    });
  }

  createWebRTCSessionSuccess = function (config, responseObject) {
    logger.logTrace('WebRTC Session created');
    var session = callManager.getSessionContext(),
      sessionId,
      channelConfig;

    sessionId = responseObject && responseObject.getResponseHeader('Location') ? responseObject.getResponseHeader('Location').split('/')[4] : null;

    if (sessionId) {

      // Set WebRTC.Session data object that will be needed downstream.
      session.setSessionId(sessionId);
      // Also setup UI callbacks
      session.setUICallbacks(config);

      // setting up event callbacks using RTC Events
      app.RTCEvent.getInstance().hookupEventsToUICallbacks();
      // publish the UI callback for ready state
      app.event.publish(sessionId + '.responseEvent', {
        state:  app.SessionEvents.RTC_SESSION_CREATED,
        data:   {
          webRtcSessionId: sessionId
        }
      });

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
      logger.logTrace('Creating event channel...');
      ATT.utils.eventChannel = ATT.utils.createEventChannel(channelConfig);
      if (ATT.utils.eventChannel) {
        ATT.utils.eventChannel.startListening();
      }
    } else {
      logger.logDebug('No session id');
    }
  };

  newErrorObj = function (error, operation) {
    //look at responseObject structure on RESTClient
    //parse the json error response, get http status code, message id (svc/pol) and then lookup the error dictionary
    //get the helptext and display
    var response = error.getJson(), httpStatusCode =  error.getResponseStatus(), messageId, errObj;
    messageId = response.RequestError.ServiceException.MessageId;
    errObj = app.errorDictionary.getErrorByOpStatus("CreateSession", httpStatusCode, messageId);
    //If error object is found then make one
    if (!errObj) {
      errObj = app.errorDictionary.createError({moduleID : 'RTC',
        userErrorCode : "SDK-UNKNOWN",
        operationName : operation,
        httpStatusCode : httpStatusCode,
        errorDescription : "Unable to create Session",
        reasonText : response.RequestError.ServiceException.Text});
      logger.info("Error object not available");
      logger.info(errObj);
    }
    return errObj;
  };

  createWebRTCSessionError = function (config, error) {
    logger.logError('Error creating web rtc session: ');
    if (typeof config.onError === 'function') {
      if (error.responseText === "") {
        config.onError(app.errorDictionary.getError("SDK-10000"));
      } else {
        config.onError(newErrorObj(error, "CreateSession"));
      }
    }
  };

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
    ATT.UserMediaService.stopStream();
    ATT.utils.eventChannel.stopListening();
    var session = callManager.getSessionContext(),
      dataForDeleteWebRTCSession,
      successCallback = function (statusCode) {
        var data = {};
        if (statusCode !== 200) {
          data = {
            type : 'error',
            error : 'Failed to delete the web rtc session on blackflag'
          };
        }
        if (typeof config.success === 'function') {
          config.success(data);
        }
      };

    if (!session) {
      successCallback();
    }

    dataForDeleteWebRTCSession = {
      params: {
        url: [session.getSessionId()],
        headers: {
          'Authorization': session.getAccessToken(),
          'x-e911Id': session.getE911Id()
        }
      },
      success: function (responseObject) {
        logger.logInfo('Successfully deleted web rtc session on blackflag');
        successCallback(responseObject.getResponseStatus());
      }
    };

    logger.logTrace('Logging out...');
    // Call BF to delete WebRTC Session.
    resourceManager.doOperation('deleteWebRTCSession', dataForDeleteWebRTCSession);
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