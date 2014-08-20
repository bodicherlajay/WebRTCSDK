/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/

(function () {
  'use strict';

  var factories = ATT.private.factories,
    logManager = ATT.logManager.getInstance(),
    sdpFilter = ATT.sdpFilter.getInstance();

  /**
  * Call Prototype
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
      canceled = false,
      rejected = false,
      logger = logManager.addLoggerForModule('Call'),
      emitter = factories.createEventEmitter(),
      rtcManager = ATT.private.rtcManager.getRTCManager(),
      events = ATT.RTCCallEvents;

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

    function setParticipant(modId, status) {
      var key,
        username,
        participant,
        invites = that.invitations();

      for (key in invites) {
        username = invites[key];
        if (modId === username['id']) {
          participant = username['invitee'];
          participants[participant] = {
            participant: participant,
            status: status
          };
          emitter.publish('invite-accepted', createEventData());
        }
      }
    }

    function setInvitee (invitee, modId, status) {
      invitations[invitee] = {
        invitee: invitee,
        id: modId,
        status: status
      };
    }

    function updateInvitee(modId, status) {
      var key,
        username,
        invite,
        invites = that.invitations();

      for (key in invites) {
        username = invites[key];
        if (modId === username['id']) {
          invite = username['invitee'];
          invitations[invite]['status'] = status;
        }
      }
    }

    function extractUser(username) {
      username.toString();

      if (username.indexOf('tel') > -1) {
        return username.split('+')[1];
      } else if (username.indexOf('sip') > -1) {
        return username.split(':')[1].split('@')[0];
      }
      return username;
    }

    function onModReceived(data) {

      if ('conference' === breed
          || (2 === ATT.private.pcv && 'call' === breed)) {
        if (undefined !== data.remoteSdp) {
          peerConnection.acceptSdpOffer({
            remoteSdp: sdpFilter.setupActivePassive(data.remoteSdp),
            onSuccess: function (description) {
              logger.logInfo('acceptSdpOffer: success');
              rtcManager.acceptMediaModifications({
                sessionId: sessionInfo.sessionId,
                token: sessionInfo.token,
                callId: id,
                breed: breed,
                sdp: description.sdp,
                modId: '12345'
              });
            }
          });

          if (data.remoteSdp.indexOf('recvonly') !== -1) {
            rtcManager.disableMediaStream();
            that.setState('held');
          } else if ( 'held' === state
            && data.remoteSdp.indexOf('sendrecv') !== -1) {
            rtcManager.enableMediaStream();
            that.setState('resumed');
          }
        }
        return;
      }
      rtcManager.setMediaModifications(data);

      if (1 === ATT.private.pcv) {
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
      }

    }

    function onModTerminated(modifications) {

      logger.logDebug('onModTerminated');
      logger.logTrace(modifications);

      if ('conference' === breed || (2 === ATT.private.pcv && 'call' === breed)) {
        if (undefined !== modifications.remoteSdp) {
          peerConnection.setRemoteDescription({
            sdp: modifications.remoteSdp,
            type: 'offer'
          });
        }

        if (modifications.reason === 'success'
            && modifications.remoteSdp
            && modifications.remoteSdp.indexOf('sendonly') !== -1
            && modifications.remoteSdp.indexOf('sendrecv') === -1) {
          rtcManager.disableMediaStream();
          that.setState('held');
        }
        if ('held' === state
            && modifications.reason === 'success'
            && modifications.remoteSdp
            && modifications.remoteSdp.indexOf('sendrecv') !== -1) {
            rtcManager.enableMediaStream();
            that.setState('resumed');
        }

        if ('conference' === modifications.type
            && undefined !== modifications.modificationId) {
          logger.logDebug('onModTerminated:conference');
          if ('success' === modifications.reason) {
            setParticipant(modifications.modificationId, 'active');
          }
          if ('Call rejected' === modifications.reason) {
            updateInvitee(modifications.modificationId, 'rejected');
            emitter.publish('rejected', createEventData());
          }
        }

        if ('success' !== modifications.reason
            && 'Call rejected' !== modifications.reason) {
          emitter.publish('notification', ATT.utils.extend(createEventData(), {
            message: modifications.reason
          }));
        }

        return;
      }

      logger.logDebug('onModTerminated:call');
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

    function onSessionOpen(data) {

      that.setState('connected');

      if ('conference' === breed
          || (2 === ATT.private.pcv && 'call' === breed)) {
        if (undefined !== data.remoteSdp) {
          that.setRemoteSdp(data.remoteSdp);
          peerConnection.setRemoteDescription({
            sdp: data.remoteSdp,
            type: 'answer'
          });
        }
        return;
      }

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

    }

    function onSessionTerminated(data) {
      var eventData;

      if (undefined !== data) {
        if ('Call rejected' === data.reason || rejected) {
          setState('rejected');
        } else if ('Call canceled' === data.reason || canceled) {
          setState('canceled');
        } else if (undefined !== data.reason) {
          state = 'disconnected';
          eventData = createEventData();
          eventData.message = data.reason;
          emitter.publish('notification', eventData);
        } else {
          if ('created' === state) {
            setState('canceled');
          } else {
            setState('disconnected');
          }
        }
      } else {
        setState('disconnected');
      }

      rtcManager.off(events.SESSION_OPEN + ':' + id, onSessionOpen);
      rtcManager.off(events.SESSION_TERMINATED + ':' + id, onSessionTerminated);
      rtcManager.off(events.MODIFICATION_RECEIVED + ':' + id, onModReceived);
      rtcManager.off(events.MODIFICATION_TERMINATED + ':' + id, onModTerminated);

      if (2 === ATT.private.pcv) {
        if (undefined !== peerConnection) {
          peerConnection.close();
          peerConnection = undefined;
        }
        return;
      }

      // reset the old peerConnection
      rtcManager.resetPeerConnection();
    }

    function registerForRTCEvents() {
      rtcManager.on(events.SESSION_OPEN + ':' + id, onSessionOpen);
      rtcManager.on(events.SESSION_TERMINATED + ':' + id, onSessionTerminated);
      rtcManager.on(events.MODIFICATION_RECEIVED + ':' + id, onModReceived);
      rtcManager.on(events.MODIFICATION_TERMINATED + ':' + id, onModTerminated);
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
          'canceled' !== event &&
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
          'disconnected' !== event &&
          'notification' !== event) {
        throw new Error('Event ' + event + ' not defined');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }

    function off(event, handler) {
      emitter.unsubscribe(event, handler);
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
          breed : breed,
          onSuccess: function (responsedata) {
            if (ATT.CallTypes.INCOMING === type) {
              setState('connecting');
            } else {
              setId(responsedata.id);
              registerForRTCEvents();
            }
          },
          onError: function (error) {
            emitter.publish('error', {
              error: error
            });
          }
        };

        if (undefined !== id && null !== id) {
          connectOptions.callId = id;
        }

        if (breed === 'call') {
          connectOptions.peer = peer;
        }

        if (canceled) {
          canceled = false;

          onSessionTerminated({
            reason: 'Call canceled'
          });
          return;
        }

        rtcManager.connectConference(connectOptions);
      }

      try {
        //for usermedia not used in new peer connection flow
        if (undefined !== connectOpts) {
          if (undefined !== connectOpts.localMedia) {
            localMedia = connectOpts.localMedia;
          }

          if (undefined !== connectOpts.remoteMedia) {
            remoteMedia = connectOpts.remoteMedia;
          }
        }
        if (ATT.private.pcv === 1) {
          if (undefined !== remoteMedia) {
            remoteMedia.addEventListener('playing', function () {
              that.setState('media-established');
            });
          }
        }

        if (('call' === breed && 2 === ATT.private.pcv)
            || 'conference' === breed) {

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

          return;
        }

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

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    function addParticipant(invitee) {

      logger.logInfo('Call.addParticipant: ', invitee);

      try {
        rtcManager.addParticipant({
          sessionInfo: sessionInfo,
          invitee: invitee,
          confId: id,
          onSuccess: function (modId) {
            setInvitee(extractUser(invitee), modId, 'invited');
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

    function removeParticipant(participant) {

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

      if (null === this.remoteSdp()) {
        logger.logInfo('Canceling...');

        canceled = true;

        rtcManager.cancelCall({
          callId: id,
          sessionId: sessionInfo.sessionId,
          token: sessionInfo.token,
          onSuccess: function () {
            logger.logInfo('cancelCall: success');
          },
          onError: function (error) {
            logger.logError('cancelCall: error');
            logger.logTrace(error);

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

    function disconnectConference() {
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
      try {
        if (2 === ATT.private.pcv) {

          if (this.localStream) {
            var audioTracks, i, l;

            audioTracks = this.localStream().getAudioTracks();
            l = audioTracks.length;

            for (i = 0; i < l; i = i + 1) {
              audioTracks[i].enabled = false;
            }
            setState('muted');
          }
        } else {
          rtcManager.muteCall({
            onSuccess: function () {
              setState('muted');
            },
            onError: function (error) {
              emitter.publish('error', error);
            }
          });
        }
      } catch (error) {
        emitter.publish('error', {
          error: error
        });
      }
    }

    function unmute() {
      try {
        if (2 === ATT.private.pcv) {
          if (this.localStream) {

            var audioTracks, i, l;
            audioTracks = this.localStream().getAudioTracks();
            l = audioTracks.length;

            for (i = 0; i < l; i = i + 1) {
              audioTracks[i].enabled = true;
            }
            setState('unmuted');
          }
        } else {
          rtcManager.unmuteCall({
            onSuccess: function () {
              setState('unmuted');
            },
            onError: function (error) {
              emitter.publish('error', error);
            }
          });
        }
      } catch (error) {
        emitter.publish('error', {
          error: error
        });
      }
    }

    function hold(moveFlag) {
      var localSdp = that.localSdp(),
        holdSdp;

      if (2 === ATT.private.pcv) {
        holdSdp = sdpFilter.modifyForHoldCall(localSdp);

        rtcManager.holdCall({
          description : holdSdp,
          sessionId : sessionInfo.sessionId,
          token : sessionInfo.token,
          breed: breed,
          callId : id,
          move: moveFlag || undefined,
          onSuccess : function () {
            logger.logInfo('holdCall request: success');
          },
          onError : function (error) {
            logger.logError('holdCall request: error');
            logger.logError(error);
            emitter.publish('error', {
              error: error
            });
          }
        });
      } else {
        rtcManager.holdCall({
          onSuccess: function (sdp) {
            that.localSdp = sdp;
          },
          callId: id,
          onError: function (error) {
            emitter.publish('error', error);
          }
        });
      }
    }

    function resume() {
      var localSdp = that.localSdp(),
        resumeSdp;

      if (2 === ATT.private.pcv) {
        resumeSdp = sdpFilter.modifyForResumeCall(localSdp);

        rtcManager.resumeCall({
          description : resumeSdp,
          sessionId : sessionInfo.sessionId,
          token : sessionInfo.token,
          callId : id,
          breed: breed,
          onSuccess : function () {},
          onError : function (error) {
            emitter.publish('error', {
              error: error
            });
          }
        });
      } else {
        rtcManager.resumeCall({
          onSuccess: function (sdp) {
            that.localSdp = sdp;
          },
          callId: id,
          onError: function (error) {
            emitter.publish('error', error);
          }
        });
      }
    }

    function reject() {

      rejected = true;

      rtcManager.rejectCall({
        callId : id,
        sessionId : sessionInfo.sessionId,
        token : sessionInfo.token,
        breed: breed,
        onSuccess : function () {
          logger.logInfo('rejectCall: onSuccess');
        },
        onError : function (error) {
          logger.logError(error);

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

    // Call attributes
    breed = options.breed;

    if (undefined === options.id) {
      id = null;
    } else {
      id = options.id;
      registerForRTCEvents(); // register for events if the call id is available
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

      if ('call' === breed && 1 === ATT.private.pcv) {
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

      if (undefined === peerConnection) {
        return remoteSdp;
      }
      description = peerConnection.getRemoteDescription();
      return description ? description.sdp : null;
    };
    this.localStream = function () {
      return localStream;
    };
    this.canceled = function () {
      return canceled;
    };
    this.rejected = function () {
      return rejected;
    };

    this.setRemoteSdp  = setRemoteSdp;
    this.getState = getState;
    this.setState = setState;
    this.setId = setId;
    this.on = on;
    this.off = off;
    this.addStream = addStream;
    this.connect = connect;
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