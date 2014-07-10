/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Logger, ATT*/

//Dependency: Runtime - ATT.UserMediaService, ATT.PeerConnectionService, ATT.RTCEvent
//Dependency: ATT.logManager


(function () {
  'use strict';

  var factories = ATT.private.factories,
    errMgr = null,
    userMediaSvc = null,
    peerConnSvc = null,
    logManager = ATT.logManager.getInstance(),
    logger = logManager.getLoggerByName('Call');

  function handleError(operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);

    logger.logInfo('There was an error performing operation ' + operation);

    var error = errMgr.create(err, operation);

    if (typeof errHandler === 'function') {
      errHandler(error);
    }
  }

  // function handleCallMediaModifications(event, data) {
  //   peerConnSvc.setRemoteAndCreateAnswer(data.sdp, data.modId);
  //   if (event.state === ATT.CallStatus.HOLD) {
  //     userMediaSvc.muteStream();
  //   } else if (event.state === ATT.CallStatus.RESUMED) {
  //     userMediaSvc.unmuteStream();
  //   }
  // }

  // function handleCallMediaTerminations(event, data) {
  //   if (data.modId) {
  //     peerConnSvc.setModificationId(data.modId);
  //   }
  //   if (data.sdp) {
  //     peerConnSvc.setTheRemoteDescription(data.sdp, 'answer');
  //   }
  //   if (event.state === ATT.CallStatus.HOLD) {
  //     userMediaSvc.holdVideoStream();
  //     userMediaSvc.muteStream();
  //   } else if (event.state === ATT.CallStatus.RESUMED) {
  //     userMediaSvc.resumeVideoStream();
  //     userMediaSvc.unmuteStream();
  //   }
  // }

  // function handleCallOpen(data) {
  //   if (data.sdp) {
  //     peerConnSvc.setTheRemoteDescription(data.sdp, 'answer');
  //   }
  // }

  // function holdCall() {
  //   peerConnSvc.holdCall();
  // }

  // function resumeCall() {
  //   peerConnSvc.resumeCall();
  // }

  /**
   * Call cancel
   * @param {Object} options The options
   */
  // function cancelCall(session) {
  //   logger.logInfo('Canceling up...');
  //   ATT.SignalingService.sendCancelCall({
  //     success: function () {
  //       session.deleteCall(session.getCurrentCall().id());
  //     },
  //     error: function () {
  //       ATT.Error.publish('SDK-20034', null, session.onError);
  //       logger.logWarning('Cancel request failed.');
  //     },
  //     session: session
  //   });
  // }

  // *
  //  * Call reject
  //  * @param {Object} options The options
   
  // function rejectCall(session) {
  //   logger.logInfo('Rejecting call...');
  //   ATT.SignalingService.sendRejectCall({
  //     success: function () {
  //       session.deleteCall(session.getCurrentCall().id());
  //     },
  //     error: function () {
  //       ATT.Error.publish('SDK-20035', null, options.onError);
  //       logger.logWarning('Reject request failed.');
  //     },
  //     session: session
  //   });
  // }

  /**
  * Call Prototype
  * @param {String} peer The peer
  * @param {String} mediaType The mediaType
  */
  function Call(options) {

    if (undefined === options) {
      throw new Error('No input provided');
    }
    if (undefined === options.peer) {
      throw new Error('No peer provided');
    }
    if (undefined === options.mediaType) {
      throw new Error('No mediaType provided');
    }

    var emitter = factories.createEventEmitter(),
      rtcManager = ATT.private.rtcManager.getRTCManager();

    function on(event, handler) {

      if ('dialing' !== event &&
          'answering' !== event &&
          'connecting' !== event &&
          'canceled' !== event &&
          'rejected' !== event &&
          'connected' !== event &&
          'muted' !== event &&
          'unmuted' !== event &&
          'established' !== event &&
          'ended' !== event &&
          'error' !== event &&
          'disconnecting' !== event &&
          'disconnected' !== event) {
        throw new Error('Event not defined');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }

    /*
     * Connect the Call
     * Connects the call based on callType(Incoming|Outgoing)
     * @param {Object} The call config
    */
    function connect(config) {
      var call = this;

      if ('Outgoing' === call.type) {
        emitter.publish('dialing');
      } else if ('Incoming' === call.type) {
        emitter.publish('answering');
      }

      if (undefined !== config.localMedia) {
        call.localMedia = config.localMedia;
      }

      if (undefined !== config.remoteMedia) {
        call.remoteMedia = config.remoteMedia;
      }

      rtcManager.on('remote-sdp-set', function (remoteSdp) {
        call.setRemoteSdp(remoteSdp);
      });

      rtcManager.on('media-established', function () {
        emitter.publish('established');
      });

      rtcManager.connectCall({
        peer: call.peer,
        type: call.type,
        mediaType: call.mediaType,
        localMedia: config.localMedia || call.localMedia,
        remoteMedia: config.localMedia || call.localMedia,
        sessionInfo: call.sessionInfo,
        remoteSdp: call.remoteSdp,
        onCallConnecting: function (callInfo) {
          call.setId(callInfo.callId);
          call.localSdp = callInfo.localSdp;
        }
      });
    }

    function disconnect() {
      rtcManager.disconnectCall({
        sessionInfo: this.sessionInfo,
        callId: this.id
      });
      emitter.publish('disconnecting');
    }

    function setId(callId) {
      this.id  = callId;
      if (this.id === null) {
        emitter.publish('disconnected');
      } else {
        emitter.publish('connecting');
      }
    }

    function setRemoteSdp(remoteSdp) {
      this.remoteSdp = remoteSdp;
      emitter.publish('connected');
    }

    function mute() {
      var call = this;

      rtcManager.muteCall({
        onSuccess: function () {
          call.state = ATT.CallStates.MUTED;
          emitter.publish('muted');
        }
      });
    }

    function unmute() { 
      var call = this;

      rtcManager.unmuteCall({
        onSuccess: function () {
          call.state = ATT.CallStates.ONGOING;
          emitter.publish('unmuted');
        }
      });
    }

    // Call attributes
    this.id = options.id;
    this.peer = options.peer;
    this.mediaType = options.mediaType;
    this.type = options.type;
    this.sessionInfo = options.sessionInfo;
    this.localSdp = null;
    this.remoteSdp = options.remoteSdp || null;
    this.localMedia = options.localMedia;
    this.remoteMedia = options.remoteMedia;
    this.state = null;

    // Call methods
    this.on = on.bind(this);
    this.connect = connect.bind(this);
    this.disconnect = disconnect.bind(this);
    this.setId = setId.bind(this);
    this.setRemoteSdp = setRemoteSdp.bind(this);
    this.mute = mute.bind(this);
    this.unmute = unmute.bind(this);

    if (undefined !== this.id) {
      emitter.publish('created', this.id);
      return;
    }
    emitter.publish('created');
  }

  if (undefined === ATT.rtc) {
    throw new Error('Cannot export Call. ATT.rtc is undefined');
  }

  ATT.rtc.Call = Call;

}());
