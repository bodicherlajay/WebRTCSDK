/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true*/

cmgmt = (function () {
  'use strict';

  var module = {}, logMgr = ATT.logManager.getInstance(), logger, Call, SessionState,
    SessionContext, session_context, CreateSession, CreateOutgoingCall, CreateIncomingCall,
    instance, init, DeleteSession, DeleteCallObject;
  logMgr.configureLogger('CallManagementModule', logMgr.loggerType.CONSOLE, logMgr.logLevel.DEBUG);
  logger = logMgr.getLogger('CallManagementModule');

  /**
  * Call Prototype
  * @param {String} to The caller
  * @param {String} to The callee
  * @param {String} media 'audio' or 'video'
  */
  Call = function (from, to, media) {
    var caller = from, callee = to, mediaType = media, localSDP = null;
    logger.logTrace('call method started, from: ' + from + ', to: ' + to + ', media type: ' + media);

    return {
      caller: function () { return caller; },
      callee: function () { return callee; },
      mediaType: function () { return mediaType; },
      setSDP: function (sdp) {
        localSDP = sdp;
      },
      getSDP: function () {
        return localSDP;
      },
      start: Call.start,
      hold: Call.hold,
      resume: Call.resume,
      mute: Call.mute,
      unmute: Call.unmute,
      end: Call.hangup
    };
  };
  //Session state enumeration
  SessionState = {
    OUTGOING_CALL : 'Outgoing',
    INCOMING_CALL : 'Incoming',
    MOVE_CALL : 'Move Call',
    HOLD_CALL : 'Hold Call',
    RESUMED_CALL : 'Resumed Call',
    TRANSFER_CALL : 'Transfer Call',
    ENDED_CALL : 'Ended Call',
    READY: 'Ready', //Ready to accept Outgoing or Incoming call
    SDK_READY: 'SDK Ready'
  };

  /**
  * Session Context Protype
  * @param {String} token The access token
  * @param {String} e9Id The e911Id
  * @param {String} sessionId The sessionId
  * @param {String} state 'Incoming' or 'Outgoing'
  */
  SessionContext = function (token, e9Id, sessionId, state) {
    var currState = state, callObject = null, event = null, accessToken = token, e911Id = e9Id, currSessionId = sessionId,
      currentCallId, UICbks = {}, currentCall = null;
    return {
      getCurrentCall: function () {
        return currentCall;
      },
      setCurrentCall: function (callObj) {
        currentCall = callObj;
      },
      getAccessToken: function () {
        return accessToken;
      },
      setAccessToken: function (token) {
        accessToken = token;
      },
      getE911Id: function () {
        return e911Id;
      },
      setE911Id: function (id) {
        e911Id = id;
      },
      getSessionId: function () {
        return currSessionId;
      },
      setSessionId: function (id) {
        currSessionId = id;
      },
      getCallState: function () {
        return currState;
      },
      setCallState: function (state) {
        currState = state;
      },
      getCallObject: function () {
        return callObject;
      },
      setCallObject: function (callObj) {
        callObject = callObj;
      },
      getEventObject: function () {
        return event;
      },
      setEventObject: function (eventObject) {
        event = eventObject;
      },
      setUICallbacks: function (callbacks) {
        UICbks = ATT.utils.extend(UICbks, callbacks);
      },
      getUICallbacks: function () {
        return UICbks;
      },
      setCurrentCallId: function (event) {
        currentCallId = event.split('/')[6] || null;
      },
      getCurrentCallId: function () {
        return currentCallId;
      }
    };
  };

  /**
  * Create a new Session Context
  * @param {Object} config The configuration
  * callmgr.CreateSession({
  *   token: 'abcd'
  *   e911Id: 'e911Id'
  *   sessionId: 'sessionId'
  * })
  */
  CreateSession = function (config) {
    session_context = new SessionContext(config.token, config.e911Id, config.sessionId, SessionState.READY);
    logger.logTrace('creating session with token: ' + config.token);
    session_context.setCallState(SessionState.SDK_READY);
  };

  //Cleanup session after logout
  DeleteSession = function () {
    session_context = null;
  };

  /**
  * Create an Outgoing Call
  * @param {Object} config The configuration
  * callmgr.CreateOutgoingCall({
  *   to: '1-800-foo-bar,
  *   mediaConstraints: {audio: true, video: true}
  * })
  */
  CreateOutgoingCall = function (config) {
    var call = new Call(null, config.to, config.mediaConstraints);
    session_context.setCallObject(call);
    session_context.setCallState(SessionState.OUTGOING_CALL);
    session_context.setUICallbacks(config.success);
    logger.logTrace('creating outgoing call', 'to: ' + config.to + ', constraints: ' + config.mediaConstraints);
    if (config.success) {
      ATT.UserMediaService.startCall(config);
    }
  };


  /**
  * Create an Incoming Call
  * @param {Object} config The configuration
  * callmgr.CreateIncomingCall({
  *   mediaConstraints: {audio: true, video: true}
  * })
  */
  CreateIncomingCall = function (config) {
    var event = session_context.getEventObject(),
      call = new Call(event.caller, null, config.mediaConstraints);
    session_context.setCallObject(call);
    session_context.setCallState(SessionState.INCOMING_CALL);
    session_context.setUICallbacks(config.success);
    logger.logTrace('creating incoming call', 'caller: ' + event.caller + ', constraints: ' + config.mediaConstraints);
    if (config.success) {
      ATT.UserMediaService.startCall(config);
    }
  };

  // call object cleanup
  DeleteCallObject = function () {
    session_context.setCallObject(null);
  };

  init = function () {
    logger.logTrace('call management module init');
    return {
      getSessionContext: function () {
        return session_context;
      },
      SessionState: SessionState,
      CreateSession: CreateSession,
      DeleteSession: DeleteSession,
      CreateOutgoingCall: CreateOutgoingCall,
      CreateIncomingCall: CreateIncomingCall,
      DeleteCallObject: DeleteCallObject
    };
  };

  Call.hold = function () {
    if (ATT.PeerConnectionService.peerConnection
        && session_context.getCallObject()) {
      logger.logTrace('Putting call on hold...');
      ATT.PeerConnectionService.holdCall();
    } else {
      logger.logWarning('Hold not possible...');
    }
  };

  Call.resume = function () {
    if (ATT.PeerConnectionService.peerConnection
        && session_context.getCallObject()) {
      logger.logTrace('Resuming call...');
      ATT.PeerConnectionService.resumeCall();
    } else {
      logger.logWarning('Resume not possible...');
    }
  };

  Call.hangup = function () {
    if (ATT.PeerConnectionService.peerConnection
        && session_context.getCallObject()) {
      logger.logTrace('Hanging up...');
      ATT.SignalingService.sendEndCall();
    } else {
      logger.logWarning('Hangup not possible...');
    }
  };

  Call.mute = function () {
    logger.logTrace('putting call on mute');
    ATT.UserMediaService.muteStream();
  };

  Call.unmute = function () {
    logger.logTrace('unmuting call');
    ATT.UserMediaService.unmuteStream();
  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  return {
    CallManager : module
  };
}());