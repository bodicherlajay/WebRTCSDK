/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

"use strict";

(function (mainModule, callManager, utils, PeerConnectionService) {
  var kaller,
    timestamp,
    onSessionReady,
    onIncomingCall,
    onOutgoingCall,
    onInProgress,
    //onCallHold,
    //onCallResume,
    onCallEnded,
    onCallError,
    eventRegistry = {};

  function createEventRegistry(sessionContext) {
    var callbacks = sessionContext.getUICallbacks();

    if (undefined === callbacks || 0 === Object.keys(callbacks).length) {
      console.log('No callbacks to execute');
      return;
    }

    onSessionReady = function (evt) {
      if (callbacks.onsessionContextReady) {
        callbacks.onsessionContextReady(evt);
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

    eventRegistry[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
    // registers UI functions for incomming IIP states
      if (event.reason) {
        onCallError({ type: mainModule.CallStatus.ERROR, reason: event.reason });
      } else {
        onCallEnded({ type: mainModule.CallStatus.ENDED });
      }
      callManager.getSessionContext().setCallState(callManager.SessionState.ENDED_CALL);
      callManager.getSessionContext().setCallObject(null);
      PeerConnectionService.endCall();
    };

    eventRegistry[mainModule.RTCCallEvents.INVITATION_RECEIVED] = function (event) {
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

    eventRegistry[mainModule.SessionEvents.RTC_SESSION_CREATED] = function (event) {
      onSessionReady({
        type: mainModule.CallStatus.READY,
        data: event.data
      });
    };

    // Call is established
    eventRegistry[mainModule.RTCCallEvents.SESSION_OPEN] = function (event) {
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

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (event) {
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

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_TERMINATED] = function (event) {
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

    eventRegistry[mainModule.RTCCallEvents.INVITATION_SENT] = function () {
      onOutgoingCall({
        type: mainModule.CallStatus.CALLING,
        callee: callManager.getSessionContext().getCallObject().callee()
      });
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
      if (event.reason) {
        onCallError({ type: mainModule.CallStatus.ERROR, reason: event.reason });
      } else {
        onCallEnded({ type: mainModule.CallStatus.ENDED });
      }
      callManager.getSessionContext().setCallState(callManager.SessionState.ENDED_CALL);
      callManager.getSessionContext().setCallObject(null);
      PeerConnectionService.endCall();
    };

    eventRegistry[mainModule.RTCCallEvents.UNKNOWN] = function () {
      onCallError({ type: mainModule.CallStatus.ERROR });
    };

    return eventRegistry;
  }

  utils.createEventRegistry = createEventRegistry;

}(ATT, cmgmt.CallManager.getInstance(), ATT.utils, ATT.PeerConnectionService));