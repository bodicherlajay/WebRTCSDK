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
    var thisCall = this,
      id,
      peer,
      mediaType,
      type,
      breed,
      participants = {},
      sessionInfo,
      localMedia,
      remoteMedia,
      localSdp = null,
      remoteSdp = null,
      localStream = null,
      state = null,
      codec = [],
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

      if (undefined !== codec) {
        data.codec = codec;
      }
      if (type === ATT.CallTypes.OUTGOING) {
        data.to = peer;
      } else if (type === ATT.CallTypes.INCOMING) {
        data.from = peer;
      }
      if (Object.keys(participants).length > 0) {
        data.participants = participants;
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
        thisCall.setState('held');
        rtcManager.disableMediaStream();
      }
      if (modifications.remoteSdp
        && remoteSdp
        && remoteSdp.indexOf
        && remoteSdp.indexOf('recvonly') !== -1
        && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
        thisCall.setState('resumed');
        rtcManager.enableMediaStream();
      }
      thisCall.setRemoteSdp(modifications.remoteSdp);
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
          thisCall.setState('held');
          rtcManager.disableMediaStream();
        }
        if (modifications.reason === 'success'
          && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
          thisCall.setState('resumed');
          rtcManager.enableMediaStream();
        }
        thisCall.setRemoteSdp(modifications.remoteSdp);
      }

      if ('conference' === modifications.type && undefined !== modifications.modificationId) {
        if (null === thisCall.remoteSdp()) {
          if ('success' === modifications.reason) {
            thisCall.updateParticipant(modifications.modificationId, 'accepted');
          }
          if ('rejected' === modifications.reason) {
            thisCall.updateParticipant(modifications.modificationId, 'rejected');
          }
        }
      }
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

    function setLocalSdp(sdp) {
      localSdp = sdp;
    }

    function setRemoteSdp(sdp) {
      remoteSdp = sdp;
      if (null !== sdp) {
        codec = sdpFilter.getCodecfromSDP(sdp);
      }
    }

    function on(event, handler) {

      if ('connecting' !== event &&
          'rejected' !== event &&
          'participant-pending' !== event &&
          'invite-accepted' !== event &&
          'invite-rejected' !== event &&
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

    function addStream(stream) {
      localStream = stream;
    }

    /*
     * Connect the Call
     * Connects the call based on callType(Incoming|Outgoing)
     * @param {Object} The call config
    */
    function connect(connectOpts) {
      var pcOptions;

      try {

        if (undefined !== connectOpts) {
          if (undefined !== connectOpts.localMedia) {
            localMedia = connectOpts.localMedia;
          }

          if (undefined !== connectOpts.remoteMedia) {
            remoteMedia = connectOpts.remoteMedia;
          }
        }

        if (undefined !== remoteMedia) {
          remoteMedia.addEventListener('playing', function () {
            thisCall.setState('media-established');
          });
        }

        rtcManager.on('media-modifications', onMediaModifications);

        rtcManager.on('media-mod-terminations', onMediaModTerminations);

        rtcManager.on('call-connected', function (data) {
          thisCall.setState('connected');

          if ('call' === thisCall.breed()) {
            if (data.remoteSdp) {
              rtcManager.setRemoteDescription({
                remoteSdp: data.remoteSdp,
                type: 'answer'
              });
              thisCall.setRemoteSdp(data.remoteSdp);
            }

            rtcManager.playStream('remote');
          }
        });

        if ('call' === this.breed()) {
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
                  thisCall.setId(callInfo.callId);
                }
                if (type === ATT.CallTypes.INCOMING) {
                  thisCall.setState(callInfo.xState);
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
        }

        if ('conference' === this.breed()) {

          pcOptions = {
            mediaType: mediaType,
            localStream: localStream,
            onSuccess: function (localSdp) {

//              thisCall.setLocalSdp(localSdp);

              rtcManager.connectConference({
//                localSdp: thisCall.localSdp(),
//                onSuccess: function (state) {
//                  thisCall.setState('connecting');
//                },
//                onError: function (error) {
//                  emitter.publish('error', {
//                    error: error
//                  });
//                }
              });
            },
            onError: function(error) {
//              emitter.publish('error', {
//                error: error
//            });
            }
          };

          if(ATT.CallTypes.INCOMING === type) {
            pcOptions.remoteSdp = remoteSdp;
          }

          factories.createPeerConnection(pcOptions);
        }

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    function setParticipant (participant, status, id) {
      thisCall.participants()[id] = {
        participant: participant,
        status: status,
        id: id
      }
    }

    function addParticipant(participant) {
      logger.logInfo('Inviting participant...');
      rtcManager.addParticipant({
        sessionInfo: sessionInfo,
        participant: participant,
        confId: id,
        onParticipantPending: function (modId) {
          thisCall.setParticipant(participant, 'invitee', modId);
          thisCall.setState('participant-pending');
        },
        onError: function (error) {
          emitter.publish('error', error);
        }
      });
    }

    function updateParticipant(id, status) {
      if (undefined !== thisCall.participants()[id]) {
        this.participants()[id]['status'] = status;
      }
      if ('accepted' === status) {
        thisCall.setState('connected');
      }
      if ('rejected' === status) {
        thisCall.setState('rejected');
      }
    }

    function disconnect() {

      setState('disconnecting');

      if (null === remoteSdp) {
        logger.logInfo('Canceling call ...');
        rtcManager.cancelCall({
          sessionInfo: sessionInfo,
          callId: id,
          success: function () {
            logger.logInfo('Call canceled successfully');
            rtcManager.resetPeerConnection();
          },
          onError : function (error) {
            emitter.publish('error', error);
          }
        });
      } else if (null !== id && null !== remoteSdp) {
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
    if (options.breed === "call" && undefined === options.peer) {
      throw new Error('No peer provided');
    }
    if (undefined === options.type) {
      throw new Error('No type provided');
    }
    if (undefined === options.mediaType) {
      throw new Error('No mediaType provided');
    }

    rtcManager.on('call-disconnected', onCallDisconnected);

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

    // ===================
    // public interface
    // ===================
    this.peer = function () {
      return peer;
    };
    this.codec = function () {
      return codec;
    };
    this.mediaType = function () {
      return mediaType;
    };
    this.type = function (){
      return type;
    };
    this.breed = function () {
      return breed;
    };
    this.participants = function () {
      return participants;
    };
    this.sessionInfo = function () {
      return sessionInfo;
    };
    this.id = function () {
      return id;
    };
    this.localSdp = function () {
      return localSdp;
    };
    this.localMedia = function () {
      return localMedia;
    };
    this.remoteMedia = function () {
      return remoteMedia;
    };
    this.remoteSdp = function () {
      return remoteSdp;
    };
    this.localStream = function () {
      return localStream;
    };

    this.setLocalSdp = setLocalSdp;
    this.setRemoteSdp  = setRemoteSdp;
    this.getState = getState;
    this.setState = setState;
    this.setId = setId;
    this.on = on;
    this.addStream = addStream;
    this.connect = connect;
    this.disconnect = disconnect;
    this.addParticipant = addParticipant;
    this.setParticipant = setParticipant;
    this.updateParticipant = updateParticipant;
    this.mute = mute;
    this.unmute = unmute;
    this.hold = hold;
    this.resume = resume;
    this.reject = reject;
  }

  if (undefined === ATT.rtc) {
    throw new Error('Cannot export Call. ATT.rtc is undefined');
  }

  ATT.rtc.Call = Call;

}());
