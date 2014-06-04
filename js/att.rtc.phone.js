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
    rtcManager,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logger = logMgr.getLogger('WebRTC', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);

  function handleError(operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);
    logger.logInfo('There was an error performing operation ' + operation);

    var error = ATT.Error.create(err, operation);

    if (typeof errHandler === 'function') {
      ATT.Error.publish(error, operation, errHandler);
    }
  };

  function getMediaType() {
    var mediaType = null;
    logger.logDebug('Call type Audio/Video');
    try {
      logger.logInfo('Trying to get the mediaType from the session Context ');
      mediaType = rtcManager.getSessionContext().getMediaType();
      logger.logInfo('Call Type : ' + mediaType);
      return mediaType;
    } catch (err) {
      throw "getMediaType: " + err;
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
      callbacks,
      services = ['ip_voice_call', 'ip_video_call'],
      errorHandler;

    try {
      if (loginParams.callbacks && loginParams.callbacks.onError && typeof loginParams.callbacks.onError === 'function') {
        errorHandler = loginParams.callbacks.onError;
      }

      if (!loginParams) {
        throw 'Cannot login to web rtc, no configuration';
      }
      if (!loginParams.token) {
        throw 'Cannot login to web rtc, no access token';
      }
      if (!rtcManager) {
        throw 'Unable to login to web rtc. There is no valid RTC manager to perform this operation';
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

      rtcManager.startSession({
        factories: factories,
        token: token,
        e911Id: e911Id,
        callbacks: callbacks,
        onSessionStarted: function (sessObj) {
          session = sessObj;
          if (typeof callbacks.onSessionReady === 'function') {
            // TODO: Need better way to handle callbacks
            callbacks.onSessionReady({
              data: {
                sessionId: session.getSessionId()
              }
            });
          }
        },
        onError: handleError.bind(this, 'CreateSession', errorHandler)
      })

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
      if (!rtcManager) {
        throw 'Unable to logout from web rtc. There is no valid RTC manager to perform this operation';
      }

      rtcManager.deleteSession({
        onSessionDeleted: function () {
          logger.logInfo('Successfully deleted web rtc session on blackflag');
          if (typeof logoutParams.onLogout === 'function') {
            logoutParams.onLogout();
          }
        },
        onError: handleError.bind(this, 'DeleteSession', logoutParams.onError)
      })

    } catch (err) {
      handleError.call(this, 'DeleteSession', logoutParams.onError, err);
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

    // setup callback for ringing
    rtcManager.onCallCreated = function () {
      logger.logInfo('onCallCreated... trigger CALLING event in the UI');
      // crate an event for Calling
      var rtcEvent = ATT.RTCEvent.getInstance(),
        session = rtcManager.getSessionContext(),
        callingEvent = rtcEvent.createEvent({
          to: session && session.getCallObject() ? session.getCallObject().callee() : '',
          state: ATT.CallStatus.CALLING,
          timestamp: new Date()
        });
      // bubble up the event
      dialParams.callbacks.onCalling(callingEvent);
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
      rtcManager.CreateOutgoingCall(dialParams);
    } catch (e) {
      ATT.Error.publish(e);
    }
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
      rtcManager.CreateIncomingCall(answerParams);
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
      rtcManager.getSessionContext().getCallObject().mute();
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
      rtcManager.getSessionContext().getCallObject().unmute();
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
  * @param {Object} holdParams
   * @param {function} holdParams.onSuccess
   * @param {function} holdParams.onError
   * @fires ATT.rtc.Phone.hold#[RTCEvent]onSuccess  This callback function gets invoked when hold is successful
   * @fires ATT.rtc.Phone.hold#[RTCEvent]onError    This callback function gets invoked while encountering errors
  * @example
  ATT.rtc.Phone.hold({
      onSuccess: function(evt) {},
      onError: function(evt) {}
  });
  */
  function hold(holdParams) {
    try {
      rtcManager.getSessionContext().getCallObject().hold(holdParams);
      if (holdParams && holdParams.success) {
        holdParams.success();
      }
    } catch (e) {
      if (holdParams && holdParams.error) {
        ATT.Error.publish('SDK-20030', null, holdParams.error);
      }
    }
  }

  /**
   * @memberof ATT.rtc.Phone
   * @summary
   * Resumes the current call
   * @desc
  * Resumes the current call and the other party gets notified through event channel and the call resumes
  * @param {Object} resumeParams
   * @param {function} resumeParams.onSuccess
   * @param {function} resumeParams.onError
   * @fires ATT.rtc.Phone.resume#[RTCEvent]onSuccess  This callback function gets invoked when resume is successful
   * @fires ATT.rtc.Phone.resume#[RTCEvent]onError    This callback function gets invoked while encountering errors
  * @example
  ATT.rtc.Phone.resume({
      onSuccess: function(evt) {},
      onError: function(evt) {}
  });
  */
  function resume(resumeParams) {
    try {
      rtcManager.getSessionContext().getCallObject().resume(resumeParams);
      if (resumeParams && resumeParams.success) {
        resumeParams.success();
      }
    } catch (e) {
      if (resumeParams && resumeParams.error) {
        ATT.Error.publish('SDK-20031', null, resumeParams.error);
      }
    }
  }

  /**
   * @summary
   * Hangup the current call
   * @desc
  * Hangs up the current call
  * @param {Object} hangupParams The callback options
   * @param {function} hangupParams.onSuccess
   * @param {function} hangupParams.onError
   * @fires ATT.rtc.Phone.hangup#[RTCEvent]onSuccess  This callback function gets invoked when hangup is successful
   * @fires ATT.rtc.Phone.hangup#[RTCEvent]onError    This callback function gets invoked while encountering errors
  */
  function hangup(hangupParams) {
    try {
      rtcManager.getSessionContext().getCallObject().end(hangupParams);
    } catch (e) {
      if (hangupParams && hangupParams.error) {
        ATT.Error.publish('SDK-20024', null, hangupParams.error);
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
    resourceManager.addPublicMethod('getMediaType', getMediaType);
    resourceManager.addPublicMethod('hangup', hangup);
    //resourceManager.addPublicMethod('cleanPhoneNumber', rtcManager.cleanPhoneNumber);

    // TODO: For the moment expose the resourceManager so that we can stub it, this will change
    // once we apply the constructor method pattern to phone.js, instead we'll inject the rtcManager when
    // creating the phone object:
    // createPhone({rtcManager: rsrcMgr }){ ... };
    resourceManager.addPublicMethod('rtcManager', rtcManager);
  }

 
  function createPhone (options) {
    factories = options.factories;
    rtcManager = options.rtcManager;
    resourceManager = options.resourceManager;

    // sub-namespaces on ATT.
    app.RESTClient = RESTClient;
  
    app.configurePublicAPIs = configurePublicAPIs;
  }

  app.factories.createPhone = createPhone;

}(ATT || {}));