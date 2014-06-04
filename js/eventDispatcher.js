/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

'use strict';

(function (mainModule, utils, PeerConnectionService, UserMediaService) {
  var session,
    callbacks,
    peerConnService = PeerConnectionService,
    onSessionReady,
    onIncomingCall,
    onConnecting,
    onCallEstablished,
    onCallInProgress,
    onCallHold,
    onCallResume,
    onCallEnded,
    onCallError,
    onError,
    eventRegistry = {},
    logger = Env.resourceManager.getInstance().getLogger('eventDispatcher');

  function setPeerConnService(depPeerConnService) {
    peerConnService = depPeerConnService;
  }

  function createEventRegistry(options) {
    //Call set methods for jslint
    if (options.depPeerConn !== undefined) {
      setPeerConnService(options.depPeerConn);
    }

    session = options.session;
    callbacks = options.callbacks;

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
      if (callbacks.onSessionReady) {
        callbacks.onSessionReady(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.login
     * @desc
     * This event callback gets invoked when an Incoming call is received
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.mediaType {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     */
    onIncomingCall = function (evt) {
      if (callbacks.onIncomingCall) {
        callbacks.onIncomingCall(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.dial
     * @desc
     * This event callback gets invoked when an outgoing call flow is initiated and the call state is changed to
     * connecting state
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Tel or sip uri
     * @param evt.mediaType {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     *
     */
    onConnecting = function (evt) {
      if (callbacks.onConnecting) {
        callbacks.onConnecting(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.dial
     * @desc
     * This event callback gets invoked when an outgoing call flow is initiated and the call state is changed to call
     * established state
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.mediaType {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     */
    onCallEstablished = function (evt) {
      if (callbacks.onCallEstablished) {
        callbacks.onCallEstablished(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.dial, ATT.rtc.Phone.answer
     * @desc
     * This event callback gets invoked during an outgoing call or incoming call workflow is in progress. It means that
     * parties are engaged in conversation
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.calltype {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     */
    onCallInProgress = function (evt) {
      if (callbacks.onCallInProgress) {
        callbacks.onCallInProgress(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.dial,ATT.rtc.Phone.answer
     * @desc
     * This event callback gets invoked when a call is put on hold
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.mediaType {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     */
    onCallHold = function (evt) {
      if (callbacks.onCallHold) {
        callbacks.onCallHold(evt);
      }
    };

    /**
     * @event
     * @summary Applies to ATT.rtc.Phone.answer, ATT.rtc.Phone.dial
     * @desc
     * This event callback gets invoked when a call is in resumed state
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.mediaType {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     */
    onCallResume = function (evt) {
      if (callbacks.onCallResume) {
        callbacks.onCallResume(evt);
      }
    };

    /**
     * @event
     * @summary Applies to  ATT.rtc.Phone.login ,ATT.rtc.Phone.dial, ATT.rtc.Phone.answer
     * @desc
     * This event callback gets invoked
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.mediaType {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     */
    onCallEnded = function (evt) {
      if (callbacks.onCallEnded) {
        callbacks.onCallEnded(evt);
      }
    };

    /**
     * @event
     * @summary Applies to  ATT.rtc.Phone.login, ATT.rtc.Phone.dial, ATT.rtc.Phone.answer
     * @desc
     * This event callback gets invoked
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.mediaType {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
     */
    onCallError = function (evt) {
      if (callbacks.onCallError) {
        callbacks.onCallError(evt);
      }
    };

    /**
     * @event
     * @summary Applies to  ATT.rtc.Phone.login
     * This event callback gets invoked
     * @memberof ATT.rtc.Phone
     * @param {Object} evt Event Object
     * @param evt.from {String} Tel or sip uri
     * @param evt.to {String} Empty
     * @param evt.mediaType {String} Type of call
     * @param evt.timestamp {Date} Timestamp
     * @param evt.codec {String} Codec
     * @param evt.error {String} Error object
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
      session.deleteCurrentCall();
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
        //session.setCurrentCallId(data.resource.split('/')[6]);
      }
    };

    eventRegistry[mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (event, data) {
      logger.logDebug(event);

      if (data.sdp && data.modId) {
        peerConnService.setRemoteAndCreateAnswer(data.sdp, data.modId);
      }

      // Handle call hold and resume events
      if (event.state === mainModule.CallStatus.HOLD) {
        logger.logInfo('Received hold request');
        onCallHold(event);
        session.getCurrentCall().setCallState(ATT.CallStates.HELD);
      } else if (event.state === mainModule.CallStatus.RESUMED) {
        logger.logInfo('Received resume request');
        onCallResume(event);
        session.getCurrentCall().setCallState(ATT.CallStates.RESUMED);
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
      if (session) {
        session.deleteCurrentCall();
      }      
      peerConnService.endCall();
      UserMediaService.stopStream();
    };

    eventRegistry[mainModule.RTCCallEvents.UNKNOWN] = function (event) {
      onCallError(event);
    };

    return eventRegistry;
  }

  utils.createEventRegistry = createEventRegistry;

}(ATT, ATT.utils, ATT.PeerConnectionService, ATT.UserMediaService));
