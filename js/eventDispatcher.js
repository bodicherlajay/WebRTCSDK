/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

'use strict';

(function (mainModule, callManager, utils, PeerConnectionService) {
  var callMgr = callManager,
    peerConnService = PeerConnectionService,
    onSessionReady,
    onIncomingCall,
    onConnecting,
    onCallEstablished,
    onCallInProgress,
    onCallEnded,
    onCallError,
    onError,
    eventRegistry = {},
    logger = Env.resourceManager.getInstance().getLogger('eventDispatcher');

  function setCallManager(depCallMgr) {
    callMgr = depCallMgr;
  }

  function setPeerConnService(depPeerConnService) {
    peerConnService = depPeerConnService;
  }

  function createEventRegistry(sessionContext, rtcEvent, depCallMgr, depPeerConn) {
    if (depCallMgr !== undefined) {
      callMgr = depCallMgr;
    }
    if (depPeerConn !== undefined) {
      peerConnService = depPeerConn;
    }

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
    * onCallEstablished
    * @param {Object} the UI Event Object
    */
    onCallEstablished = function (evt) {
      callbacks = sessionContext.getUICallbacks();
      if (callbacks.onCallEstablished) {
        callbacks.onCallEstablished(evt);
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
      onCallEstablished(rtcEvent.createEvent({
        state: mainModule.CallStatus.ESTABLISHED,
        from: event.from,
        codec: event.codec,
        to: event.to,
        calltype: event.calltype
      }));
      if (data.sdp) {
        peerConnService.setTheRemoteDescription(data.sdp, 'answer');
      }
      if (data.resource) {
        callMgr.getSessionContext().setCurrentCallId(data.resource);
      }
    };

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (data) {
      if (data.sdp && data.modId) {
        peerConnService.setRemoteAndCreateAnswer(data.sdp, data.modId);
      }
      // hold request received
      // if (sdp && sdp.indexOf('sendonly') !== -1) {
      //   onCallHold(rtcEvent.createEvent({
      //     state: mainModule.CallStatus.HOLD
      //   }));
      //   callMgr.getSessionContext().setCallState(callMgr.SessionState.HOLD_CALL);
      // }

      // // resume request received
      // if (sdp && sdp.indexOf('sendrecv') !== -1 && sdp.indexOf('recvonly') !== -1) {
      //   onCallResume(rtcEvent.createEvent({
      //     state: mainModule.CallStatus.RESUMED
      //   }));
      //   callMgr.getSessionContext().setCallState(callMgr.SessionState.RESUMED_CALL);
      // }
    };

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_TERMINATED] = function (data) {
      if (data.modId) {
        peerConnService.setModificationId(data.modId);
      }

      if (data.sdp) {
        peerConnService.setTheRemoteDescription(data.sdp, 'answer');
      }

    // // hold request successful
    // if (sdp && sdp.indexOf('recvonly') !== -1 && sdp.indexOf('sendrecv') !== -1) {
    //   onCallHold(rtcEvent.createEvent({
    //     state: mainModule.CallStatus.HOLD
    //   }));
    //   callMgr.getSessionContext().setCallState(callMgr.SessionState.HOLD_CALL);
    // } else if (sdp && sdp.indexOf('sendrecv') !== -1) {
    //   if (callMgr.getSessionContext().getCallState() === callMgr.SessionState.HOLD_CALL) {
    //     // resume request successful
    //     onCallResume(rtcEvent.createEvent({
    //       state: mainModule.CallStatus.RESUMED
    //     }));
    //     callMgr.getSessionContext().setCallState(callMgr.SessionState.RESUMED_CALL);
    //   }
    };

    eventRegistry[mainModule.RTCCallEvents.CALL_CONNECTING] = function () {
      console.log("connecting:" + sessionContext.getCallObject());
      onConnecting(rtcEvent.createEvent({
        state: mainModule.CallStatus.CONNECTING,
        to: (sessionContext.getCallObject() ? sessionContext.getCallObject().callee() : null)
      }));
    };

    eventRegistry[mainModule.RTCCallEvents.CALL_IN_PROGRESS] = function (event) {
      onCallInProgress(rtcEvent.createEvent({
        state: mainModule.CallStatus.INPROGRESS,
        from: (sessionContext.getCallObject() ? sessionContext.getCallObject().caller() : null),
        to: (sessionContext.getCallObject() ? sessionContext.getCallObject().callee() : null),
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
      sessionContext.setCallState(callMgr.SessionState.ENDED_CALL);
      sessionContext.setCallObject(null);
      peerConnService.endCall();
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