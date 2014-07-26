/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/

(function () {
  'use strict';

  var factories = ATT.private.factories,
    logManager = ATT.logManager.getInstance(),
    logger = logManager.addLoggerForModule('Call');

  /**
  * Call Prototype
  * @param {String} peer The peer
  * @param {String} mediaType The mediaType
  */
  function Call(options) {

    if (undefined === options) {
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

    // private properties
    var that = this,
      state = 'created',
      emitter = factories.createEventEmitter(),
      rtcManager = ATT.private.rtcManager.getRTCManager();

    function createEventData() {
      var data = {
        timestamp: new Date(),
        mediaType: this.mediaType
      };

      if (this.codec) {
        data.codec = this.codec;
      }
      if (this.type === ATT.CallTypes.OUTGOING) {
        data.to = this.peer;
      } else if (this.type === ATT.CallTypes.INCOMING) {
        data.from = this.peer;
      }
      return data;
    }

    /**
     *
     * Set the CallId
     * @param {String} callId The callId
     * @param <opt> {Object} data Event data
     */
    function setId(callId) {
      this.id  = callId;

      if (this.id === null) {
        this.setState('disconnected');
      } else {
        this.setState('connecting');
      }
    }

    function getState() {
      return state;
    }

    function setState(newState) {
      state = newState;

      emitter.publish(state, createEventData.call(this));
    }

    function setRemoteSdp(remoteSdp) {
      this.remoteSdp = remoteSdp;
      this.codec = ATT.sdpFilter.getInstance().getCodecfromSDP(remoteSdp);
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
      that.id = null;

      if (undefined !== data && 'Call rejected' === data.reason) {
        that.setState('rejected');
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
        var call = this;

        if (undefined !== config.localMedia) {
          call.localMedia = config.localMedia;
        }

        if (undefined !== config.remoteMedia) {
          call.remoteMedia = config.remoteMedia;
        }

        call.remoteMedia.addEventListener('playing', function () {
          call.setState('media-established');
        });

        rtcManager.on('media-modifications', function (modifications) {
          rtcManager.setMediaModifications(modifications);
          if (modifications.remoteSdp
              && modifications.remoteSdp.indexOf('recvonly') !== -1) {
            call.setState('held');
            rtcManager.disableMediaStream();
          }
          if (modifications.remoteSdp
              && call.remoteSdp
              && call.remoteSdp.indexOf
              && call.remoteSdp.indexOf('recvonly') !== -1
              && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
            call.setState('resumed');
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
              call.setState('held');
              rtcManager.disableMediaStream();
            }
            if (modifications.reason === 'success'
                && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
              call.setState('resumed');
              rtcManager.enableMediaStream();
            }
            call.setRemoteSdp(modifications.remoteSdp);
          }
        });

        rtcManager.on('call-connected', function (data) {
          if (data.remoteSdp) {
            rtcManager.setRemoteDescription({
              remoteSdp: data.remoteSdp,
              type: 'answer'
            });
            call.setRemoteSdp(data.remoteSdp);
          }

          call.setState('connected');

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
            try {
              if (call.type === ATT.CallTypes.OUTGOING) {
                call.setId(callInfo.callId);
              }
              if (call.type === ATT.CallTypes.INCOMING) {
                call.setState(callInfo.xState);
              }
              call.localSdp = callInfo.localSdp;
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

      this.setState('disconnecting');

      if (null === this.id) {
        logger.logInfo('Canceling call ...');
        rtcManager.cancelCall({
          success: function () {
            logger.logInfo('Call canceled succesfully');
            that.setState('disconnected');
            rtcManager.resetPeerConnection();
          },
          onError : function (error) {
            emitter.publish('error', error);
          }
        });
      } else {
        logger.logInfo('Disconnecting call');
        rtcManager.disconnectCall({
          sessionInfo: this.sessionInfo,
          callId: this.id,
          onError: function(error) {
            emitter.publish('error', {
              error: error
            });
          }
        });
      }
    }

    function mute() {
      var call = this;

      rtcManager.muteCall({
        onSuccess: function () {
          call.setState('muted');
        },
        onError : function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function unmute() {
      var call = this;

      rtcManager.unmuteCall({
        onSuccess: function () {
          call.setState('unmuted');
        },
        onError : function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function hold() {
      var call = this;

      rtcManager.holdCall({
        onSuccess: function (localSdp) {
          call.localSdp = localSdp;
        },
        callId: call.id,
        onError : function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function resume() {
      var call = this;

      rtcManager.resumeCall({
        onSuccess: function (localSdp) {
          call.localSdp = localSdp;
        },
        callId: call.id,
        onError : function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function reject() {
      var call = this;
      rtcManager.rejectCall({
        sessionId : call.sessionInfo.sessionId,
        callId : call.id,
        token : call.sessionInfo.token,
        onSuccess : function () {
          rtcManager.off('call-disconnected', onCallDisconnected);
        },
        onError : function (error) {
          emitter.publish('error', error);
        }
      });

    }

    // Call attributes
    this.breed = options.breed;
    if (undefined === options.id) {
      this.id = null;
    } else {
      this.id = options.id;
    }
    this.peer = options.peer;
    this.mediaType = options.mediaType;
    this.type = options.type;
    this.sessionInfo = options.sessionInfo;
    this.localSdp = null;
    this.remoteSdp = null;
    this.localMedia = options.localMedia;
    this.remoteMedia = options.remoteMedia;
    this.state = null;
    this.codec = null;

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


    rtcManager.on('call-disconnected', onCallDisconnected);

  }

  if (undefined === ATT.rtc) {
    throw new Error('Cannot export Call. ATT.rtc is undefined');
  }

  ATT.rtc.Call = Call;

}());
