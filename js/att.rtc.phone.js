/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */

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
(function () {
  'use strict';

//    logMgr = ATT.logManager.getInstance(),
//    logger;
//
//  logger = logMgr.getLogger('WebRTC', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);

//  function handleError(operation, errHandler, err) {
//    logger.logDebug('handleError: ' + operation);
//    logger.logInfo('There was an error performing operation ' + operation);
//
//    var error = ATT.Error.create(err, operation);
//
//    if (typeof errHandler === 'function') {
//      ATT.Error.publish(error, operation, errHandler);
//    }
//  }
//
//  function getMediaType() {
//    var mediaType = null;
//    logger.logDebug('Call type Audio/Video');
//    try {
//      logger.logInfo('Trying to get the mediaType from the session Context ');
//
//      if (rtcManager && rtcManager.getSession() && rtcManager.getSession().getCurrentCall()) {
//        mediaType = rtcManager.getSession().getCurrentCall().getMediaType();
//      }
//      logger.logInfo('Media Type : ' + mediaType);
//      return mediaType;
//    } catch (err) {
//      throw "getMediaType: " + err;
//    }
//  }
//
//  /**
//    * @summary Performs RTC login
//    * @desc Used to establish webRTC session so that the user can place webRTC calls.
//    * The service parameter indicates the desired service such as audio or video call
//    * @memberof ATT.rtc.Phone
//    * @param {Object} loginParams Login parameters
//    * @param {String} loginParams.token  Access token
//    * @param {String} [loginParams.e911Id] E911 Id. Optional parameter for NoTN users. Required for ICMN and VTN users
//    * @param {Boolean} [loginParams.audioOnly] Set this value to true for audio service.
//    *        Optional parameter to indicate only audio service is needed for the session
//   *  @param {function} loginParams.onSessionReady  Session ready callback function
//   *  @param {function} loginParams.onIncomingCall  Incoming call callback function
//   *  @param {function} loginParams.onCallEnded     Call ended callback function
//   *  @param {function} loginParams.onCallError     Call error callback function
//   *  @param {function} loginParams.onError         Error callback function
//    * @fires ATT.rtc.Phone.login#[RTCEvent]OnSessionReady  This callback gets invoked when SDK is initialized and ready to make, receive calls
//    * @fires ATT.rtc.Phone.login#[RTCEvent]OnIncomingCall  This callback gets invoked when incoming call event is received
//    * @fires ATT.rtc.Phone.login#[RTCEvent]OnCallEnded     This callback gets invoked when outgoing/incoming call is ended
//    * @fires ATT.rtc.Phone.login#[RTCEvent]OnCallError     This callback gets invoked while encountering issue with outgoing/incoming call
//    * @fires ATT.rtc.Phone.login#[RTCEvent]OnError         This callback gets invoked while encountering issues during login process
//    * @example
//    *
//    * ATT.rtc.Phone.login({
//    *       token: 'accessToken',
//    *       e911Id: 'e911Identifer',
//    *       audioOnly: true,
//    *       onSessionReady : function (event) {
//    *
//    *       },
//    *       onIncomingCall : function (event) {
//    *       },
//    *       onCallEnded : function (event) {
//    *       },
//    *       onCallError :  function (event) {
//    *       ,
//    *       onError : function (error) {
//    *         error.userErrorCode
//    *         error.helpText
//    *         error.errorDescription);
//    *     }
//   */
//  function login(loginParams) {
//    logger.logDebug('createWebRTCSession');
//    var token,
//      e911Id,
//      callbacks,
//      services = ['ip_voice_call', 'ip_video_call'],
//      errorHandler;
//
//    if (!loginParams) {
//      throw new TypeError('Cannot login to web rtc, no configuration');
//    }
//    if (!loginParams.token) {
//      throw new TypeError('Cannot login to web rtc, no access token');
//    }
//    if (!loginParams.e911Id) {
//      throw new TypeError('Cannot login to web rtc, no e911Id');
//    }
//
//    try {
//      if (loginParams.callbacks && loginParams.callbacks.onError && typeof loginParams.callbacks.onError === 'function') {
//        errorHandler = loginParams.callbacks.onError;
//      }
//
//
//      // todo: need to decide if callbacks should be mandatory
//      if (!loginParams.callbacks || Object.keys(loginParams.callbacks) <= 0) {
//        logger.logWarning('No UI callbacks specified');
//      }
//
//      token = loginParams.token;
//      e911Id = loginParams.e911Id || null;
//      callbacks = loginParams.callbacks;
//
//      //remove video service for audio only service
//      if (loginParams.audioOnly) {
//        services = services.slice(0, 1);
//      }
//
//      rtcManager.connectSession({
//        factories: factories,
//        token: token,
//        e911Id: e911Id,
//        onCallbackCalled: function (callback, event) {
//          try {
//            if (!callback) {
//              throw 'Null callback called';
//            }
//            if (!event) {
//              throw 'Callback called with empty event';
//            }
//            if (callbacks.hasOwnProperty(callback) && typeof callbacks[callback] === 'function') {
//              logger.logInfo(callback + ' trigger');
//              callbacks[callback](event);
//            }
//          } catch (err) {
//            handleError.call(this, 'CreateSession', errorHandler, err);
//          }
//        },
//        onError: handleError.bind(this, 'CreateSession', errorHandler)
//      });
//
//    } catch (err) {
//      handleError.call(this, 'CreateSession', errorHandler, err);
//    }
//  }
//
// /**
//  * @memberof ATT.rtc.Phone
//  * @summary Performs logout on RTC Session
//  * @desc
//  * Logs out the user from RTC session. When invoked webRTC session gets deleted, future event channel polling
//  * requests gets stopped
//  * @param {Object} logoutParams
//  * @param {function} logoutParams.onSuccess  callback function for onSuccess event
//  * @param {function} logoutParams.onError    callback function for onError event
//  * @fires ATT.rtc.Phone.logout#[RTCEvent]onSuccess  This callback gets invoked when the session gets successfully deleted
//  * @fires ATT.rtc.Phone.logout#[RTCEvent]onError  This callback gets invoked while encountering issues
//  * @example
//  * ATT.rtc.Phone.logout({
//  *   onSuccess: function(evt) {
//  *   },
//  *   onError: function(evt) {
//  *   }
//  * });
//  */
//  function logout(logoutParams) {
//    logger.logDebug('deleteWebRTCSession');
//
//    try {
//      if (!rtcManager) {
//        throw 'Unable to logout from web rtc. There is no valid RTC manager to perform this operation';
//      }
//
//      rtcManager.disconnectSession({
//        onSessionDeleted: function () {
//          logger.logInfo('Successfully deleted web rtc session on blackflag');
//          if (typeof logoutParams.onLogout === 'function') {
//            logoutParams.onLogout();
//          }
//        },
//        onError: handleError.bind(this, 'DeleteSession', logoutParams.onError)
//      });
//
//    } catch (err) {
//      handleError.call(this, 'DeleteSession', logoutParams.onError, err);
//    }
//  }
//
//  /**
//   * @summary
//   * Make an outgoing call
//   * @desc
//   * Used to make outgoing call. This function takes five arguments: the destination(tel or sip uri),
//   * html element id to display the local video/audio, html element id to display remote video,
//   * media constraints, configuration object with callback functions
//   * @param {Object} dialParams Dial configuration object.
//   * @memberof ATT.rtc.Phone
//   * @param {String} dialParams.phoneNumber
//   * @param {HTMLElement} dialParams.localVideo
//   * @param {HTMLElement} dialParams.remoteVideo
//   * @param {Object} dialParams.mediaConstraints
//   * @param {function} dialParams.onConnecting callback function for onConnecting event
//   * @param {function} dialParams.onCalling  callback function for onCalling event
//   * @param {function} dialParams.onCallEstablished  callback function for onCallEstablished event
//   * @param {function} dialParams.onCallInProgress   callback function for onCallInProgress event
//   * @param {function} dialParams.onCallHold callback function for onCallHold event
//   * @param {function} dialParams.onCallResume callback function for onCallResume event
//   * @param {function} dialParams.onCallEnded callback function for onCallEnded event
//   * @param {function} dialParams.onCallError callback function for onCallError event
//   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCalling This callback function gets invoked immediately after dial method is invoked
//   * @fires ATT.rtc.Phone.dial#[RTCEvent]onConnecting This callback function gets invoked before the call
//   *                                                          established and after onCalling callback is invoked
//   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallEstablished    This callback function gets invoked when both
//   *                                                          parties are completed negotiation and engaged in active conversation
//   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallInProgress This callback function gets invoked while encountering issue with outgoing/incoming call
//   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallHold This callback function gets invoked when hold call is successful
//   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallResume This callback function gets invoked when the current call successfully resumed
//   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallEnded This callback function gets invoked when outgoing call is ended
//   * @fires ATT.rtc.Phone.dial#[RTCEvent]onCallError This callback function gets invoked when encountering issues during outgoing call flow
//   * @example
//   * ATT.rtc.Phone.dial({
//   *  “telephone number or sip uri”,
//   *  localVideo: “localvideo”,
//   *  remoteVideo: “remotevideo”,
//   *  mediaConstraints: {
//   *    audio:true,
//   *    video:false
//   *  },
//   * onConnecting: function(evt) {},
//   * onCalling: function(evt) {},
//   * onCallEstablished: function(evt) {},
//   * onCallInProgress: function(evt) {},
//   * onCallHold: function(evt) {}
//   * onCallResume: function(evt) {}
//   * onCallEnded: function(evt) {}
//   * onCallError: function(evt) {}
//   * }
//   * );
//   */
//  function dial(dialParams) {
//    if (!dialParams) {
//      throw new TypeError('Cannot make a web rtc call, no dial configuration');
//    }
//    if (!dialParams.to) {
//      throw new TypeError('Cannot make a web rtc call, no destination');
//    }
//    if (!dialParams.mediaConstraints) {
//      throw new TypeError('Cannot make a web rtc call, no media constraints');
//    }
//    if (!dialParams.localVideo) {
//      throw new TypeError('Cannot make a web rtc call, no local media DOM element');
//    }
//    if (!dialParams.remoteVideo) {
//      throw new TypeError('Cannot make a web rtc call, no remote media DOM element');
//    }
//    var callbacks,
//      errorHandler;
//    try {
//      if (!rtcManager) {
//        throw 'Unable to dial a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//
//      callbacks = dialParams.callbacks;
//      errorHandler = dialParams.callbacks.onCallError;
//
//      rtcManager.dialCall(ATT.utils.extend(dialParams, {
//        factories: factories,
//        onCallbackCalled: function (callback, event) {
//          try {
//            if (!callback) {
//              throw 'Null callback called';
//            }
//            if (!event) {
//              throw 'Callback called with empty event';
//            }
//            if (callbacks.hasOwnProperty(callback) && typeof callbacks[callback] === 'function') {
//              logger.logInfo(callback + ' trigger');
//
//              callbacks[callback](event);
//            }
//          } catch (err) {
//            handleError.call(this, 'StartCall', errorHandler, err);
//          }
//        },
//        onCallError: handleError.bind(this, 'StartCall', errorHandler)
//      }));
//    } catch (err) {
//      handleError.call(this, 'StartCall', errorHandler, err);
//    }
//  }
//
//  /**
//   * @summary
//   * Answer an incoming call
//   * @desc
//   * When call arrives via an incoming call event, call can be answered by using this method
//   * @memberof ATT.rtc.Phone
//   * @param {Object} answerParams
//   * @param {HTMLElement} answerParams.localVideo
//   * @param {HTMLElement} answerParams.remoteVideo
//   * @param {Object} answerParams.mediaConstraints
//   * @param {function} answerParams.onCallEstablished  callback function for onCallEstablished event
//   * @param {function} answerParams.onCallInProgress   callback function for onCallInProgress event
//   * @param {function} answerParams.onCallHold         callback function for onCallHold event
//   * @param {function} answerParams.onCallResume       callback function for onCallResume event
//   * @param {function} answerParams.onCallEnded        callback function for onCallEnded event
//   * @param {function} answerParams.onCallError        callback function for onCallError event
//   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallEstablished    This callback function gets invoked when both parties are completed negotiation
//   *                                                            and engaged in active conversation
//   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallInProgress This callback function gets invoked while encountering issue with incoming call
//   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallHold This callback function gets invoked when hold call is successful
//   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallResume This callback function gets invoked when the current call successfully resumed
//   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallEnded This callback function gets invoked when outgoing call is ended
//   * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallError This callback function gets invoked when encountering issues during outgoing call flow
//   * @example
//   *  Preconditions: ATT.rtc.Phone.login() invocation is successful
//   * //Example 1
//   * //audio call
//   * ATT.rtc.Phone.answer(
//   * localVideo: “localvideo”,
//   * remoteVideo: “remotevideo”,
//   *   mediaConstraints: {
//   *     audio:true,
//   *     video:false
//   *   },
//   * onCallEstablished: function(evt) {},
//   * onCallInProgress: function(evt) {},
//   * onCallHold: function(evt) {}
//   * onCallResume: function(evt) {}
//   * onCallEnded: function(evt) {}
//   * onCallError: function(evt) {}
//   * }
//    );
//   */
//  function answer(answerParams) {
//    if (!answerParams) {
//      throw new TypeError('Cannot make a web rtc call, no answer configuration');
//    }
//    // if (!answerParams.mediaConstraints) {
//      // throw 'Cannot make a web rtc call, no media constraints';
//    // }
//    if (!answerParams.localVideo) {
//      throw new TypeError('Cannot make a web rtc call, no local media DOM element');
//    }
//    if (!answerParams.remoteVideo) {
//      throw new TypeError('Cannot make a web rtc call, no remote media DOM element');
//    }
//
//    var callbacks, errorHandler;
//
//    try {
//      if (!rtcManager) {
//        throw 'Unable to dial a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//
//      callbacks = answerParams.callbacks;
//      errorHandler = answerParams.callbacks.onCallError;
//
//      rtcManager.answerCall(ATT.utils.extend(answerParams, {
//        factories: factories,
//        onCallbackCalled: function (callback, event) {
//          try {
//            if (!callback) {
//              throw 'Null callback called';
//            }
//            if (!event) {
//              throw 'Callback called with empty event';
//            }
//            if (callbacks.hasOwnProperty(callback) && typeof callbacks[callback] === 'function') {
//              logger.logInfo(callback + ' trigger');
//
//              callbacks[callback](event);
//            }
//          } catch (err) {
//            handleError.call(this, 'AnswerCall', errorHandler, err);
//          }
//        },
//        onCallError: handleError.bind(this, 'AnswerCall', errorHandler)
//      }));
//    } catch (e) {
//      ATT.Error.publish(e, "AnswerCall");
//    }
//  }
//
//
//  /**
//   * @memberof ATT.rtc.Phone
//   * @summary
//   * Mutes current call stream
//   * @desc
//  * Mutes the local stream (video or audio)
//  * @param {Object} muteParams
//   * @param {function} muteParams.onSuccess
//   * @param {function} muteParams.onError
//   * @fires ATT.rtc.Phone.mute#[RTCEvent]onSuccess  This callback function gets invoked when mute is successful
//   * @fires ATT.rtc.Phone.mute#[RTCEvent]onError    This callback function gets invoked while encountering errors
//  * @example
//    ATT.rtc.Phone.mute({
//      onSuccess: function(evt) {},
//      onError: function(evt) {}
//    });
//  */
//  function mute(muteParams) {
//    try {
//      if (!rtcManager) {
//        throw 'Unable to resume a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//      rtcManager.muteCall();
//    } catch (e) {
//      if (muteParams && muteParams.error) {
//        ATT.Error.publish('SDK-20028', null, muteParams.error);
//      }
//    }
//  }
//
//  /**
//   * @memberof ATT.rtc.Phone
//   * @summary
//   * Unmutes the current call stream
//   * @desc
//  * Unmutes the local stream
//  * @param {Object} unmuteParams
//   * @param {function} unmuteParams.onSuccess
//   * @param {function} unmuteParams.onError
//   * @fires ATT.rtc.Phone.unmute#[RTCEvent]onSuccess  This callback function gets invoked when unmute is successful
//   * @fires ATT.rtc.Phone.unmute#[RTCEvent]onError    This callback function gets invoked while encountering errors
//  * @example
//  ATT.rtc.Phone.unmute({
//      onSuccess: function(evt) {},
//      onError: function(evt) {}
//  });
//  */
//  function unmute(unmuteParams) {
//    try {
//      if (!rtcManager) {
//        throw 'Unable to resume a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//      rtcManager.unmuteCall();
//    } catch (e) {
//      if (unmuteParams && unmuteParams.error) {
//        ATT.Error.publish('SDK-20029', null, unmuteParams.error);
//      }
//    }
//  }
//
//  /**
//   * @memberof ATT.rtc.Phone
//   * @summary
//   * Holds the current call
//   * @desc
//  * Holds the current call and the other party gets notified through event channel
//  * @example
//  ATT.rtc.Phone.hold();
//  */
//  function hold() {
//    try {
//      if (!rtcManager) {
//        throw 'Unable to resume a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//      rtcManager.holdCall();
//    } catch (e) {
//      ATT.Error.publish('SDK-20030', null);
//    }
//  }
//
//  /**
//   * @memberof ATT.rtc.Phone
//   * @summary
//   * Resumes the current call
//   * @desc
//  * Resumes the current call and the other party gets notified through event channel and the call resumes
//  * @example
//  ATT.rtc.Phone.resume();
//  */
//  function resume() {
//    try {
//      if (!rtcManager) {
//        throw 'Unable to resume a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//      rtcManager.resumeCall();
//    } catch (e) {
//      ATT.Error.publish('SDK-20031', null);
//    }
//  }
//
//  /**
//   * @summary
//   * Hangup the current call
//   * @desc
//  * Hangs up the current call
//  */
//  function hangup() {
//    try {
//      if (!rtcManager) {
//        throw 'Unable to dial a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//      rtcManager.hangupCall();
//    } catch (e) {
//      ATT.Error.publish('SDK-20024', null);
//    }
//  }
//
//  /**
//   * @summary
//   * Cancel an outgoing call before it's completed.
//   * @desc
//   * Similar to hangup, but before the call is connected.
//   */
//  function cancel() {
//    try {
//      rtcManager.cancelCall();
//    } catch (e) {
//      ATT.Error.publish('SDK-20034', null);
//    }
//  }
//
//  /**
//   * @summary
//   * Reject an incoming call
//   * @desc
//  * Rejects an incoming call
//  */
//  function reject() {
//    try {
//      if (!rtcManager) {
//        throw 'Unable to reject a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//      rtcManager.rejectCall();
//    } catch (e) {
//      ATT.Error.publish('SDK-20035', null);
//    }
//  }
//
//    /**
//    * @summary
//    * Refresh session on E911 Address Update
//    * @desc
//    * When we have a E911ID we can update the session with the latest E911ID using this method
//    * @memberof ATT.rtc.Phone
//    * @param {Object} args
//    * @param {function} args.onCallError        callback function for onCallError event
//    * @fires ATT.rtc.Phone.answer#[RTCEvent]onCallError This callback function gets invoked when encountering issues during outgoing call flow
//    * @example
//    *  Preconditions: ATT.rtc.Phone.login() invocation is successful
//    * //Example 1
//    * //audio call
//    * ATT.rtc.Phone.updateE911Id(
//    * e911Id: “e911Id”,
//    * onCallEnded: function(evt) {}
//    * onCallError: function(evt) {}
//    * }
//    );
//    */
//
//  function updateE911Id(args) {
//    try {
//      if (!args.e911Id || args.e911Id.trim().length === 0) {
//        throw new TypeError('E911Id Parameter Missing');
//      }
//      if (!rtcManager) {
//        throw 'Unable to reject a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//      rtcManager.refreshSessionWithE911ID(args);
//    } catch (e) {
//      ATT.Error.publish('SDK-20036', null);
//    }
//  }

  function Phone() {

    var emitter = ATT.private.factories.createEventEmitter(),
      session = new ATT.rtc.Session(),
      call = null;

    session.on('call-incoming', function () {
      emitter.publish('call-incoming');
    });

    function getSession() {
      return session;
    }

    function getCall() {
      return call;
    }

    function on(event, handler) {
      if ('session-ready' !== event
          && 'session-disconnected' !== event
          && 'call-dialing' !== event
          && 'call-answering' !== event
          && 'call-incoming' !== event
          && 'call-connecting' !== event
          && 'call-disconnecting' !== event
          && 'call-canceled' !== event
          && 'call-rejected' !== event
          && 'call-connected' !== event
          && 'call-muted' !== event
          && 'call-unmuted' !== event
          && 'call-established' !== event
          && 'call-ended' !== event
          && 'call-error' !== event) {
        throw new Error('Event not defined');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }

    function login(options) {
      if (undefined === options) {
        throw new Error('Options not defined');
      }
      if (undefined === options.token) {
        throw new Error('Token not defined');
      }

      session.on('ready', function (data) {
        emitter.publish('session-ready', data);
      });

      session.connect(options);
    }

    function logout() {
      session.on('disconnected', function (data) {
        emitter.publish('session-disconnected', data);
      });

      session.disconnect();
    }

    function dial(options) {

      if (undefined === options) {
        throw new Error('Options not defined');
      }

      if (undefined === options.localMedia) {
        throw new Error('localMedia not defined');
      }

      if (undefined === options.remoteMedia) {
        throw new Error('remoteMedia not defined');
      }

      if (undefined === options.destination) {
        throw new Error('Destination not defined');
      }

      call = session.createCall({
        peer: options.destination,
        type: ATT.CallTypes.OUTGOING,
        mediaType: options.mediaType,
        localMedia: options.localMedia,
        remoteMedia: options.remoteMedia
      });

      call.on('dialing', function () {
        emitter.publish('call-dialing');
      });
      call.on('connecting', function () {
        emitter.publish('call-connecting');
      });
      call.on('canceled', function () {
        emitter.publish('call-canceled');
      });
      call.on('rejected', function () {
        emitter.publish('call-rejected');
      });
      call.on('connected', function () {
        emitter.publish('call-connected');
      });
      call.on('established', function () {
        emitter.publish('call-established');
      });
      call.on('ended', function () {
        emitter.publish('call-ended');
      });
      call.on('error', function () {
        emitter.publish('call-error');
      });

      call.connect(options);
    }

    function answer(options) {

      if (undefined === options) {
        throw new Error('Options not defined');
      }

      if (undefined === options.localMedia) {
        throw new Error('localMedia not defined');
      }

      if (undefined === options.remoteMedia) {
        throw new Error('remoteMedia not defined');
      }

      call = session.currentCall;

      if (call === undefined || call === null) {
        throw new Error('Call object not defined');
      }

      call.on('answering', function () {
        emitter.publish('call-answering');
      });

      call.connect(options);
    }

    function mute () { 
      call.on('muted', function () {
        emitter.publish('call-muted');
      });

      call.mute();
    }

    function unmute () {
      call.on('unmuted', function () {
        emitter.publish('call-unmuted');
      });

      call.unmute();
    }

    function getMediaType() {
      return call ? call.mediaType : null;
    }

    function hangup() {
      call.on('disconnecting', function () {
        emitter.publish('call-disconnecting');
      });
      session.on('call-disconnected', function () {

      });
      call.disconnect();
    }

    this.on = on.bind(this);
    this.getSession = getSession.bind(this);
    this.getCall = getCall.bind(this);
    this.login = login.bind(this);
    this.logout = logout.bind(this);
    this.dial = dial.bind(this);
    this.answer = answer.bind(this);
    this.mute = mute.bind(this);
    this.unmute = unmute.bind(this);
    this.getMediaType = getMediaType.bind(this);
    this.hangup = hangup.bind(this);
    this.cleanPhoneNumber = ATT.phoneNumber.cleanPhoneNumber;
    this.formatNumber = ATT.phoneNumber.formatNumber;
  }


  if (undefined === ATT.private) {
    throw new Error('Error exporting ATT.private.Phone.');
  }
  ATT.private.Phone = Phone;

  if (undefined === ATT.rtc) {
    throw new Error('Error exporting ATT.rtc.Phone.');
  }
  ATT.rtc.Phone = (function () {
    var instance;

    return {
      getPhone: function () {
        if (undefined === instance) {
          instance = new ATT.private.Phone();
        }
        return instance;
      }
    };
  }());

}());
