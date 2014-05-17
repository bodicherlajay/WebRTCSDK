/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

'use strict';

(function (mainModule, callManager, utils, PeerConnectionService) {
  var onSessionReady,
    onIncomingCall,
    onConnecting,
    onCallInProgress,
    onCallEnded,
    onCallError,
    onError,
    eventRegistry = {},
    logger = Env.resourceManager.getInstance().getLogger("eventDispatcher");

  function createEventRegistry(sessionContext, rtcEvent) {
    var callbacks = sessionContext.getUICallbacks();

    if (undefined === callbacks || 0 === Object.keys(callbacks).length) {
      logger.logError('No callbacks to execute');
      return;
    }

   /**
   * OnSessionReady
   * @param {Object} the UI Event Object
   */
    onSessionReady = function (evt) {
      callbacks = sessionContext.getUICallbacks();
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
      callbacks = sessionContext.getUICallbacks();
      if (callbacks.onConnecting) {
        callbacks.onConnecting(evt);
      }
    };

    /**
    * onCallInProgress
    * @param {Object} the UI Event Object
    */
    onCallInProgress = function (evt) {
      callbacks = sessionContext.getUICallbacks();
      if (callbacks.onCallInProgress) {
        callbacks.onCallInProgress(evt);
      }
    };

    /**
    * onCallEnded
    * @param {Object} the UI Event Object
    */
    onCallEnded = function (evt) {
      callbacks = sessionContext.getUICallbacks();
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
      callbacks = sessionContext.getUICallbacks();
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
    // codec: [],
    // data: '',
    // error: ''
    // ======================
    // Also, accept `data` object with some relevant info as needed
    eventRegistry[mainModule.SessionEvents.RTC_SESSION_CREATED] = function () {
      onSessionReady(rtcEvent.createEvent({
        state: mainModule.CallStatus.READY,
        data: '1234'
      }));
    };

    eventRegistry[mainModule.SessionEvents.RTC_SESSION_ERROR] = function (event) {
      onError(rtcEvent.createEvent(event));
    };

    eventRegistry[mainModule.CallStatus.ERROR] = function (event) {
      onCallError(rtcEvent.createEvent(event));
    };

    eventRegistry[mainModule.RTCCallEvents.INVITATION_RECEIVED] = function (event) {
      logger.logInfo('Incoming call received at ', event.timestamp);
      logger.logInfo('Codec: ');
      if (event.sdp && event.sdp.indexOf('sendonly') !== -1) {
        event.sdp = event.sdp.replace(/sendonly/g, 'sendrecv');
      }

      //TODO have to pass the object as a single parameter as event object has all the data
      onIncomingCall(rtcEvent.createEvent({
        state: mainModule.CallStatus.RINGING,
        from: event.from,
        codec: event.codec,
        to: event.to,
        calltype: event.calltype
      }));
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_OPEN] = function (event, data) {
      logger.logInfo('session open event received at ', event.timestamp);
      if (data.sdp) {
        PeerConnectionService.setTheRemoteDescription(data.sdp, 'answer');
      }
      if (data.resource) {
        callManager.getSessionContext().setCurrentCallId(data.resource);
      }
    };

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (data) {
      if (data.sdp && data.modId) {
        PeerConnectionService.setRemoteAndCreateAnswer(data.sdp, data.modId);
      }
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

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_TERMINATED] = function (data) {
      if (data.modId) {
        PeerConnectionService.setModificationId(data.modId);
      }

      if (data.sdp) {
        PeerConnectionService.setTheRemoteDescription(data.sdp, 'answer');
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
        to: (callManager.getSessionContext().getCallObject() ? callManager.getSessionContext().getCallObject().callee() : null)
      }));
    };

    eventRegistry[mainModule.RTCCallEvents.CALL_IN_PROGRESS] = function (event) {
      onCallInProgress(rtcEvent.createEvent({
        state: mainModule.CallStatus.INPROGRESS,
        from: (callManager.getSessionContext().getCallObject() ? callManager.getSessionContext().getCallObject().caller() : null),
        to: (callManager.getSessionContext().getCallObject() ? callManager.getSessionContext().getCallObject().callee() : null),
        calltype: event.calltype,
        codec: event.codec
      }));
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
      if (event.reason) {
        onCallError(rtcEvent.createEvent({
          state: mainModule.CallStatus.ERROR,
          error: ATT.rtc.error.create(event.reason)
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