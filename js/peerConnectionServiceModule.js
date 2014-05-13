/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RTCPeerConnection, RTCSessionDescription, getUserMedia, Env, cmgmt */

/**
 * PeerConnection Service
 * Dependencies:  adapter.js
 */

(function (app, UserMediaService, SignalingService) {
  'use strict';

  var module,
    logMgr = ATT.logManager.getInstance(),
    logger = null;

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
      logger.logTrace('createPeerConnection');

      var self = this,
        rm = cmgmt.CallManager.getInstance(),
        session = rm.getSessionContext(),
        pc;

      try {
        pc = new RTCPeerConnection(self.pcConfig);
        self.peerConnection = pc;
      } catch (e) {
        logger.logError('Failed to create PeerConnection. Exception: ' + e.message);
      }

      // ICE candidate trickle
      pc.onicecandidate = function (evt) {
        logger.logTrace('pc.onicecandidate');
        if (evt.candidate) {
          logger.logDebug('ICE candidate', evt.candidate);
        } else {
          if (self.peerConnection !== null) {
            var sdp = pc.localDescription;
            logger.logDebug('callState', callState);
            // fix SDP
            try {
              ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
              logger.logInfo('processed Chrome offer SDP');
            } catch (e) {
              logger.logError('Could not process Chrome offer SDP. Exception: ' + e.message);
            }

            logger.logDebug('local description', sdp);
           // set local description
            try {
              self.peerConnection.setLocalDescription(sdp);
              self.localDescription = sdp;
            } catch (e) {
              logger.logError('Could not set local description. Exception: ' + e.message);
            }

            if (callState === rm.SessionState.OUTGOING_CALL) {
              // send offer...
              logger.logInfo('sending offer');
              try {
                SignalingService.sendOffer({
                  calledParty: self.calledParty,
                  sdp: self.localDescription,
                  success: function (headers) {
                    logger.logInfo('success for offer sent, outgoing call');

                    if (headers.xState === app.RTCCallEvents.INVITATION_SENT) {
                      // publish the UI callback for invitation sent event
                      logger.logInfo('invitation sent');
                      app.event.publish(session.getSessionId() + '.responseEvent', {
                        state : app.RTCCallEvents.INVITATION_SENT
                      });
                    }
                  },
                  error: function (error) {
                    logger.logError('Error sending offer: ' + error);
                  }
                });
              } catch (e) {
                logger.logError('Could not send offer');
              }

            } else if (callState === rm.SessionState.INCOMING_CALL) {
              // send answer...
              logger.logInfo('incoming call, sending answer');
              try {
                SignalingService.sendAnswer({
                  sdp : self.localDescription
                });
              } catch (e) {
                logger.logError('incoming call, could not send answer. Exception: ' + e.message);
              }
            }
          } else {
            logger.logError('peerConnection is null!');
          }
        }
      };

      //add the local stream to peer connection
      logger.logInfo('Adding local stream to peer connection');
      try {
        pc.addStream(this.localStream);
      } catch (e) {
        logger.logError('Failed to add local stream. Exception: ' + e.message);
      }

      // add remote stream
      pc.onaddstream =  function (evt) {
        logger.logTrace('pc.onaddstream');

        self.remoteStream = evt.stream;

        logger.logDebug('Adding Remote Stream...', evt.stream);
        UserMediaService.showStream('remote', evt.stream);
      };
    },

    /**
     * Start Call.
     * @param {Object} config The UI config object
     * 
     */
    start: function (config) {
      logger.logTrace('peerConnectionService:start');

      this.callingParty = config.from;
      this.calledParty = config.to;
      this.mediaConstraints = config.mediaConstraints;

      logger.logDebug('calling party', config.from);
      logger.logDebug('called party', config.to);
      logger.logDebug('media constraints', config.mediaConstraints);

      // send any ice candidates to the other peer
      // get a local stream, show it in a self-view and add it to be sent
      getUserMedia(config.mediaConstraints, this.getUserMediaSuccess.bind(this), function () {
        ATT.rtc.error.publish('Get user media failed');
      });
    },

    /**
    * getUserMediaSuccess
    * @param {Object} stream The media stream
    */
    getUserMediaSuccess: function (stream) {
      logger.logTrace('getUserMediaSuccess');

      // set local stream
      this.localStream = stream;

      var self = this,
        rm = cmgmt.CallManager.getInstance(),
        session = rm.getSessionContext(),
        event = session.getEventObject(),
        callState = session.getCallState();

      logger.logInfo('creating peer connection');
      // Create peer connection
      self.createPeerConnection(callState);

      logger.logDebug('session state', callState);

      if (callState === rm.SessionState.OUTGOING_CALL) {
        // call the user media service to show stream
        UserMediaService.showStream('local', this.localStream);

        logger.logTrace('creating offer for outgoing call');
        this.peerConnection.createOffer(this.setLocalAndSendMessage.bind(this), function () {
          logger.logError('Create offer failed');
        }, {'mandatory': {
          'OfferToReceiveAudio': this.mediaConstraints.audio,
          'OfferToReceiveVideo': this.mediaConstraints.video
        }});

      } else if (callState === rm.SessionState.INCOMING_CALL) {
        logger.logInfo('Responding to incoming call');
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
      logger.logTrace('createAnswer');
      try {
        if (this.userAgent().indexOf('Chrome') < 0) {
          this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this), function () {
            logger.logError('Create answer failed.');
          }, {
            'mandatory' : {
              'OfferToReceiveAudio': this.mediaConstraints.audio,
              'OfferToReceiveVideo': this.mediaConstraints.video
            }
          });
        } else {
          this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this));
        }
      } catch (e) {
        logger.logError('Create answer failed');
      }
    },

    /**
    *
    * Set Remote Description
    * @param {Object} sdp description
    * @param {String} type 'answer' or 'offer'
    */
    setTheRemoteDescription: function (description, type) {
      logger.logTrace('setTheRemoteDescription');
      this.remoteDescription = {
        'sdp' : description,
        'type' : type
      };
      try {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.remoteDescription), function () {
          logger.logInfo('Set Remote Description Success');
        }, function (err) {
          // difference between FF and Chrome
          if (typeof err === 'object') {
            err = err.message;
          }
          logger.logError('Set Remote Description Fail: ' + err);
        });
      } catch (err) {
        logger.logError('Set Remote Description Fail: ' + err.message);
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
      logger.logTrace('setLocalAndSendMessage');
      // fix SDP
      logger.logDebug('Fixing SDP for Chrome', description);
      ATT.sdpFilter.getInstance().processChromeSDPOffer(description);

      this.localDescription = description;

      // set local description
      try {
        this.peerConnection.setLocalDescription(this.localDescription);
      } catch (e) {
        logger.logError('Could not set local description. Exception: ' + e.message);
      }

      // send accept modifications...
      if (this.modificationId) {
        logger.logInfo('Accepting modification', this.modificationId);
        try {
          SignalingService.sendAcceptMods({
            sdp : this.localDescription,
            modId: this.modificationId
          });
        } catch (e) {
          logger.logError('Accepting modification failed. Exception: ' + e.message);
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
      logger.logTrace('holdCall');

      var sdp = this.localDescription;

      logger.logDebug('holding call', sdp);

      // adjust SDP for hold request
      sdp.sdp = sdp.sdp.replace(/a=sendrecv/g, 'a=recvonly');
      ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
      this.incrementModCount();

      try {
        ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);
      } catch (e) {
        logger.logError('Could not increment SDP. Exception: ' + e.message);
      }

      try {
        // set local description
        this.peerConnection.setLocalDescription(sdp);
      } catch (e) {
        logger.logError('Could not set local description. Exception: ' + e.message);
      }

      try {
        // send hold signal...
        logger.logDebug('sending modified sdp', sdp);
        SignalingService.sendHoldCall({
          sdp : sdp.sdp
        });
      } catch (e) {
        logger.logError('Send hold signal fail: ' + e.message);
      }
    },

    /**
    *
    * Resume Call
    */
    resumeCall: function () {
      logger.logTrace('resumeCall');

      var sdp = this.localDescription;

      logger.logDebug('resuming call', sdp);

      // adjust SDP for resume request
      sdp.sdp = sdp.sdp.replace(/a=recvonly/g, 'a=sendrecv');
      ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
      this.incrementModCount();

      try {
        ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);
      } catch (e) {
        logger.logError('Could not increment SDP. Exception: ' + e.message);
      }

      try {
        // set local description
        this.peerConnection.setLocalDescription(sdp);
      } catch (e) {
        logger.logError('Could not set local description. Exception: ' + e.message);
      }

      try {
        // send resume signal...
        logger.logDebug('sending modified sdp', sdp);
        SignalingService.sendResumeCall({
          sdp : sdp.sdp
        });
      } catch (e) {
        logger.logError('Send resume call Fail: ' + e.message);
      }
    },

    /**
    *
    * End Call
    */
    endCall: function () {
      logger.logTrace('endCall');

      if (this.peerConnection) {
        this.peerConnection.close();
      }
      this.peerConnection = null;
      this.resetModCount();
      try {
        UserMediaService.stopStream();
      } catch (e) {
        logger.logError('Could not stop stream: ' + e.message);
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