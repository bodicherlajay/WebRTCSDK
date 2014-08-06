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

    function onMediaModifications(data) {
      if ('call' === breed) {
        rtcManager.setMediaModifications(data);
        if (data.remoteSdp
            && data.remoteSdp.indexOf('recvonly') !== -1) {
          that.setState('held');
          rtcManager.disableMediaStream();
        } else if (data.remoteSdp
            && remoteSdp
            && remoteSdp.indexOf
            && remoteSdp.indexOf('recvonly') !== -1
            && data.remoteSdp.indexOf('sendrecv') !== -1) {
          that.setState('resumed');
          rtcManager.enableMediaStream();
        }
        that.setRemoteSdp(data.remoteSdp);
        return;
      }

      if ('conference' === breed) {
        if (undefined !== data.remoteSdp) {
          peerConnection.setRemoteDescription({
            remoteSdp: data.remoteSdp,
            onSuccess: function () {
            },
            onError: function () {
            }
          });
        }
      }
    }

    function onMediaModTerminations(modifications) {

      logger.logDebug('onMediaModTerminations');
      logger.logDebug (modifications);

      if (breed === 'conference') {

        if (undefined !== modifications.remoteSdp) {
          peerConnection.setRemoteDescription({
            sdp: modifications.remoteSdp,
            type: 'offer'
          });
        }

        if ('conference' === modifications.type
            && undefined !== modifications.modificationId) {
          logger.logDebug('onMediaModTerminations:conference');
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
        logger.logDebug('onMediaModTerminations:call');
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
          'participant-removed' !== event &&
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
      var pcOptions;

      function onPeerConnectionSuccess(description) {

        var connectOptions = {
          sessionId: sessionInfo.sessionId,
          token: sessionInfo.token,
          description: description,
          sessionInfo: sessionInfo,
          onSuccess: function (responsedata) {
            if (ATT.CallTypes.INCOMING === type) {
              setState('connecting');
            } else {
              setId(responsedata.id);
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
      }

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
            if (data.remoteSdp) {
              rtcManager.setRemoteDescription({
                remoteDescription: data.remoteSdp,
                type: 'answer'
              });
              that.setRemoteSdp(data.remoteSdp);
            }

            rtcManager.playStream('remote');
            return;
          }

          if ('conference' === breed) {
            if (undefined !== data.remoteSdp) {
              peerConnection.setRemoteDescription({
                sdp: data.remoteSdp,
                type: 'answer'
              });
            }
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
            onSuccess: onPeerConnectionSuccess,
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

          pcOptions.remoteSdp = remoteSdp;

          peerConnection = factories.createPeerConnection(pcOptions);
        }

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    function connect2() {
      var connectOptions,
        pcOptions = {
          mediaType: mediaType,
          stream: localStream,
          onSuccess: function (description) {

            connectOptions = {
              peer : peer,
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
            rtcManager.connectCall2(connectOptions);
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
      peerConnection = factories.createPeerConnection(pcOptions);
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
      };
    }

    function addParticipant(invitee) {

      logger.logInfo('Call.addParticipant: ', invitee);

      try {
        rtcManager.addParticipant({
          sessionInfo: sessionInfo,
          invitee: invitee,
          confId: id,
          onSuccess: function () {
            setInvitee(invitee, 'invited');
            emitter.publish('response-pending', createEventData());
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

    function removeParticipant (participant) {

      logger.logInfo('Call.removeParticipant: ', participant);

      try {
        rtcManager.removeParticipant({
          sessionInfo: sessionInfo,
          participant: participant,
          confId: id,
          onSuccess: function () {
            delete that.participants()[participant];
            emitter.publish('participant-removed', createEventData());
          },
          onError: function (err) {
            logger.logError(err);
            emitter.publish('error', err);
          }
        });
      } catch (err) {
        logger.logError(err);
        emitter.publish('error', err);
      }
    }

    function disconnect() {

      setState('disconnecting');

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
          onError: function (error) {
            logger.logError(error);

            emitter.publish('error', {
              error: error
            });
          }
        });
      } else if (null !== id && null !== remoteSdp) {
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

    function disconnectConference () {
      logger.logInfo('Disconnecting...');

      setState('disconnecting');

      rtcManager.disconnectCall({
        sessionId: sessionInfo.sessionId,
        token: sessionInfo.token,
        breed: 'conference',
        callId: id,
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
    this.type = function () {
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

      // TODO: Remove comment when every call has its own PeerConnection
      // Only calls of `breed` 'conference' have a private
      // peerconnection, but it's only created after you call conf.connect
      if (undefined === peerConnection) {
        return remoteSdp;
      }
      description = peerConnection.getRemoteDescription();
      return description.sdp;
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
    this.connect2 = connect2;
    this.disconnect = disconnect;
    this.disconnectConference = disconnectConference;
    this.addParticipant = addParticipant;
    this.removeParticipant = removeParticipant;
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
