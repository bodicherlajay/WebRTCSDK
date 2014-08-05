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
      peerConnection,
      mediaType,
      type,
      breed,
      invitations = {},
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
      if (Object.keys(invitations).length > 0) {
        data.invitations = invitations;
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
      if (modifications.remoteDescription
        && modifications.remoteDescription.indexOf('recvonly') !== -1) {
        that.setState('held');
        rtcManager.disableMediaStream();
      }
      if (modifications.remoteDescription
        && remoteSdp
        && remoteSdp.indexOf
        && remoteSdp.indexOf('recvonly') !== -1
        && modifications.remoteDescription.indexOf('sendrecv') !== -1) {
        that.setState('resumed');
        rtcManager.enableMediaStream();
      }
      that.setRemoteSdp(modifications.remoteDescription);
    }

    function onMediaModTerminations(modifications) {

      if (breed === 'conference') {
        if ('conference' === modifications.type
          && undefined !== modifications.modificationId) {
          logger.logInfo('onMediaModTerminations:conference');
          if ('success' === modifications.reason) {
            setParticipant(modifications.from, 'active');
            emitter.publish('invite-accepted', createEventData());
          }
          if ('rejected' === modifications.reason) {
            setInvitee(modifications.from, 'rejected');
            emitter.publish('rejected', createEventData());
          }
        }
      } else if (breed === 'call') {
        if (modifications.remoteSdp) {
          rtcManager.setRemoteDescription({
            remoteDescription: modifications.remoteSdp,
            type: 'answer'
          });
          if (modifications.reason === 'success'
            && modifications.remoteSdp.indexOf('sendonly') !== -1
            && modifications.remoteSdp.indexOf('sendrecv') === -1) {
            that.setState('held');
            rtcManager.disableMediaStream();
          }
          if (modifications.reason === 'success'
            && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
            that.setState('resumed');
            rtcManager.enableMediaStream();
          }
          remoteSdp = modifications.remoteSdp;
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

    function setRemoteSdp(sdp) {
      remoteSdp = sdp;
      if (null !== sdp) {
        codec = sdpFilter.getCodecfromSDP(sdp);
      }
    }

    function on(event, handler) {

      if ('connecting' !== event &&
          'response-pending' !== event &&
          'invite-accepted' !== event &&
          'rejected' !== event &&
          'connected' !== event &&
          'muted' !== event &&
          'unmuted' !== event &&
          'media-established' !== event &&
          'stream-added' !== event &&
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
      var pcOptions,
        connectOptions;

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
            that.setState('media-established');
          });
        }

        rtcManager.on('media-modifications', onMediaModifications);

        rtcManager.on('media-mod-terminations', onMediaModTerminations);

        rtcManager.on('call-connected', function (data) {

          that.setState('connected');

          if ('call' === that.breed()) {
            if (data.remoteDescription) {
              rtcManager.setRemoteDescription({
                remoteDescription: data.remoteDescription,
                type: 'answer'
              });
              that.setRemoteSdp(data.remoteDescription);
            }

            rtcManager.playStream('remote');
            return;
          }

          if ('conference' === breed) {
            peerConnection.setRemoteDescription({
              sdp: data.remoteSdp,
              type: 'offer'
            });
            return;
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
            remoteDescription: remoteSdp,
            sessionInfo: sessionInfo,
            onCallConnecting: function (callInfo) {
              try {
                if (type === ATT.CallTypes.OUTGOING) {
                  that.setId(callInfo.callId);
                }
                if (type === ATT.CallTypes.INCOMING) {
                  that.setState(callInfo.xState);
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
            stream: localStream,
            onSuccess: function (description) {

              connectOptions = {
                sessionId: sessionInfo.sessionId,
                token: sessionInfo.token,
                description: description,
                sessionInfo: sessionInfo,
                onSuccess: function (responsedata) {
                  if (ATT.CallTypes.INCOMING === type) {
                    setState('connecting');
                  } else {
                    id = responsedata.id;
                    setState('connected');
                  }
                },
                onError: function (error) {
                  emitter.publish('error', {
                    error: error
                  });
                }
              };

              if (undefined !== id && null !== id) {
                connectOptions.conferenceId = id;
              }

              rtcManager.connectConference(connectOptions);
            },
            onError: function (error) {
              emitter.publish('error', {
                error: error
              });
            },
            onRemoteStream : function (stream) {
              logger.logInfo('onRemoteStream');
              emitter.publish('stream-added', {
                stream: stream
              });
            }
          };

          if (ATT.CallTypes.INCOMING === type) {
            pcOptions.remoteSdp = remoteSdp;
          }

          peerConnection = factories.createPeerConnection(pcOptions);
        }

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    function setParticipant(participant, status) {
      participants[participant] = {
        participant: participant,
        status: status
      }
    }

    function setInvitee (invitee, status) {
      invitations[invitee] = {
        invitee: invitee,
        status: status
      }
    }

    function addParticipant(invitee) {
      logger.logInfo('Sending invitation...');

      try {
        rtcManager.addParticipant({
          sessionInfo: sessionInfo,
          invitee: invitee,
          confId: id,
          onSuccess: function () {
            setInvitee(invitee, 'invited');
            emitter.publish('response-pending', {
              invitee: invitee,
              timestamp: new Date()
            });
          },
          onError: function (err) {
            logger.logError(err);
            emitter.publish('error', err);
          }
        });
      } catch (err) {
        emitter.publish('error', err);
      }
    }

    function updateParticipant(name, status) {

      logger.logDebug('updateParticipant');

      if (undefined !== that.participants()[name]) {
        logger.logDebug(name + ':' + status);
        this.participants()[name]['status'] = status;

        if ('accepted' === status) {
          that.setState('connected');
        }

        if ('rejected' === status) {
          that.setState('rejected');
        }
      }
    }

    function disconnect() {

      setState('disconnecting');

      if(breed === 'call') {
        if (null === remoteSdp) {
          logger.logInfo('Canceling...');

          rtcManager.cancelCall({
            callId: id,
            sessionId: sessionInfo.sessionId,
            token: sessionInfo.token,
            onSuccess: function () {
              logger.logInfo('Canceled successfully.');

              rtcManager.resetPeerConnection();
            },
            onError : function (error) {
              logger.logError(error);

              emitter.publish('error', {
                error: error
              });
            }
          });
        } else if (null !== id && null !== this.remoteSdp()) {
          logger.logInfo('Disconnecting...');

          rtcManager.disconnectCall({
            sessionId: sessionInfo.sessionId,
            token: sessionInfo.token,
            callId: id,
            breed: breed,
            onSuccess: function () {
              logger.logInfo('Successfully disconnected.');
            },
            onError: function (error) {
              logger.logError(error);
              emitter.publish('error', {
                error: error
              });
            }
          });
        }
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
        callId : id,
        sessionId : sessionInfo.sessionId,
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
    this.invitations = function () {
      return invitations;
    };
    this.sessionInfo = function () {
      return sessionInfo;
    };
    this.id = function () {
      return id;
    };
    this.localSdp = function () {

      if ('call' === breed) {
        return localSdp;
      }

      if (undefined === peerConnection) {
        return;
      }

      return peerConnection.getLocalDescription();
    };
    this.localMedia = function () {
      return localMedia;
    };
    this.remoteMedia = function () {
      return remoteMedia;
    };
    this.remoteSdp = function () {
      var description;

      if (breed === 'conference') {
        if (undefined === peerConnection) {
          return null;
        }
        description = peerConnection.getRemoteDescription();
        return description.sdp;
      }

      return remoteSdp;
    };
    this.localStream = function () {
      return localStream;
    };

    this.setRemoteSdp  = setRemoteSdp;
    this.getState = getState;
    this.setState = setState;
    this.setId = setId;
    this.on = on;
    this.addStream = addStream;
    this.connect = connect;
    this.disconnect = disconnect;
    this.addParticipant = addParticipant;
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
