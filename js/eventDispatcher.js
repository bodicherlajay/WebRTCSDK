/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

'use strict';

(function (mainModule, callManager, utils, PeerConnectionService, UserMediaService) {
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

  function createEventRegistry(sessionContext, depCallMgr, depPeerConn) {
    //Call set methods for jslint
    if (depCallMgr !== undefined) {
      setCallManager(depCallMgr);
    }
    if (depPeerConn !== undefined) {
      setPeerConnService(depPeerConn);
    }

    var callbacks = sessionContext.getUICallbacks();

    if (undefined === callbacks || 0 === Object.keys(callbacks).length) {
      logger.logError('No callbacks to execute');
      return;
    }

   /**
    * @event
    * @summary Applies to ATT.rtc.Phone.login
    * @desc UI callback function which gets invoked by SDK when SDK gets initialized.
    * This event indicates that SDK is ready to make or receive calls
    * @memberof ATT.rtc.Phone
    * @param {Object} evt Event Object
    * @param evt.state {Enum} ATT.SessionEvents.RTC_SESSION_CREATED
    * @param evt.data.sessionId {String} Session id
    *
   */
    onSessionReady = function (evt) {
      callbacks = sessionContext.getUICallbacks();
      if (callbacks.onSessionReady) {
        callbacks.onSessionReady(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.login
     * @desc UI callback function which gets invoked by SDK when SDK gets initialized.
     * This event indicates that SDK is ready to make or receive calls
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.calltype {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     *
     */
    onIncomingCall = function (evt) {
      if (callbacks.onIncomingCall) {
        callbacks.onIncomingCall(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.login
     * @desc UI callback function which gets invoked by SDK when SDK gets initialized.
     * This event indicates that SDK is ready to make or receive calls
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Tel or sip uri
     * @param evt.calltype {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     *
     */
    onConnecting = function (evt) {
      callbacks = sessionContext.getUICallbacks();
      if (callbacks.onConnecting) {
        callbacks.onConnecting(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.login
     * @desc UI callback function which gets invoked by SDK when SDK gets initialized.
     * This event indicates that SDK is ready to make or receive calls
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.calltype {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     * @param evt.resource {String} [Optional] Resource id
     * @param evt.modId {String} [Optional] Modification id
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
     * @event
     * @summary Applies to ATT.rtc.Phone.login
     * @desc UI callback function which gets invoked by SDK when SDK gets initialized.
     * This event indicates that SDK is ready to make or receive calls
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.calltype {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     *
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
    eventRegistry[mainModule.SessionEvents.RTC_SESSION_CREATED] = function (event) {
      onSessionReady(event);
    };

    eventRegistry[mainModule.SessionEvents.RTC_SESSION_ERROR] = function (event) {
      onError(event);
    };

    eventRegistry[mainModule.CallStatus.ERROR] = function (event) {
      onCallError(event);
      sessionContext.setCallType('');
    };

    eventRegistry[mainModule.RTCCallEvents.INVITATION_RECEIVED] = function (event) {
      onIncomingCall(event);
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_OPEN] = function (event, data) {
      onCallEstablished(event);

      if (data.sdp) {
        peerConnService.setTheRemoteDescription(data.sdp, 'answer');
      }
      if (data.resource) {
        callMgr.getSessionContext().setCurrentCallId(data.resource.split('/')[6]);
      }
    };

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (event, data) {
      logger.logDebug(event);

      if (data.sdp && data.modId) {
        peerConnService.setRemoteAndCreateAnswer(data.sdp, data.modId);
      }
    };

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_TERMINATED] = function (event, data) {
      logger.logDebug(event);

      if (data.modId) {
        peerConnService.setModificationId(data.modId);
      }

      if (data.sdp) {
        peerConnService.setTheRemoteDescription(data.sdp, 'answer');
      }
    };

    eventRegistry[mainModule.RTCCallEvents.CALL_CONNECTING] = function (event) {
      onConnecting(event);
    };

    eventRegistry[mainModule.RTCCallEvents.CALL_IN_PROGRESS] = function (event) {
      onCallInProgress(event);
    };

    eventRegistry[mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
      if (event.error) {
        onCallError(event);
      } else {
        onCallEnded(event);
      }
      sessionContext.setCallState(callMgr.SessionState.ENDED_CALL);
      sessionContext.setCallObject(null);
      sessionContext.setCallType('');
      peerConnService.endCall();
      UserMediaService.stopStream();
    };

    eventRegistry[mainModule.RTCCallEvents.UNKNOWN] = function (event) {
      onCallError(event);
    };

    return eventRegistry;
  }

  utils.createEventRegistry = createEventRegistry;

}(ATT, cmgmt.CallManager.getInstance(), ATT.utils, ATT.PeerConnectionService, ATT.UserMediaService));