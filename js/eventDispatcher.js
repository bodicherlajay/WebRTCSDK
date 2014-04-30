/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

"use strict";

var EventDispatcher = function (settings) {
  // mainModule = settings.mainModule;
  // callbacks = settings.callbacks;
  // PeerConnectionService = settings.peerConnectionSvc;
  // callManager = settings.callManager;
};

EventDispatcher.prototype = (function () {
  var callManager = cmgmt.CallManager.getInstance(),
    PeerConnectionService = ATT.PeerConnectionService,
    mainModule = ATT,
    session = callManager.getSessionContext(),
    kaller,
    timestamp,
    onSessionReady,
    onIncomingCall,
    onOutgoingCall,
    onInProgress,
    //onCallHold,
    //onCallResume,
    onCallEnded,
    onCallError,
    api = {};

  api.login = function () {
  };

  api[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
    if (event.reason) {
      onCallError({ type: mainModule.CallStatus.ERROR, reason: event.reason });
    } else {
      onCallEnded({ type: mainModule.CallStatus.ENDED });
    }
    callManager.getSessionContext().setCallState(callManager.SessionState.ENDED_CALL);
    callManager.getSessionContext().setCallObject(null);
    PeerConnectionService.endCall();
  };

  api[mainModule.RTCCallEvents.INVITATION_RECEIVED] = function (event) {
    if (event.sdp && event.sdp.indexOf('sendonly') !== -1) {
      event.sdp = event.sdp.replace(/sendonly/g, 'sendrecv');
    }
    // grab the phone number
    kaller = event.from.split('@')[0].split(':')[1];
    onIncomingCall({
      type: mainModule.CallStatus.RINGING,
      caller: kaller
    });
  };

  // this is the DHS session, not WebRTC session!
  api[mainModule.SessionEvents.RTC_SESSION_CREATED] = function (event) {
    onSessionReady({
      type: mainModule.CallStatus.READY,
      data: event.data
    });
  };

  // WebRTC session
  api[mainModule.RTCCallEvents.SESSION_OPEN] = function (event) {
    if (event.sdp) {
      PeerConnectionService.setTheRemoteDescription(event.sdp, 'answer');
    }
    // set callID in the call object
    // TODO: switch to setCurrentCall
    callManager.getSessionContext().setCurrentCallId(event.resourceURL);

    // call established
    timestamp = new Date();
    onInProgress({
      type: mainModule.CallStatus.INPROGRESS,
      time: timestamp
    });
  };

  api[mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (event) {
    PeerConnectionService.setRemoteAndCreateAnswer(event.sdp, event.modId);
    // hold request received
    // if (sdp && sdp.indexOf('sendonly') !== -1) {
    //   onCallHold({
    //     type: mainModule.CallStatus.HOLD
    //   });
    //   callManager.getSessionContext().setCallState(callManager.SessionState.HOLD_CALL);
    // }

    // // resume request received
    // if (sdp && sdp.indexOf('sendrecv') !== -1 && sdp.indexOf('recvonly') !== -1) {
    //   onCallResume({
    //     type: mainModule.CallStatus.RESUMED
    //   });
    //   callManager.getSessionContext().setCallState(callManager.SessionState.RESUMED_CALL);
    // }
  };

  api[mainModule.RTCCallEvents.MODIFICATION_TERMINATED] = function (event) {
    PeerConnectionService.setModificationId(event.modId);

    if (event.sdp) {
      PeerConnectionService.setTheRemoteDescription(event.sdp, 'answer');
    }

  // // hold request successful
  // if (sdp && sdp.indexOf('recvonly') !== -1 && sdp.indexOf('sendrecv') !== -1) {
  //   onCallHold({
  //     type: mainModule.CallStatus.HOLD
  //   });
  //   callManager.getSessionContext().setCallState(callManager.SessionState.HOLD_CALL);
  // } else if (sdp && sdp.indexOf('sendrecv') !== -1) {
  //   if (callManager.getSessionContext().getCallState() === callManager.SessionState.HOLD_CALL) {
  //     // resume request successful
  //     onCallResume({
  //       type: mainModule.CallStatus.RESUMED
  //     });
  //     callManager.getSessionContext().setCallState(callManager.SessionState.RESUMED_CALL);
  //   }
  };

  api[mainModule.RTCCallEvents.INVITATION_SENT] = function () {
    onOutgoingCall({
      type: mainModule.CallStatus.CALLING,
      callee: callManager.getSessionContext().getCallObject().callee()
    });
  };

  api[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
    if (event.reason) {
      onCallError({ type: mainModule.CallStatus.ERROR, reason: event.reason });
    } else {
      onCallEnded({ type: mainModule.CallStatus.ENDED });
    }
    callManager.getSessionContext().setCallState(callManager.SessionState.ENDED_CALL);
    callManager.getSessionContext().setCallObject(null);
    PeerConnectionService.endCall();
  };

  api[mainModule.RTCCallEvents.UNKNOWN] = function () {
    onCallError({ type: mainModule.CallStatus.ERROR });
  };

  if (session && session.getUICallbacks() ) {

    callbacks = session.getUICallbacks;

    onSessionReady = function (evt) {
      if (callbacks.onSessionReady) {
        callbacks.onSessionReady(evt);
      }
    };

    onIncomingCall = function (evt) {
      if (callbacks.onIncomingCall) {
        callbacks.onIncomingCall(evt);
      }
    };

    onOutgoingCall = function (evt) {
      if (callbacks.onOutgoingCall) {
        callbacks.onOutgoingCall(evt);
      }
    };

    onInProgress = function (evt) {
      if (callbacks.onInProgress) {
        callbacks.onInProgress(evt);
      }
    };

  // onCallHold = function (evt) {
  //   if (callbacks.onCallHold) {
  //     callbacks.onCallHold(evt);
  //   }
  // };

  // onCallResume = function (evt) {
  //   if (callbacks.onCallResume) {
  //     callbacks.onCallResume(evt);
  //   }
  // };
    onCallError = function (evt) {
      if (callbacks.onCallError) {
        callbacks.onCallError(evt);
      }
    };

    onCallEnded = function (evt) {
      if (callbacks.onCallEnded) {
        callbacks.onCallEnded(evt);
      }
    };

    onCallError = function (evt) {
      if (callbacks.onCallError) {
        callbacks.onCallError(evt);
      }
    };
  }

  return EventDispatcher;
}());