/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RTCPeerConnection, RTCSessionDescription, getUserMedia, Env, cmgmt */

/**
 * PeerConnection Service
 * Dependencies:  adapter.js, UserMediaService, SignalingService, Env.resourceManager, sdpFilter, cmgmt.CallManager
 */

(function (app, UserMediaService, SignalingService) {
  'use strict';

  var module,
    logger = Env.resourceManager.getInstance().getLogger("PeerConnectionService");

  module = {

    mediaConstraints: {},

    pcConstraints: {
      'optional': [
        {'DtlsSrtpKeyAgreement': 'false'}
      ]
    },

    pcConfig: {
      //todo fix me - the address needs to be configurable
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

    callManager: window.cmgmt.CallManager.getInstance(),

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
      logger.logDebug('createPeerConnection');

      var self = this,
        rm = cmgmt.CallManager.getInstance(),
        session = rm.getSessionContext(),
        pc;

      try {
        pc = new RTCPeerConnection(self.pcConfig);
        self.peerConnection = pc;
      } catch (e) {
        ATT.Error.publish('Failed to create PeerConnection. Exception: ' + e.message);
      }

      // ICE candidate trickle
      pc.onicecandidate = function (evt) {
        logger.logDebug('pc.onicecandidate');
        if (evt.candidate) {
          logger.logTrace('ICE candidate', evt.candidate);
        } else {
          if (self.peerConnection !== null) {
            var sdp = pc.localDescription;
            logger.logTrace('callState', callState);
            // fix SDP
            try {
              ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
              logger.logInfo('processed Chrome offer SDP');
            } catch (e) {
              ATT.Error.publish('Could not process Chrome offer SDP. Exception: ' + e.message);
            }

            logger.logTrace('local description', sdp);
           // set local description
            try {
              self.peerConnection.setLocalDescription(sdp);
              self.localDescription = sdp;
            } catch (e) {
              ATT.Error.publish('Could not set local description. Exception: ' + e.message);
            }

            if (callState === rm.SessionState.OUTGOING_CALL) {
              // send offer...
              logger.logInfo('sending offer');
              try {
                SignalingService.sendOffer({
                  calledParty: self.calledParty,
                  sdp: self.localDescription,
                  success: function () {
                    logger.logInfo('success for offer sent, outgoing call');
                  },
                  error: function (error) {
                    ATT.Error.publish(error);
                  }
                });
              } catch (e) {
                ATT.Error.publish('Could not send offer: ' + e);
              }

            } else if (callState === rm.SessionState.INCOMING_CALL) {
              // send answer...
              logger.logInfo('incoming call, sending answer');
              try {
                SignalingService.sendAnswer({
                  sdp : self.localDescription
                });
              } catch (e) {
                ATT.Error.publish('incoming call, could not send answer. Exception: ' + e.message);
              }
            }
          } else {
            ATT.Error.publish('peerConnection is null!');
          }
        }
      };

      //add the local stream to peer connection
      logger.logInfo('Adding local stream to peer connection');
      try {
        pc.addStream(this.localStream);
      } catch (e) {
        ATT.Error.publish('Failed to add local stream. Exception: ' + e.message);
      }

      // add remote stream
      pc.onaddstream = self.onRemoteStreamAdded;
    },

    /**
    * Handler for remote stream addition
    * @param {Obj} evt The event obj
    *
    */
    onRemoteStreamAdded: function (evt) {
      logger.logDebug('onRemoteStreamAdded');

      var self = ATT.PeerConnectionService;

      self.remoteStream = evt.stream;

      logger.logTrace('Adding Remote Stream...', self.remoteStream);
      UserMediaService.showStream('remote', self.remoteStream);
    },

    /**
     * Start Call.
     * @param {Object} config The UI config object
     * 
     */
    start: function (config) {
      logger.logDebug('peerConnectionService:start');

      this.callingParty = config.from;
      this.calledParty = config.to;
      this.mediaConstraints = config.mediaConstraints;

      logger.logTrace('calling party', config.from);
      logger.logTrace('called party', config.to);
      logger.logTrace('media constraints', config.mediaConstraints);

      // send any ice candidates to the other peer
      // get a local stream, show it in a self-view and add it to be sent
      getUserMedia(config.mediaConstraints, this.getUserMediaSuccess.bind(this), function () {
        ATT.Error.publish('Get user media failed');
      });
    },

    /**
    * getUserMediaSuccess
    * @param {Object} stream The media stream
    */
    getUserMediaSuccess: function (stream) {
      logger.logDebug('getUserMediaSuccess');

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

      logger.logTrace('session state', callState);

      if (callState === rm.SessionState.OUTGOING_CALL) {
        // call the user media service to show stream
        UserMediaService.showStream('local', this.localStream);

        logger.logInfo('creating offer for outgoing call');
        this.peerConnection.createOffer(this.setLocalAndSendMessage.bind(this), function () {
          ATT.Error.publish('Create offer failed');
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
      logger.logDebug('createAnswer');
      try {
        if (this.userAgent().indexOf('Chrome') < 0) {
          this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this), function () {
            ATT.Error.publish('Create answer failed.');
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
        ATT.Error.publish('Create answer failed');
      }
    },

    /**
    *
    * Set Remote Description
    * @param {Object} sdp description
    * @param {String} type 'answer' or 'offer'
    */
    setTheRemoteDescription: function (description, type) {
      logger.logDebug('setTheRemoteDescription');
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
          ATT.Error.publish('Set Remote Description Fail: ' + err);
        });
      } catch (err) {
        ATT.Error.publish('Set Remote Description Fail: ' + err.message);
      }
    },

    /**
    *
    * Set Remote Description and Create Answer
    * @param {Object} sdp description
    * @param {String} modId modification id
    */
    setRemoteAndCreateAnswer: function (sdp, modId) {
      logger.logDebug('Creating answer.');
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
      logger.logDebug('setLocalAndSendMessage');
      // fix SDP
      logger.logTrace('Fixing SDP for Chrome', description);
      ATT.sdpFilter.getInstance().processChromeSDPOffer(description);

      this.localDescription = description;

      // set local description
      try {
        this.peerConnection.setLocalDescription(this.localDescription);
      } catch (e) {
        ATT.Error.publish('Could not set local description. Exception: ' + e.message);
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
          ATT.Error.publish('Accepting modification failed. Exception: ' + e.message);
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
      logger.logDebug('holdCall');

      var sdp = this.localDescription;

      logger.logTrace('holding call', sdp);

      // adjust SDP for hold request
      sdp.sdp = sdp.sdp.replace(/a=sendrecv/g, 'a=recvonly');
      ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
      this.incrementModCount();

      try {
        ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);
      } catch (e) {
        ATT.Error.publish('Could not increment SDP. Exception: ' + e.message);
      }

      try {
        // set local description
        this.peerConnection.setLocalDescription(sdp);
      } catch (e) {
        ATT.Error.publish('Could not set local description. Exception: ' + e.message);
      }

      try {
        // send hold signal...
        logger.logTrace('sending modified sdp', sdp);
        SignalingService.sendHoldCall({
          sdp : sdp.sdp
        });
      } catch (e) {
        ATT.Error.publish('Send hold signal fail: ' + e.message);
      }
    },

    /**
    *
    * Resume Call
    */
    resumeCall: function () {
      logger.logDebug('resumeCall');

      var sdp = this.localDescription;

      logger.logTrace('resuming call', sdp);

      // adjust SDP for resume request
      sdp.sdp = sdp.sdp.replace(/a=recvonly/g, 'a=sendrecv');
      ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
      this.incrementModCount();

      try {
        ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);
      } catch (e) {
        ATT.Error.publish('Could not increment SDP. Exception: ' + e.message);
      }

      try {
        // set local description
        this.peerConnection.setLocalDescription(sdp);
      } catch (e) {
        ATT.Error.publish('Could not set local description. Exception: ' + e.message);
      }

      try {
        // send resume signal...
        logger.logTrace('sending modified sdp', sdp);
        SignalingService.sendResumeCall({
          sdp : sdp.sdp
        });
      } catch (e) {
        ATT.Error.publish('Send resume call Fail: ' + e.message);
      }
    },

    /**
    *
    * End Call
    */
    endCall: function () {
      logger.logDebug('endCall');

      if (this.peerConnection) {
        this.peerConnection.close();
      }
      this.peerConnection = null;
      this.resetModCount();
      try {
        UserMediaService.stopStream();
      } catch (e) {
        ATT.Error.publish('Could not stop stream: ' + e.message);
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