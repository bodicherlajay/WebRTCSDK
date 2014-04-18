/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, ATT:true*/
if (!cmgmt) {
  var cmgmt = {};
}

cmgmt = (function () {
  "use strict";
  //Call prototype
  var module = {},
    Call = function (from, to, media) {
      var caller = from, callee = to, mediaType = media;
      return {
        caller: function () { return caller; },
        callee: function () { return callee; },
        mediaType: function () { return mediaType; },
        start: Call.start,
        hold: Call.hold,
        resume: Call.resume,
        mute: Call.mute,
        unmute: Call.unmute,
        end: Call.hangup
      };
    },
    //Session state enumeration
    SessionState = {
      OUTGOING_CALL : "Outgoing",
      INCOMING_CALL : "Incoming",
      MOVE_CALL : "Move Call",
      HOLD_CALL : "Hold Call",
      RESUMED_CALL : "Resumed Call",
      TRANSFER_CALL : "Transfer Call",
      READY: "Ready", //Ready to accept Outgoing or Incoming call
      SDK_READY: "SDK Ready"
    },
    //Session context to hold session variables
    SessionContext = function (token, e9Id, sessionId, state) {
      var currState = state, callObject = null, event = null, accessToken = token, e911Id = e9Id, currSessionId = sessionId,
        currentCallId, UICbks = {};
      return {
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
    },
    session_context,

    CreateSession = function (config) {
      session_context = new SessionContext(config.token, config.e911Id, config.sessionId, SessionState.READY);
      ATT.event.subscribe(ATT.SdkEvents.SDK_READY, config.success);
      session_context.setCallState(SessionState.SDK_READY);
      ATT.event.publish(ATT.SdkEvents.SDK_READY);
    },

    CreateOutgoingCall = function (config) {
      var call = new Call(null, config.to, config.mediaConstraints);
      session_context.setCallObject(call);
      session_context.setCallState(SessionState.OUTGOING_CALL);
      session_context.setUICallbacks(config);
      ATT.UserMediaService.startCall(config);
    },

    CreateIncomingCall = function (config) {
      var event = session_context.getEventObject(),
        call = new Call(event.caller, null, config.mediaConstraints);
      session_context.setCallObject(call);
      session_context.setCallState(SessionState.INCOMING_CALL);
      session_context.setUICallbacks(config);
      ATT.UserMediaService.startCall(config);
    },

    instance,

    init = function () {
      return {
        getSessionContext: function () {
          return session_context;
        },
        SessionState: SessionState,
        CreateSession: CreateSession,
        CreateOutgoingCall: CreateOutgoingCall,
        CreateIncomingCall: CreateIncomingCall
      };
    };

  // Session Object implementations
  // Call Object implementations
  // Call.start = function () {
  //   //console.log(this.from);
  // };

  // Call.reject = function () {
  // };

  // Call.transfer = function () {
  // };

  // Call.move = function () {
  // };

  Call.hold = function () {
    if (ATT.PeerConnectionService.peerConnection
        && ATT.PeerConnectionService.peerConnection.iceConnectionState !== 'disconnected'
        && session_context.getCurrentCallId()) {
      console.log('Putting call on hold...');
      ATT.PeerConnectionService.holdCall();
    } else {
      console.log('No current call...');
    }
  };

  Call.resume = function () {
    if (ATT.PeerConnectionService.peerConnection
        && ATT.PeerConnectionService.peerConnection.iceConnectionState !== 'disconnected'
        && session_context.getCurrentCallId()
        && session_context.getCallState === SessionState.HOLD_CALL) {
      console.log('Resuming call...');
      ATT.SignalingService.sendResumeCall();
    } else {
      console.log('No current call...');
    }
  };

  Call.hangup = function () {
    if (ATT.PeerConnectionService.peerConnection
        && ATT.PeerConnectionService.peerConnection.iceConnectionState !== 'disconnected'
        && session_context.getCurrentCallId()) {
      console.log('Hanging up...');
      ATT.SignalingService.sendEndCall();
      ATT.PeerConnectionService.endCall();
      ATT.UserMediaService.stopStream();
    } else {
      console.log('No current call...');
    }
  };

  Call.mute = function () {
    ATT.UserMediaService.muteStream();
  };

  Call.unmute = function () {
    ATT.UserMediaService.unmuteStream();
  };

  // Call.removeVideo = function () {
  // };

  // Call.addVideo = function () {
  // };

  // Call.transferTo = function () {
  // };

  // Call.sendDTMF = function () {
  // };

  // Call.onAddStream = function (stream, event) {
  //   console.log(stream);
  //   console.log(event);
  // };
  // Call.onConnected = function (event) {
  //   console.log(event);
  // };
  // Call.onDisconnected = function (event) {
  //   console.log(event);
  // };
  // Call.onError = function (error, event) {
  //   console.log(error);
  //   console.log(event);
  // };
  // Call.onStatus = function (status, event) {
  //   console.log(status);
  //   console.log(event);
  // };

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