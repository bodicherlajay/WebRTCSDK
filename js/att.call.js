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

    // private properties
    var state = 'created',
      emitter = factories.createEventEmitter(),
      rtcManager = ATT.private.rtcManager.getRTCManager();

    function on(event, handler) {

      if ('connecting' !== event &&
          'canceled' !== event &&
          'rejected' !== event &&
          'connected' !== event &&
          'muted' !== event &&
          'unmuted' !== event &&
          'media-established' !== event &&
          'ended' !== event &&
          'error' !== event &&
          'hold' !== event &&
          'resume' !== event &&
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

      if (undefined !== config.localMedia) {
        call.localMedia = config.localMedia;
      }

      if (undefined !== config.remoteMedia) {
        call.remoteMedia = config.remoteMedia;
      }

      call.remoteMedia.addEventListener('playing', function () {
        emitter.publish('media-established');
      });

      rtcManager.on('media-modifications', function (modifications) {
        rtcManager.setMediaModifications(modifications);
        if (modifications.remoteSdp
            && modifications.remoteSdp.indexOf('recvonly') !== -1) {
          call.setState(ATT.CallStates.HELD);
          rtcManager.disableMediaStream(); 
        }
        if (modifications.remoteSdp
            && call.remoteSdp
            && call.remoteSdp.indexOf
            && call.remoteSdp.indexOf('recvonly') !== -1
            && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
          call.setState(ATT.CallStates.RESUMED);
          rtcManager.enableMediaStream();
        }
        call.setRemoteSdp(modifications.remoteSdp);
      });

      rtcManager.on('media-mod-terminations', function (modifications) {
        if (modifications.remoteSdp) {
          rtcManager.setRemoteDescription({
            remoteSdp: modifications.remoteSdp,
            type: 'answer'
          });
          if (modifications.reason === 'success'
              && modifications.remoteSdp.indexOf('sendonly') !== -1
              && modifications.remoteSdp.indexOf('sendrecv') === -1) {
            call.setState(ATT.CallStates.HELD);
            rtcManager.disableMediaStream();
          }
          if (modifications.reason === 'success'
              && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
            call.setState(ATT.CallStates.RESUMED);
            rtcManager.enableMediaStream();
          }
          call.setRemoteSdp(modifications.remoteSdp);
        }
      });

      rtcManager.on('call-connected', function (data) {
        call.setRemoteSdp(data.remoteSdp);
        rtcManager.setRemoteDescription({
          remoteSdp: data.remoteSdp,
          type: 'answer'
        });
        emitter.publish('connected');

        rtcManager.playStream('remote');
      });

      rtcManager.connectCall({
        peer: call.peer,
        callId: call.id,
        type: call.type,
        mediaType: call.mediaType,
        localMedia: config.localMedia || call.localMedia,
        remoteMedia: config.remoteMedia || call.remoteMedia,
        remoteSdp: call.remoteSdp,
        sessionInfo: call.sessionInfo,
        onCallConnecting: function (callInfo) {
          if(call.type === ATT.CallTypes.OUTGOING) {
            call.setId(callInfo.callId);
          }
          if(call.type === ATT.CallTypes.INCOMING) {
            call.setState(callInfo.xState);
          }
          call.localSdp = callInfo.localSdp;
        }
      });
    }

    function disconnect() {
      var call = this;

      emitter.publish('disconnecting');

      rtcManager.on('call-disconnected', function (data) {
        call.setId(null, data);
      });

      rtcManager.disconnectCall({
        sessionInfo: this.sessionInfo,
        callId: this.id
      });
    }

    function getState() {
      return state;
    }

    function setState(newState) {
      state = newState;

      emitter.publish(state);
    }

    /**
    *
    * Set the CallId
    * @param {String} callId The callId
    * @param <opt> {Object} data Event data
    */
    function setId(callId, data) {
      this.id  = callId;
      if (this.id === null) {
        emitter.publish('disconnected', data);
      } else {
        emitter.publish('connecting');
      }
    }

    function setRemoteSdp(remoteSdp) {
      this.remoteSdp = remoteSdp;
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

    function hold() {
      var call = this;

      rtcManager.holdCall({
        onSuccess: function (localSdp) {
          call.localSdp = localSdp;
        },
        callId: call.id
      });
    }

    function resume() {
      var call = this;

      rtcManager.resumeCall({
        onSuccess: function (localSdp) {
          call.localSdp = localSdp;
        },
        callId: call.id
      });
    }

    function reject() {
      var call = this;
      rtcManager.reject({
        sessionId : call.sessionInfo.sessionId,
        callId : call.id,
        token : call.sessionInfo.token,
        onSuccess : function () {
        },
        onError : function () {

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
    this.getState = getState;
    this.setState = setState;
    this.setId = setId.bind(this);
    this.setRemoteSdp = setRemoteSdp.bind(this);
    this.mute = mute.bind(this);
    this.unmute = unmute.bind(this);
    this.hold = hold.bind(this);
    this.resume = resume.bind(this);
    this.reject = reject.bind(this);

  }

  if (undefined === ATT.rtc) {
    throw new Error('Cannot export Call. ATT.rtc is undefined');
  }

  ATT.rtc.Call = Call;

}());
