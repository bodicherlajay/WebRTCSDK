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

  var factories,
    resourceManager,
    callManager,
    handleError,
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

  function getCallType() {
    var calltype = null;
    logger.logDebug('Call type Audio/Video');
    try {
      logger.logInfo('Trying to get the CallType from the session Context ');
      calltype = callManager.getSessionContext().getCallType();
      logger.logInfo('Call Type : ' + calltype);
      return calltype;
    } catch (err) {
      throw "getCallType: " + err;
    }
  }

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
      callbacks,
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
      callbacks = loginParams.callbacks;

      //remove video service for audio only service
      if (loginParams.audioOnly) {
        services = services.slice(0, 1);
      }

      callManager.startSession({
        factories: factories,
        token: token,
        e911Id: e911Id,
        callbacks: callbacks,
        onSessionStarted: function (sessObj) {
          session = sessObj;
          // TODO: Need better way to handle callbacks
          callbacks.onSessionReady({
            data: {
              sessionId: session.getSessionId()
            }
          });
        },
        onError: handleError.bind(this, 'CreateSession', errorHandler)
      })

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
      // stop refreshing session
      clearSessionAlive();

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
  function dial(dialParams) {

    // setup callback for ringing
    callManager.onCallCreated = function () {
      logger.logInfo('onCallCreated... trigger RINGING event in the UI');
      // crate an event for Ringing
      var rtcEvent = ATT.RTCEvent.getInstance(),
        session = callManager.getSessionContext(),
        ringingEvent = rtcEvent.createEvent(
          { to: session && session.getCallObject() ? session.getCallObject().callee() : '',
            state: ATT.CallStatus.CALLING,
            timestamp: new Date() }
        );
      // bubble up the event
      dialParams.callbacks.onCalling(ringingEvent);
    };

    try {
      if (!dialParams) {
        throw 'Cannot make a web rtc call, no dial configuration';
      }
      if (!dialParams.to) {
        throw 'Cannot make a web rtc call, no destination';
      }
      if (!dialParams.mediaConstraints) {
        throw 'Cannot make a web rtc call, no media constraints';
      }
      if (!dialParams.localVideo) {
        throw 'Cannot make a web rtc call, no local media DOM element';
      }
      if (!dialParams.remoteVideo) {
        throw 'Cannot make a web rtc call, no remote media DOM element';
      }
      callManager.CreateOutgoingCall(dialParams);
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
  function answer(answerParams) {
    try {
      if (!answerParams) {
        throw 'Cannot make a web rtc call, no answer configuration';
      }
      // if (!answerParams.mediaConstraints) {
        // throw 'Cannot make a web rtc call, no media constraints';
      // }
      if (!answerParams.localVideo) {
        throw 'Cannot make a web rtc call, no local media DOM element';
      }
      if (!answerParams.remoteVideo) {
        throw 'Cannot make a web rtc call, no remote media DOM element';
      }
      callManager.CreateIncomingCall(answerParams);
    } catch (e) {
      ATT.Error.publish(e, "AnswerCall");
    }
  }

  /**
  * Mutes the local stream (video or audio)
  * @param {Object} options The callback options
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.mute();
  */
  function mute(options) {
    try {
      callManager.getSessionContext().getCallObject().mute();
      if (options && options.success) {
        options.success();
      }
    } catch (e) {
      if (options && options.error) {
        ATT.Error.publish('SDK-20028', null, options.error);
      }
    }
  }

  /**
  * Unmutes the local stream
  * @param {Object} options The callback options
  * @memberof ATT.rtc.Phone
  * @example 
  ATT.rtc.Phone.unmute();
  */
  function unmute(options) {
    try {
      callManager.getSessionContext().getCallObject().unmute();
      if (options && options.success) {
        options.success();
      }
    } catch (e) {
      if (options && options.error) {
        ATT.Error.publish('SDK-20029', null, options.error);
      }
    }
  }

  /**
  * Holds the current call and the other party gets notified through event channel
  * @memberof ATT.rtc.Phone
  * @param {Object} options The UI options
  * @example 
  ATT.rtc.Phone.hold();
  */
  function hold(options) {
    try {
      callManager.getSessionContext().getCallObject().hold(options);
      if (options && options.success) {
        options.success();
      }
    } catch (e) {
      if (options && options.error) {
        ATT.Error.publish('SDK-20030', null, options.error);
      }
    }
  }

  /**
  * Resumes the current call and the other party gets notified through event channel and the call resumes
  * @memberof ATT.rtc.Phone
  * @param {Object} options The UI options
  * @example  
  ATT.rtc.Phone.resume();
  */
  function resume(options) {
    try {
      callManager.getSessionContext().getCallObject().resume(options);
      if (options && options.success) {
        options.success();
      }
    } catch (e) {
      if (options && options.error) {
        ATT.Error.publish('SDK-20031', null, options.error);
      }
    }
  }

  /**
  * Hangs up the current call
  * @param {Object} options The callback options
  */
  function hangup(options) {
    try {
      callManager.getSessionContext().getCallObject().end(options);
    } catch (e) {
      if (options && options.error) {
        ATT.Error.publish('SDK-20024', null, options.error);
      }
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
    //resourceManager.addPublicMethod('initCallback', initCallbacks);
    resourceManager.addPublicMethod('getCallType', getCallType);
    resourceManager.addPublicMethod('hangup', hangup);
    //resourceManager.addPublicMethod('cleanPhoneNumber', callManager.cleanPhoneNumber);
  }

 
  function createPhone (options) {
    factories = options.factories;
    callManager = options.rtcManager;
    resourceManager = options.resourceManager;

    // sub-namespaces on ATT.
    app.RESTClient = RESTClient;
  
    app.configurePublicAPIs = configurePublicAPIs;
  }

  app.factories.createPhone = createPhone;

}(ATT || {}));