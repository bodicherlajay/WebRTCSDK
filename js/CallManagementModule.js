/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true*/
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
        end: Call.end
      };
    },
    //Session state enumeration
    SessionState = {
      OUTGOING_CALL : "Outgoing",
      INCOMING_CALL : "Incoming",
      MOVE_CALL : "Move Call",
      TRANSFER_CALL : "Transfer Call",
      READY: "Ready" //Ready to accept Outgoing or Incoming call
    },
    //Session context to hold session variables
    SessionContext = function (token, e911Id, sessionId, state) {
      var currState = state, callObject = null, accessToken = token, e9Id = e911Id, currSessionId = sessionId;
      return {
        getAccessToken: function () {
          return accessToken;
        },
        getE911Id: function () {
          return e9Id;
        },
        getSessionId: function () {
          return currSessionId;
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
        }
      };
    },
    session_context,

    CreateSession = function (token, e911Id, sessionId) {
      session_context = new SessionContext(token, e911Id, sessionId, SessionState.READY);
      //console.log("session," + session_context.getAccessToken());
    },

    CreateOutgoingCall = function (from, to, media) {
      var call = new Call(from, to, media);
      session_context.setCallObject(call);
      session_context.setCallState(SessionState.OUTGOING_CALL);
      return call;
    },

    CreateIncomingCall = function (from, to, media) {
      var call = new Call(from, to, media);
      session_context.setCallObject(call);
      session_context.setCallState(SessionState.INCOMING_CALL);
      return call;
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

  //Session Object implementations
  //Call Object implementations
  Call.start = function () {
    //console.log(this.from);
  };

  Call.transfer = function () {
  };

  Call.end = function () {
  };

  Call.move = function () {
  };

  Call.hold = function () {
  };

  Call.resume = function () {
  };

  Call.removeVideo = function () {
  };

  Call.addVideo = function () {
  };

  Call.transferTo = function () {
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