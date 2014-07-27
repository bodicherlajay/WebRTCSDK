/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/

(function () {
  'use strict';

  var factories = ATT.private.factories,
    logManager = ATT.logManager.getInstance(),
    sdpFilter = ATT.sdpFilter.getInstance();

  /**
  * Call Prototype
  * @param {String} peer The peer
  * @param {String} mediaType The mediaType
  */
  function Call(options) {

    // ===================
    // private properties
    // ===================
    var that = this,
      id,
      peer,
      mediaType,
      type,
      breed,
      sessionInfo,
      localMedia,
      remoteMedia,
      localSdp = null,
      remoteSdp = null,
      state = null,
      codec = null,
      logger = logManager.addLoggerForModule('Call'),
      emitter = factories.createEventEmitter(),
      rtcManager = ATT.private.rtcManager.getRTCManager();

    // ================
    // Private methods
    // ================
    function createEventData() {
      var data = {
        timestamp: new Date(),
        mediaType: mediaType
      };

      if (codec) {
        data.codec = codec;
      }
      if (type === ATT.CallTypes.OUTGOING) {
        data.to = peer;
      } else if (type === ATT.CallTypes.INCOMING) {
        data.from = peer;
      }
      return data;
    }

    function getState() {
      return state;
    }

    function setState(newState) {
      state = newState;
      emitter.publish(state, createEventData.call(this));
    }

    function onMediaModifications(modifications) {
      rtcManager.setMediaModifications(modifications);
      if (modifications.remoteSdp
        && modifications.remoteSdp.indexOf('recvonly') !== -1) {
        setState('held');
        rtcManager.disableMediaStream();
      }
      if (modifications.remoteSdp
        && remoteSdp
        && remoteSdp.indexOf
        && remoteSdp.indexOf('recvonly') !== -1
        && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
        setState('resumed');
        rtcManager.enableMediaStream();
      }
      setRemoteSdp(modifications.remoteSdp);
    }

    function onMediaModTerminations(modifications) {
      if (modifications.remoteSdp) {
        rtcManager.setRemoteDescription({
          remoteSdp: modifications.remoteSdp,
          type: 'answer'
        });
        if (modifications.reason === 'success'
          && modifications.remoteSdp.indexOf('sendonly') !== -1
          && modifications.remoteSdp.indexOf('sendrecv') === -1) {
          setState('held');
          rtcManager.disableMediaStream();
        }
        if (modifications.reason === 'success'
          && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
          setState('resumed');
          rtcManager.enableMediaStream();
        }
        setRemoteSdp(modifications.remoteSdp);
      }
    }

    // ================
    // Public Methods
    // ================
    /**
     *
     * Set the CallId
     * @param {String} callId The callId
     * @param <opt> {Object} data Event data
     */
    function setId(callId) {
      id  = callId;

      if (id === null) {
        setState('disconnected');
      } else {
        setState('connecting');
      }
    }

    function setRemoteSdp(sdp) {
      remoteSdp = sdp;
      codec = sdpFilter.getCodecfromSDP(sdp);
    }

    function on(event, handler) {

      if ('connecting' !== event &&
          'rejected' !== event &&
          'connected' !== event &&
          'muted' !== event &&
          'unmuted' !== event &&
          'media-established' !== event &&
          'error' !== event &&
          'held' !== event &&
          'resumed' !== event &&
          'disconnecting' !== event &&
          'disconnected' !== event) {
        throw new Error('Event not defined');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }


    function onCallDisconnected(data) {
      id = null;

      if (undefined !== data && 'Call rejected' === data.reason) {
        setState('rejected');
      } else {
        emitter.publish('disconnected', data);
      }
      rtcManager.off('call-disconnected', onCallDisconnected);
      rtcManager.resetPeerConnection();

    }
    /*
     * Connect the Call
     * Connects the call based on callType(Incoming|Outgoing)
     * @param {Object} The call config
    */
    function connect(config) {
      try {

        if (undefined !== config.localMedia) {
          localMedia = config.localMedia;
        }

        if (undefined !== config.remoteMedia) {
          remoteMedia = config.remoteMedia;
        }

        remoteMedia.addEventListener('playing', function () {
          setState('media-established');
        });

        rtcManager.on('media-modifications', onMediaModifications);

        rtcManager.on('media-mod-terminations', onMediaModTerminations);

        rtcManager.on('call-connected', function (data) {
          if (data.remoteSdp) {
            rtcManager.setRemoteDescription({
              remoteSdp: data.remoteSdp,
              type: 'answer'
            });
            setRemoteSdp(data.remoteSdp);
          }

          setState('connected');

          rtcManager.playStream('remote');
        });

        rtcManager.connectCall({
          localMedia: localMedia,
          remoteMedia: remoteMedia,
          peer: peer,
          callId: id,
          type: type,
          mediaType: mediaType,
          remoteSdp: remoteSdp,
          sessionInfo: sessionInfo,
          onCallConnecting: function (callInfo) {
            try {
              if (type === ATT.CallTypes.OUTGOING) {
                setId(callInfo.callId);
              }
              if (type === ATT.CallTypes.INCOMING) {
                setState(callInfo.xState);
              }
              localSdp = callInfo.localSdp;
            } catch (err) {
              emitter.publish('error', {
                error: err
              });
            }
          },
          onError: function (error) {
            emitter.publish('error', {
              error: error
            });
          },
          onUserMediaError: function (error) {
            emitter.publish('error', {
              error: error
            });
          }
        });

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    function disconnect() {

      setState('disconnecting');

      if (null === id) {
        logger.logInfo('Canceling call ...');
        rtcManager.cancelCall({
          success: function () {
            logger.logInfo('Call canceled succesfully');
            setState('disconnected');
            rtcManager.resetPeerConnection();
          },
          onError : function (error) {
            emitter.publish('error', error);
          }
        });
      } else {
        logger.logInfo('Disconnecting call');
        rtcManager.disconnectCall({
          sessionInfo: sessionInfo,
          callId: id,
          onError: function (error) {
            emitter.publish('error', {
              error: error
            });
          }
        });
      }
    }

    function mute() {

      rtcManager.muteCall({
        onSuccess: function () {
          setState('muted');
        },
        onError : function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function unmute() {

      rtcManager.unmuteCall({
        onSuccess: function () {
          setState('unmuted');
        },
        onError : function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function hold() {

      rtcManager.holdCall({
        onSuccess: function (sdp) {
          localSdp = sdp;
        },
        callId: id,
        onError : function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function resume() {

      rtcManager.resumeCall({
        onSuccess: function (sdp) {
          localSdp = sdp;
        },
        callId: id,
        onError : function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function reject() {

      rtcManager.rejectCall({
        sessionId : sessionInfo.sessionId,
        callId : id,
        token : sessionInfo.token,
        onSuccess : function () {
          rtcManager.off('call-disconnected', onCallDisconnected);
        },
        onError : function (error) {
          emitter.publish('error', error);
        }
      });

    }

    if (undefined === options
        || 0 === Object.keys(options).length) {
      throw new Error('No input provided');
    }
    if (undefined === options.breed) {
      throw new Error('No breed provided');
    }
    if (undefined === options.peer) {
      throw new Error('No peer provided');
    }
    if (undefined === options.type) {
      throw new Error('No type provided');
    }
    if (undefined === options.mediaType) {
      throw new Error('No mediaType provided');
    }

    // Call attributes
    breed = options.breed;

    if (undefined === options.id) {
      id = null;
    } else {
      id = options.id;
    }

    state = 'created';
    peer = options.peer;
    mediaType = options.mediaType;
    type = options.type;
    sessionInfo = options.sessionInfo;
    localMedia = options.localMedia;
    remoteMedia = options.remoteMedia;

    rtcManager.on('call-disconnected', onCallDisconnected);

    // ===================
    // public interface
    // ===================
    return {
      peer: function () {
        return peer;
      },
      codec: function () {
        return codec;
      },
      mediaType: function () {
        return mediaType;
      },
      type: function (){
        return type;
      },
      breed: function () {
        return breed;
      },
      sessionInfo: function () {
        return sessionInfo;
      },
      id: function () {
        return id;
      },
      localSdp: function () {
        return localSdp;
      },
      localMedia: function () {
        return localMedia;
      },
      remoteMedia: function () {
        return remoteMedia;
      },
      remoteSdp: function () {
        return remoteSdp;
      },
      setRemoteSdp : setRemoteSdp,
      getState : getState,
      setState : setState,
      setId : setId,
      on : on,
      connect : connect,
      disconnect : disconnect,
      mute : mute,
      unmute : unmute,
      hold : hold,
      resume : resume,
      reject : reject
    };
  }

  if (undefined === ATT.rtc) {
    throw new Error('Cannot export Call. ATT.rtc is undefined');
  }

  ATT.rtc.Call = Call;

}());
