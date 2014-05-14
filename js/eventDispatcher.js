/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

'use strict';

(function (mainModule, callManager, utils, PeerConnectionService) {
  var onSessionReady,
    onIncomingCall,
    onConnecting,
    onInProgress,
    //onCallHold,
    //onCallResume,
    onCallEnded,
    onCallError,
    onError,
    eventRegistry = {};

  function createEventRegistry(sessionContext) {
    var rtcEvent = ATT.RTCEvent.getInstance(),
      callbacks = sessionContext.getUICallbacks();

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
      onSessionReady(rtcEvent.createEvent(event));
    };

    eventRegistry[mainModule.SessionEvents.RTC_SESSION_ERROR] = function (event) {
      onError(rtcEvent.createEvent(event));
    };

    eventRegistry[mainModule.CallStatus.ERROR] = function (event) {
      onCallError(rtcEvent.createEvent(event));
    };

    eventRegistry[mainModule.RTCCallEvents.INVITATION_RECEIVED] = function (event) {
      if (event.sdp && event.sdp.indexOf('sendonly') !== -1) {
        event.sdp = event.sdp.replace(/sendonly/g, 'sendrecv');
      }

      onIncomingCall(rtcEvent.createEvent({
        state: mainModule.CallStatus.RINGING,
        from: event.from.split('@')[0].split(':')[1] // grab the phone number
      }));
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
      onInProgress(rtcEvent.createEvent({
        state: mainModule.CallStatus.INPROGRESS
      }));
    };

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (event) {
      PeerConnectionService.setRemoteAndCreateAnswer(event.sdp, event.modId);
      // hold request received
      // if (sdp && sdp.indexOf('sendonly') !== -1) {
      //   onCallHold(rtcEvent.createEvent({
      //     state: mainModule.CallStatus.HOLD
      //   }));
      //   callManager.getSessionContext().setCallState(callManager.SessionState.HOLD_CALL);
      // }

      // // resume request received
      // if (sdp && sdp.indexOf('sendrecv') !== -1 && sdp.indexOf('recvonly') !== -1) {
      //   onCallResume(rtcEvent.createEvent({
      //     state: mainModule.CallStatus.RESUMED
      //   }));
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
    //   onCallHold(rtcEvent.createEvent({
    //     state: mainModule.CallStatus.HOLD
    //   }));
    //   callManager.getSessionContext().setCallState(callManager.SessionState.HOLD_CALL);
    // } else if (sdp && sdp.indexOf('sendrecv') !== -1) {
    //   if (callManager.getSessionContext().getCallState() === callManager.SessionState.HOLD_CALL) {
    //     // resume request successful
    //     onCallResume(rtcEvent.createEvent({
    //       state: mainModule.CallStatus.RESUMED
    //     }));
    //     callManager.getSessionContext().setCallState(callManager.SessionState.RESUMED_CALL);
    //   }
    };

    eventRegistry[mainModule.RTCCallEvents.CALL_CONNECTING] = function () {
      onConnecting(rtcEvent.createEvent({
        state: mainModule.CallStatus.CONNECTING,
        from: (callManager.getSessionContext() ? callManager.getSessionContext().getCallObject().caller() : null),
        to: (callManager.getSessionContext() ? callManager.getSessionContext().getCallObject().callee() : null)
      }));
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
      if (event.reason) {
        onCallError(rtcEvent.createEvent({
          state: mainModule.CallStatus.ERROR,
          error: ATT.rtc.error.create (event.reason)
        }));
      } else {
        onCallEnded(rtcEvent.createEvent({
          state: mainModule.CallStatus.ENDED
        }));
      }
      callManager.getSessionContext().setCallState(callManager.SessionState.ENDED_CALL);
      callManager.getSessionContext().setCallObject(null);
      PeerConnectionService.endCall();
    };

    eventRegistry[mainModule.RTCCallEvents.UNKNOWN] = function () {
      onCallError(rtcEvent.createEvent({
        state: mainModule.CallStatus.ERROR
      }));
    };

    return eventRegistry;
  }

  utils.createEventRegistry = createEventRegistry;

}(ATT, cmgmt.CallManager.getInstance(), ATT.utils, ATT.PeerConnectionService));