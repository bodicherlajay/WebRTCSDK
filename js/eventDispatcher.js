/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

'use strict';

(function (mainModule, callManager, utils, PeerConnectionService) {
  var onSessionReady,
    onIncomingCall,
    onConnecting,
    onInProgress,
    onCallEnded,
    onCallError,
    onError,
    eventRegistry = {};

  function createEventRegistry(sessionContext) {
    var callbacks = sessionContext.getUICallbacks();

    if (undefined === callbacks || 0 === Object.keys(callbacks).length) {
      console.log('No callbacks to execute');
      return;
    }

   /**
   * OnSessionReady
   * @param {Object} the UI Event Object
   */
    onSessionReady = function (evt) {
      if (callbacks.onSessionReady) {
        callbacks.onSessionReady(evt);
      }
    };

   /**
   * onIncomingCall
   * @param {Object} the UI Event Object
   */
    onIncomingCall = function (evt) {
      if (callbacks.onIncomingCall) {
        callbacks.onIncomingCall(evt);
      }
    };

   /**
   * onConnecting
   * @param {Object} the UI Event Object
   */
    onConnecting = function (evt) {
      if (callbacks.onConnecting) {
        callbacks.onConnecting(evt);
      }
    };

    /**
    * onInProgress
    * @param {Object} the UI Event Object
    */
    onInProgress = function (evt) {
      if (callbacks.onInProgress) {
        callbacks.onInProgress(evt);
      }
    };

    /**
    * onCallEnded
    * @param {Object} the UI Event Object
    */
    onCallEnded = function (evt) {
      if (callbacks.onCallEnded) {
        callbacks.onCallEnded(evt);
      }
    };

    /**
    * onCallError
    * @param {Object} the UI Event Object
    */
    onCallError = function (evt) {
      if (callbacks.onCallError) {
        callbacks.onCallError(evt);
      }
    };

    /**
    * onError
    * @param {Object} the UI Event Object
    */
    onError = function (evt) {
      if (callbacks.onError) {
        callbacks.onError(evt);
      }
    };

    // Each Event Registry function accepts an `event` object
    // Here is the structure:
    // ======================
    // from: '',
    // to: '',
    // timeStamp: '',
    // state: '',
    // codec: '',
    // error: ''
    // ======================
    // Also, accept `data` object with some relevant info as needed
    // `data` not useful for UI
    eventRegistry[mainModule.SessionEvents.RTC_SESSION_CREATED] = function (event) {
      event.type = ATT.CallStatus.READY;
      onSessionReady(event);
    };

    eventRegistry[mainModule.SessionEvents.RTC_SESSION_ERROR] = function (event) {
      onError(event);
    };

    eventRegistry[mainModule.CallStatus.ERROR] = function (event) {
      event.type = ATT.CallStatus.ERROR;
      onCallError(event);
    };

    eventRegistry[mainModule.RTCCallEvents.INVITATION_RECEIVED] = function (event) {
      // if (data.sdp && data.sdp.indexOf('sendonly') !== -1) {
      //   data.sdp = data.sdp.replace(/sendonly/g, 'sendrecv');
      // }
      event.type = ATT.CallStatus.RINGING;
      onIncomingCall(event);
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_OPEN] = function (event, data) {
      if (data.sdp) {
        PeerConnectionService.setTheRemoteDescription(data.sdp, 'answer');
      }
      if (data.resource) {
        callManager.getSessionContext().setCurrentCallId(data.resource);
      }
      event.type = ATT.CallStatus.INPROGRESS;
      onInProgress(event);
    };

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (data) {
      if (data.sdp && data.modId) {
        PeerConnectionService.setRemoteAndCreateAnswer(data.sdp, data.modId);
      }
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

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_TERMINATED] = function (data) {
      if (data.modId) {
        PeerConnectionService.setModificationId(data.modId);
      }

      if (data.sdp) {
        PeerConnectionService.setTheRemoteDescription(data.sdp, 'answer');
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

    eventRegistry[mainModule.RTCCallEvents.CALL_CONNECTING] = function (event) {
      event.type = ATT.CallStatus.CONNECTING;
      onConnecting(event);
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
      if (event.error) {
        event.type = ATT.CallStatus.ENDED;
        onCallError(event);
      } else {
        event.type = ATT.CallStatus.ERROR;
        onCallEnded(event);
      }
      callManager.getSessionContext().setCallState(callManager.SessionState.ENDED_CALL);
      callManager.getSessionContext().setCallObject(null);
      PeerConnectionService.endCall();
    };

    eventRegistry[mainModule.RTCCallEvents.UNKNOWN] = function (event) {
      event.type = ATT.CallStatus.ERROR;
      onCallError(event);
    };

    return eventRegistry;
  }

  utils.createEventRegistry = createEventRegistry;

}(ATT, cmgmt.CallManager.getInstance(), ATT.utils, ATT.PeerConnectionService));