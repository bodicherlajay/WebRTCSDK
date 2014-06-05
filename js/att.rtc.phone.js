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
    keepAlive = null,
    keepSessionAlive,
    clearSessionAlive,
    handleError,
    setupEventChannel,
    shutdownEventChannel,
    createWebRTCSessionSuccess,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logger = logMgr.getLogger('WebRTC', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);

  keepSessionAlive = function (config) {
    logger.logDebug('keepSessionAlive');

    var session = callManager.getSessionContext(),
      keepAliveDuration = app.appConfig.KeepAlive || config.keepAliveDuration, // developer configured duration overrides the one set by API server
      timeBeforeExpiration = 5 * 60 * 1000, // refresh 5 minutes before expiration
      timeout = (keepAliveDuration > timeBeforeExpiration) ? (keepAliveDuration - timeBeforeExpiration) : keepAliveDuration,
      dataForRefreshWebRTCSession;

    keepAlive = setInterval(function () {
      logger.logInfo('Trying to refresh session after ' + (timeout / 1000) + ' seconds');
      try {
        dataForRefreshWebRTCSession = {
          params: {
            url: [session.getSessionId()],
            headers: {
              'Authorization': session.getAccessToken()
            }
          },
          success: function () {
            if (typeof config.success === 'function') {
              config.success('Successfully refreshed web rtc session on blackflag');
            }
          },
          error: handleError.bind(this, 'RefreshSession', config.error)
        };

        // Call BF to refresh WebRTC Session.
        resourceManager.doOperation('refreshWebRTCSession', dataForRefreshWebRTCSession);
      } catch (err) {
        handleError.call(this, 'RefreshSession', config.error, err);
      }
    }, timeout);

  };

  clearSessionAlive = function () {
    clearInterval(keepAlive);
    keepAlive = null;
  };

  handleError = function (operation, errHandler, err) {
    clearSessionAlive();

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
  function getMediaType() {
    var mediaType = null;
    logger.logDebug('Call type Audio/Video');
    try {
      logger.logInfo('Trying to get the mediaType from the session Context ');
      mediaType = callManager.getSessionContext().getMediaType();
      logger.logInfo('Call Type : ' + mediaType);
      return mediaType;
    } catch (err) {
      throw "getMediaType: " + err;
    }
  }
  createWebRTCSessionSuccess = function (config, responseObject) {
    logger.logDebug('createWebRTCSessionSuccess');

    var sessionId = null,
      expiration = null,
      errorHandler;

    if (config.callbacks && config.callbacks.onError && typeof config.callbacks.onError === 'function') {
      errorHandler = config.callbacks.onError;
    }

    try {
      if (responseObject) {
        if (responseObject.getResponseHeader('Location')) {
          sessionId = responseObject.getResponseHeader('Location').split('/')[4];
        }
        if (responseObject.getResponseHeader('x-expires')) {
          expiration = responseObject.getResponseHeader('x-expires');
          expiration = Number(expiration);
          expiration = isNaN(expiration) ? 0 : expiration * 1000; // convert to ms
        }
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

      // keep web rtc session alive
      keepSessionAlive({
        keepAliveDuration: expiration,
        success: function (msg) {
          logger.logInfo(msg);
        },
        error: handleError.bind(this, 'RefreshSession', errorHandler)
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
   *  @param {function} loginParams.onSessionReady  Session ready callback function
   *  @param {function} loginParams.onIncomingCall  Incoming call callback function
   *  @param {function} loginParams.onCallEnded     Call ended callback function
   *  @param {function} loginParams.onCallError     Call error callback function
   *  @param {function} loginParams.onError         Error callback function
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

    if (!loginParams) {
      throw new TypeError('Cannot login to web rtc, no configuration');
    }
    if (!loginParams.token) {
      throw new TypeError('Cannot login to web rtc, no access token');
    }
    if (!loginParams.e911Id) {
      throw new TypeError('Cannot login to web rtc, no e911Id');
    }

    if (loginParams.callbacks && loginParams.callbacks.onError && typeof loginParams.callbacks.onError === 'function') {
      errorHandler = loginParams.callbacks.onError;
    }

    try {
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
  * @memberof ATT.rtc.Phone
  * @summary Performs logout on RTC Session
  * @desc
  * Logs out the user from RTC session. When invoked webRTC session gets deleted, future event channel polling
  * requests gets stopped
  * @param {Object} logoutParams
  * @param {function} logoutParams.onSuccess  callback function for onSuccess event
  * @param {function} logoutParams.onError    callback function for onError event
  * @fires ATT.rtc.Phone.logout#[RTCEvent]onSuccess  This callback gets invoked when the session gets successfully deleted
  * @fires ATT.rtc.Phone.logout#[RTCEvent]onError  This callback gets invoked while encountering issues
  * @example
  * ATT.rtc.Phone.logout({
  *   onSuccess: function(evt) {
  *   },
  *   onError: function(evt) {
  *   }
  * });
  */
  function logout(logoutParams) {
    logger.logDebug('deleteWebRTCSession');

    try {

      // stop media stream
      ATT.UserMediaService.stopStream();
      // stop event channel
      shutdownEventChannel();
      // stop refreshing session
      clearSessionAlive();

      var session = callManager.getSessionContext(),
        dataForDeleteWebRTCSession;

      if (!session) {
        if (typeof logoutParams.success === 'function') {
          logoutParams.success();
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
          if (typeof logoutParams.success === 'function') {
            logoutParams.success();
          }
        },
        error: handleError.bind(this, 'DeleteSession', logoutParams.error)
      };

    // Call BF to delete WebRTC Session.
      resourceManager.doOperation('deleteWebRTCSession', dataForDeleteWebRTCSession);
      callManager.DeleteSession();
    } catch (err) {
      callManager.DeleteSession();
      handleError.call(this, 'DeleteSession', logoutParams.error, err);
    }
  }

  /**
   * @summary
   * Make an outgoing call
   * @desc
   * Used to make outgoing call. This function takes five arguments: the destination(tel or sip uri), 
   * html element id to display the local video/audio, html element id to display remote video,
   * media constraints, configuration object with callback functions 
   * @param {Object} dialParams Dial configuration object.
   * @memberof ATT.rtc.Phone
   * @param {String} dialParams.phoneNumber
   * @param {HTMLElement} dialParams.localVideo
   * @param {HTMLElement} dialParams.remoteVideo
   * @param {Object} dialParams.mediaConstraints
   * @param {function} dialParams.onConnecting callback function for onConnecting event
   * @param {function} dialParams.onCalling    callback function for onCalling event
   * @param {function} dialParams.onCallEstablished  callback function for onCallEstablished event
   * @param {function} dialParams.onCallInProgress   callback function for onCallInProgress event
   * @param {function} dialParams.onCallHold         callback function for onCallHold event
   * @param {function} dialParams.onCallResume       callback function for onCallResume event
   * @param {function} dialParams.onCallEnded        callback function for onCallEnded event
   * @param {function} dialParams.onCallError        callback function for onCallError event
   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCalling            This callback function gets invoked immediately after dial method is invoked
   * @fires ATT.rtc.Phone.dial#[RTCEvent]onConnecting         This callback function gets invoked before the call established and after onCalling callback is invoked
   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallEstablished    This callback function gets invoked when both parties are completed negotiation and engaged in active conversation
   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallInProgress     This callback function gets invoked while encountering issue with outgoing/incoming call
   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallHold         This callback function gets invoked when hold call is successful
   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallResume         This callback function gets invoked when the current call successfully resumed
   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallEnded         This callback function gets invoked when outgoing call is ended
   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallError         This callback function gets invoked when encountering issues during outgoing call flow
   * @example
   * ATT.rtc.Phone.dial({
   *  “telephone number or sip uri”,
   *  localVideo: “localvideo”,
   *  remoteVideo: “remotevideo”,
   *  mediaConstraints: {
   *    audio:true,
   *    video:false
   *  },
   * onConnecting: function(evt) {},
   * onCalling: function(evt) {},
   * onCallEstablished: function(evt) {},
   * onCallInProgress: function(evt) {},
   * onCallHold: function(evt) {}
   * onCallResume: function(evt) {}
   * onCallEnded: function(evt) {}
   * onCallError: function(evt) {}
   * }
   * );
   */
  function dial(dialParams) {
    if (!dialParams) {
      throw new TypeError('Cannot make a web rtc call, no dial configuration');
    }
    if (!dialParams.to) {
      throw new TypeError('Cannot make a web rtc call, no destination');
    }
    if (!dialParams.mediaConstraints) {
      throw new TypeError('Cannot make a web rtc call, no media constraints');
    }
    if (!dialParams.localVideo) {
      throw new TypeError('Cannot make a web rtc call, no local media DOM element');
    }
    if (!dialParams.remoteVideo) {
      throw new TypeError('Cannot make a web rtc call, no remote media DOM element');
    }
    callManager.CreateOutgoingCall(dialParams);
    // setup callback for ringing
    callManager.onCallCreated = function () {
      logger.logInfo('onCallCreated... trigger CALLING event in the UI');
      // crate an event for Calling
      var rtcEvent = ATT.RTCEvent.getInstance(),
        session = callManager.getSessionContext(),
        callingEvent = rtcEvent.createEvent(
          { to: session && session.getCallObject() ? session.getCallObject().callee() : '',
            state: ATT.CallStatus.CALLING,
            timestamp: new Date() }
        );
      // bubble up the event
      dialParams.callbacks.onCalling(callingEvent);
    };


  }

  /**
   * @summary
   * Answer an incoming call
   * @desc
   * When call arrives via an incoming call event, call can be answered by using this method
   * @memberof ATT.rtc.Phone
   * @param {Object} answerParams
   * @param {HTMLElement} answerParams.localVideo
   * @param {HTMLElement} answerParams.remoteVideo
   * @param {Object} answerParams.mediaConstraints
   * @param {function} answerParams.onCallEstablished  callback function for onCallEstablished event
   * @param {function} answerParams.onCallInProgress   callback function for onCallInProgress event
   * @param {function} answerParams.onCallHold         callback function for onCallHold event
   * @param {function} answerParams.onCallResume       callback function for onCallResume event
   * @param {function} answerParams.onCallEnded        callback function for onCallEnded event
   * @param {function} answerParams.onCallError        callback function for onCallError event
   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallEstablished    This callback function gets invoked when both parties are completed negotiation and engaged in active conversation
   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallInProgress     This callback function gets invoked while encountering issue with incoming call
   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallHold         This callback function gets invoked when hold call is successful
   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallResume         This callback function gets invoked when the current call successfully resumed
   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallEnded         This callback function gets invoked when outgoing call is ended
   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallError         This callback function gets invoked when encountering issues during outgoing call flow
   * @example
   *  Preconditions: ATT.rtc.Phone.login() invocation is successful
   * //Example 1
   * //audio call
   * ATT.rtc.Phone.answer(
   * localVideo: “localvideo”,
   * remoteVideo: “remotevideo”,
   *   mediaConstraints: {
   *     audio:true,
   *     video:false
   *   },
   * onCallEstablished: function(evt) {},
   * onCallInProgress: function(evt) {},
   * onCallHold: function(evt) {}
   * onCallResume: function(evt) {}
   * onCallEnded: function(evt) {}
   * onCallError: function(evt) {}
   * }
    );
   */
  function answer(answerParams) {
    if (!answerParams) {
      throw new TypeError('Cannot make a web rtc call, no answer configuration');
    }
    if (!answerParams.localVideo) {
      throw new TypeError('Cannot make a web rtc call, no local media DOM element');
    }
    if (!answerParams.remoteVideo) {
      throw new TypeError('Cannot make a web rtc call, no remote media DOM element');
    }

    try {
      callManager.CreateIncomingCall(answerParams);
    } catch (e) {
      ATT.Error.publish(e, "AnswerCall");
    }
  }

  /**
   * @memberof ATT.rtc.Phone
   * @summary
   * Mutes current call stream
   * @desc
  * Mutes the local stream (video or audio)
  * @param {Object} muteParams
   * @param {function} muteParams.onSuccess
   * @param {function} muteParams.onError
   * @fires ATT.rtc.Phone.mute#[RTCEvent]onSuccess  This callback function gets invoked when mute is successful
   * @fires ATT.rtc.Phone.mute#[RTCEvent]onError    This callback function gets invoked while encountering errors
  * @example
    ATT.rtc.Phone.mute({
      onSuccess: function(evt) {},
      onError: function(evt) {}
    });
  */
  function mute(muteParams) {
    try {
      callManager.getSessionContext().getCallObject().mute();
      if (muteParams && muteParams.success) {
        muteParams.success();
      }
    } catch (e) {
      if (muteParams && muteParams.error) {
        ATT.Error.publish('SDK-20028', null, muteParams.error);
      }
    }
  }

  /**
   * @memberof ATT.rtc.Phone
   * @summary
   * Unmutes the current call stream
   * @desc
  * Unmutes the local stream
  * @param {Object} unmuteParams
   * @param {function} unmuteParams.onSuccess
   * @param {function} unmuteParams.onError
   * @fires ATT.rtc.Phone.unmute#[RTCEvent]onSuccess  This callback function gets invoked when unmute is successful
   * @fires ATT.rtc.Phone.unmute#[RTCEvent]onError    This callback function gets invoked while encountering errors
  * @example
  ATT.rtc.Phone.unmute({
      onSuccess: function(evt) {},
      onError: function(evt) {}
  });
  */
  function unmute(unmuteParams) {
    try {
      callManager.getSessionContext().getCallObject().unmute();
      if (unmuteParams && unmuteParams.success) {
        unmuteParams.success();
      }
    } catch (e) {
      if (unmuteParams && unmuteParams.error) {
        ATT.Error.publish('SDK-20029', null, unmuteParams.error);
      }
    }
  }

  /**
   * @memberof ATT.rtc.Phone
   * @summary
   * Holds the current call
   * @desc
  * Holds the current call and the other party gets notified through event channel
  * @example
  ATT.rtc.Phone.hold();
  */
  function hold() {
    try {
      callManager.getSessionContext().getCallObject().hold();
    } catch (e) {
      ATT.Error.publish('SDK-20030', null);
    }
  }

  /**
   * @memberof ATT.rtc.Phone
   * @summary
   * Resumes the current call
   * @desc
  * Resumes the current call and the other party gets notified through event channel and the call resumes
  * @example
  ATT.rtc.Phone.resume();
  */
  function resume() {
    try {
      callManager.getSessionContext().getCallObject().resume();
    } catch (e) {
      ATT.Error.publish('SDK-20031', null);
    }
  }

  /**
   * @summary
   * Hangup the current call
   * @desc
  * Hangs up the current call
  */
  function hangup() {
    try {
      callManager.getSessionContext().getCallObject().end();
    } catch (e) {
      ATT.Error.publish('SDK-20024', null);
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
    resourceManager.addPublicMethod('getMediaType', getMediaType);
    resourceManager.addPublicMethod('hangup', hangup);
    resourceManager.addPublicMethod('cleanPhoneNumber', callManager.cleanPhoneNumber);
    resourceManager.addPublicMethod('formatNumber', callManager.formatNumber);

    // TODO: For the moment expose the resourceManager so that we can stub it, this will change
    // once we apply the constructor method pattern to phone.js, instead we'll inject the callManager when
    // creating the phone object:
    // createPhone({callManager: rsrcMgr }){ ... };
    resourceManager.addPublicMethod('callManager', callManager);
  }

  // sub-namespaces on ATT.
  app.RESTClient = RESTClient;

  app.configurePublicAPIs = configurePublicAPIs;

}(ATT || {}));