/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

"use strict";

(function (mainModule, callManager, utils, PeerConnectionService) {
  var kaller,
    timestamp,
    onSessionReady,
    onIncomingCall,
    onConnecting,
    onInProgress,
    //onCallHold,
    //onCallResume,
    onCallEnded,
    onCallError,
    onError,
    eventRegistry = {},
    callingParty;

  function createEventRegistry(sessionContext) {
    var callbacks = sessionContext.getUICallbacks();

    if (undefined === callbacks || 0 === Object.keys(callbacks).length) {
      console.log('No callbacks to execute');
      return;
    }
  /**
   * OnSessionReady
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} callStatus
   * @attribute {String} Time stamp
   */
    onSessionReady = function (evt) {
      if (callbacks.onSessionReady) {
        callbacks.onSessionReady(evt);
      }
    };
 /**
   * onIncomingCall
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} callStatus
   * @attribute {String} callID
   * @attribute {String} Time stamp
   */
    onIncomingCall = function (evt) {
      if (callbacks.onIncomingCall) {
        callbacks.onIncomingCall(evt);
      }
    };
 /**
   * onConnecting
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} callStatus
   * @attribute {String} Time stamp
   */
    onConnecting = function (evt) {
      if (callbacks.onConnecting) {
        callbacks.onConnecting(evt);
      }
    };
 // *
 //   * onInProgress
 //   * @memberof ATT.rtc.Phone
 //   * @param {Object} config Dial configuration object.
 //   * @attribute {String} callStatus
 //   * @attribute {String} Time stamp

    onInProgress = function (evt) {
      if (callbacks.onInProgress) {
        callbacks.onInProgress(evt);
      }
    };
 /**
   * onCallHold
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} callStatus
   * @attribute {String} Time stamp
   */
  // onCallHold = function (evt) {
  //   if (callbacks.onCallHold) {
  //     callbacks.onCallHold(evt);
  //   }
  // };
 /**
   * onCallResume
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} callStatus
   * @attribute {String} Time stamp
   */
  // onCallResume = function (evt) {
  //   if (callbacks.onCallResume) {
  //     callbacks.onCallResume(evt);
  //   }
  // };
 /**
   * onCallEnded
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} callStatus
   * @attribute {String} callID
   * @attribute {String} Time stamp
   */
    onCallEnded = function (evt) {
      if (callbacks.onCallEnded) {
        callbacks.onCallEnded(evt);
      }
    };
 /**
   * onCallError
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} callStatus
    * @attribute {String} callID
   * @attribute {String} Time stamp
   */
    onCallError = function (evt) {
      if (callbacks.onCallError) {
        callbacks.onCallError(evt);
      }
    };
 /**
   * onError
   * @memberof ATT.rtc.Phone
   * @param {Object} config Dial configuration object.
   * @attribute {String} callStatus
    * @attribute {String} callID
   * @attribute {String} Time stamp
   */
    onError = function (evt) {
      if (callbacks.onError) {
        callbacks.onError(evt);
      }
    };

    eventRegistry[mainModule.SessionEvents.RTC_SESSION_CREATED] = function (event) {
      onSessionReady(event);
    };

    eventRegistry[mainModule.SessionEvents.RTC_SESSION_ERROR] = function (event) {
      onError(event);
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
    // registers UI functions for incomming IIP states
      if (event.reason) {
        onCallError({ type: mainModule.CallStatus.ERROR, reason: event.reason });
      } else {
        onCallEnded({ type: mainModule.CallStatus.ENDED });
      }
      callManager.getSessionContext().setCallState(callManager.SessionState.ENDED_CALL);
      callManager.getSessionContext().DeleteCallObject();
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

    eventRegistry[mainModule.RTCCallEvents.CALL_CONNECTING] = function () {
      if (callManager.getSessionContext().getCallObject()) {
        callingParty = callManager.getSessionContext().getCallObject().callee();
      } else {
        callingParty = '';
      }
      onConnecting({
        type: mainModule.CallStatus.CONNECTING,
        callee: callingParty
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