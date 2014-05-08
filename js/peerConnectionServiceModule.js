/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RTCPeerConnection, RTCSessionDescription, getUserMedia, Env, cmgmt */

/**
 * PeerConnection Service
 * Dependencies:  adapter.js
 */

(function (app, UserMediaService, SignalingService) {
  'use strict';

  var module, logMgr = ATT.logManager.getInstance(), logger = null;
  logMgr.configureLogger('PeerConnectionService', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);
  logger = logMgr.getLogger('PeerConnectionService');

  module = {

    mediaConstraints: {},

    pcConstraints: {
      'optional': [
        {'DtlsSrtpKeyAgreement': 'false'}
      ]
    },

    pcConfig: {
      'iceServers': [
        { 'url': 'STUN:74.125.133.127:19302' }
      ]
    },

    localDescription: {},

    remoteDescription: {},

    localStream: null,

    remoteStream: null,

    peerConnection: null,

    callingParty: null,

    calledParty: null,

    modificationId: null,

    modificationCount: 2,

    configureICEServers: function (servers) {
      this.pcConfig.iceServers = servers;
    },
    getICEServers: function () {
      return this.pcConfig.iceServers;
    },
    /**
    * Create a Peer Connection
    * @param {String} callState 'Outgoing' or 'Incoming'
    */
    createPeerConnection: function (callState) {
      var  self = this,
        rm = cmgmt.CallManager.getInstance(),
        session = rm.getSessionContext(),
        pc;

      try {
        pc = new RTCPeerConnection(self.pcConfig);
        self.peerConnection = pc;
      } catch (e) {
        logger.logError('Failed to create PeerConnection. Exception: ', e.message);
      }

      // ICE candidate trickle
      pc.onicecandidate = function (evt) {
        if (evt.candidate) {
          logger.logTrace('ICE candidate', evt.candidate);
        } else {
          if (self.peerConnection !== null) {
            var sdp = pc.localDescription;
            logger.logTrace('callState', callState);
            // fix SDP
            try {
              ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
              logger.logTrace('processed Chrome offer SDP');
            } catch (e) {
              logger.logWarning('Could not process Chrome offer SDP. Exception: ', e.message);
            }

            logger.logTrace('local description', sdp);
           // set local description
            try {
              self.peerConnection.setLocalDescription(sdp);
              self.localDescription = sdp;
            } catch (e) {
              logger.logError('Could not set local description. Exception:', e.message);
            }

            if (callState === rm.SessionState.OUTGOING_CALL) {
              // send offer...
              logger.logTrace('sending offer');
              try {
                SignalingService.sendOffer({
                  calledParty : self.calledParty,
                  sdp : self.localDescription,
                  success : function (headers) {
                    logger.logTrace('success for offer sent, outgoing call');

                    if (headers.xState === app.RTCCallEvents.INVITATION_SENT) {
                      // publish the UI callback for invitation sent event
                      logger.logTrace('invitation sent');
                      app.event.publish(session.getSessionId() + '.responseEvent', {
                        state : app.RTCCallEvents.INVITATION_SENT
                      });
                    }
                  }
                });
              } catch (e) {
                logger.logError('Could not send offer');
              }

            } else if (callState === rm.SessionState.INCOMING_CALL) {
              // send answer...
              logger.logTrace('incoming call, sending answer');
              try {
                SignalingService.sendAnswer({
                  sdp : self.localDescription
                });
              } catch (e) {
                logger.logWarning('incoming call, could not send answer. Exception: ', e.message);
              }
            }
          } else {
            logger.logError('peerConnection is null!');
          }
        }
      };

      //add the local stream to peer connection
      logger.logTrace('Adding local stream to peer connection');
      try {
        pc.addStream(this.localStream);
      } catch (e) {
        logger.logError('Failed to add local stream. Exception: ', e.message);
      }

      // add remote stream
      pc.onaddstream =  function (evt) {
        self.remoteStream = evt.stream;
        UserMediaService.showStream('remote', evt.stream);
        logger.logTrace('Adding Remote Stream...', evt.stream);
      };
    },

    /**
     * Start Call.
     * @param {Object} config The UI config object
     * 
     */
    start: function (config) {
      this.callingParty = config.from;
      this.calledParty = config.to;
      this.mediaConstraints = config.mediaConstraints;
      logger.logTrace('starting call');
      logger.logTrace('calling party', config.from);
      logger.logTrace('called party', config.to);
      logger.logTrace('media constraints', config.mediaConstraints);

      // send any ice candidates to the other peer
      // get a local stream, show it in a self-view and add it to be sent
      getUserMedia(config.mediaConstraints, this.getUserMediaSuccess.bind(this), function () {
        logger.logError('Get User Media Fail');
      });
    },

    /**
    * getUserMediaSuccess
    * @param {Object} stream The media stream
    */
    getUserMediaSuccess: function (stream) {
      logger.logTrace('getUserMedia success');
      // set local stream
      this.localStream = stream;

      var self = this,
        rm = cmgmt.CallManager.getInstance(),
        session = rm.getSessionContext(),
        event = session.getEventObject(),
        callState = session.getCallState();

      logger.logTrace('creating peer connection');
      self.createPeerConnection(callState);
      logger.logTrace('session state', callState);

      if (callState === rm.SessionState.OUTGOING_CALL) {
        // call the user media service to show stream
        UserMediaService.showStream('local', this.localStream);

        logger.logTrace('creating offer for outgoing call');
        this.peerConnection.createOffer(this.setLocalAndSendMessage.bind(this), function () {
          logger.logTrace('Create offer failed');
        }, {'mandatory': {
          'OfferToReceiveAudio': this.mediaConstraints.audio,
          'OfferToReceiveVideo': this.mediaConstraints.video
        }});

      } else if (callState === rm.SessionState.INCOMING_CALL) {
        logger.logTrace('Responding to incoming call');
        // call the user media service to show stream
        UserMediaService.showStream('local', this.localStream);

        this.setTheRemoteDescription(event.sdp, 'offer');
        this.createAnswer();
      }
    },

    /**
    *
    * Create Answer
    */
    createAnswer: function () {
      logger.logTrace('Creating answer');
      try {
        if (this.userAgent().indexOf('Chrome') < 0) {
          this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this), function () {
            logger.logWarning('Create answer failed.');
          }, {
            'mandatory' : {
              'OfferToReceiveAudio': this.mediaConstraints.audio,
              'OfferToReceiveVideo': this.mediaConstraints.video
            }
          });
        } else {
          logger.logTrace('Creating answer.');
          this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this));
        }
      } catch (e) {
        logger.logWarning('Create answer failed');
      }
    },

    /**
    *
    * Set Remote Description
    * @param {Object} sdp description
    * @param {String} type 'answer' or 'offer'
    */
    setTheRemoteDescription: function (description, type) {
      logger.logTrace('Setting remote description...');
      this.remoteDescription = {
        'sdp' : description,
        'type' : type
      };
      try {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.remoteDescription), function () {
          logger.logTrace('Set Remote Description Success');
        }, function (err) {
          // difference between FF and Chrome
          if (typeof err === 'object') {
            err = err.message;
          }
          logger.logWarning('Set Remote Description Fail', err);
        });
      } catch (err) {
        logger.logError('Set Remote Description Fail', err.message);
      }
    },

    /**
    *
    * Set Remote Description and Create Answer
    * @param {Object} sdp description
    * @param {String} modId modification id
    */
    setRemoteAndCreateAnswer: function (sdp, modId) {
      logger.logTrace('Creating answer.');
      logger.logDebug('modId', modId);
      this.modificationId = modId;
      this.incrementModCount();
      this.setTheRemoteDescription(sdp, 'offer');
      this.createAnswer();
    },

    /**
    *
    * Set Local And Send Message
    * @param {Object} description SDP
    */
    setLocalAndSendMessage : function (description) {
      // fix SDP
      logger.logTrace('Fixing SDP for Chrome', description);
      ATT.sdpFilter.getInstance().processChromeSDPOffer(description);

      this.localDescription = description;

      // set local description
      try {
        this.peerConnection.setLocalDescription(this.localDescription);
      } catch (e) {
        logger.logError('Could not set local description. Exception: ', e.message);
      }

      // send accept modifications...
      if (this.modificationId) {
        logger.logTrace('Accepting modification', this.modificationId);
        try {
          SignalingService.sendAcceptMods({
            sdp : this.localDescription,
            modId: this.modificationId
          });
        } catch (e) {
          logger.logError('Accepting modification failed. Exception: ', e.message);
        }
      }
    },

    /**
    * Set modification Id
    * @param {String} modId The modification Id
    */
    setModificationId: function (modId) {
      this.modificationId = modId;
    },

    /**
    * Increment modification count
    *
    */
    incrementModCount: function () {
      this.modificationCount = this.modificationCount + 1;
    },

    /**
    * Reset modification count
    *
    */
    resetModCount: function () {
      this.modificationCount = 2;
    },

   /**
    *
    * Hold Call
    *
    */
    holdCall: function () {
      var sdp = this.localDescription;

      logger.logTrace('holding call', sdp);

      // adjust SDP for hold request
      sdp.sdp = sdp.sdp.replace(/a=sendrecv/g, 'a=recvonly');
      ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
      this.incrementModCount();

      try {
        ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);
      } catch (e) {
        logger.logError('Could not increment SDP. Exception: ', e.message);
      }

      try {
        // set local description
        this.peerConnection.setLocalDescription(sdp);
      } catch (e) {
        logger.logError('Could not set local description. Exception: ', e.message);
      }

      try {
        // send hold signal...
        logger.logTrace('sending modified sdp', sdp);
        SignalingService.sendHoldCall({
          sdp : sdp.sdp
        });
      } catch (e) {
        logger.logError('Send hold signal fail', e.message);
      }
    },

    /**
    *
    * Resume Call
    */
    resumeCall: function () {

      var sdp = this.localDescription;

      logger.logTrace('resuming call', sdp);

      // adjust SDP for resume request
      sdp.sdp = sdp.sdp.replace(/a=recvonly/g, 'a=sendrecv');
      ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
      this.incrementModCount();

      try {
        ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);
      } catch (e) {
        logger.logError('Could not increment SDP. Exception: ', e.message);
      }

      try {
        // set local description
        this.peerConnection.setLocalDescription(sdp);
      } catch (e) {
        logger.logError('Could not set local description. Exception: ', e.message);
      }

      try {
        // send resume signal...
        logger.logTrace('sending modified sdp', sdp);
        SignalingService.sendResumeCall({
          sdp : sdp.sdp
        });
      } catch (e) {
        logger.logError('Send resume call Fail', e.message);
      }
    },

    /**
    *
    * End Call
    */
    endCall: function () {
      logger.logTrace('Ending call.');
      if (this.peerConnection) {
        this.peerConnection.close();
      }
      this.peerConnection = null;
      this.resetModCount();
      try {
        UserMediaService.stopStream();
      } catch (e) {
        logger.logError('Could not stop stream', e.message);
      }
    },

    /**
    *
    * User Agent
    * @return {String} user-Agent string
    */
    userAgent: function () {
      return navigator.userAgent;
    }
  };

  module.createSession = function () {
    module.start();
  };

  //Name of the module
  app.PeerConnectionService = module;

}(ATT || {}, ATT.UserMediaService || {}, ATT.SignalingService || {}));