/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RTCPeerConnection, RTCSessionDescription, Env, cmgmt */

/**
 * PeerConnection Service
 * Dependencies:  adapter.js, UserMediaService, SignalingService, sdpFilter
 */

(function (app) {
  'use strict';

  var module,
    logManager = ATT.logManager.getInstance(),
    logger = logManager.getLoggerByName('PeerConnectionService'),
    Error, //todo remove this reference
    onPeerConnectionError,
    SignalingService,
    SDPFilter;

  function setError(service) {
    Error = service;
  }

  function setSignalingService(service) {
    SignalingService = service;
  }

  function setSDPFilter(service) {
    SDPFilter = service;
  }

  function setLogger(service) {
    logger = service;
  }

  //Initialize dependency services
  function init() {
    try {
      setSignalingService(app.SignalingService);
      setSDPFilter(app.sdpFilter.getInstance());
      setError(app.Error);
    } catch (e) {
      console.log("Unable to initialize dependencies for PeerConnectionService module");
    }
  }

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

    localDescription: null,

    remoteDescription: null,

    sessionInfo: null,

    localStream: null,

    peerConnection: null,

    peer: null,

    callId: null,

    callType: null,

    mediaType: null,

    modificationId: null,

    modificationCount: 2,

    isModInitiator: false,

    callCanceled: false,
    // indicates the SDP offer has been canceled
    // before sending it.
    onOfferCanceled: null,

    onPeerConnectionInitiated: null,

    onRemoteStream: null,

    cancelSdpOffer: function (success) {
      this.onOfferCanceled = success;
      this.callCanceled = true;
    },

    configureICEServers: function (servers) {
      this.pcConfig.iceServers = servers;
    },

    getICEServers: function () {
      return this.pcConfig.iceServers;
    },

    initiatePeerConnection: function (config) {
      logger.logDebug('initPeerConnection');

      this.peer = config.peer;
      this.callId = config.callId;
      this.callType = config.type;
      this.mediaConstraints = config.mediaConstraints;
      this.localStream = config.localStream;
      this.onPeerConnectionInitiated = config.onPeerConnectionInitiated;
      onPeerConnectionError = config.onPeerConnectionError,
      this.onRemoteStream = config.onRemoteStream;
      this.sessionInfo = config.sessionInfo;

      logger.logTrace('media constraints', this.mediaConstraints);

      logger.logInfo('creating peer connection');
      // Create peer connection
      // send any ice candidates to the other peer
      this.createPeerConnection(this.callType);

      logger.logTrace('session state', this.callType);

      if (this.callType === ATT.CallTypes.OUTGOING) {
        logger.logInfo('creating offer for outgoing call');
        this.peerConnection.createOffer(this.setLocalAndSendMessage.bind(this), function () {
          onPeerConnectionError('Create offer failed');
        }, {'mandatory': {
          'OfferToReceiveAudio': this.mediaConstraints.audio,
          'OfferToReceiveVideo': this.mediaConstraints.video
        }});

      } else if (this.callType === ATT.CallTypes.INCOMING) {
        logger.logInfo('Responding to incoming call');

        if (undefined === config.remoteDescription) {
          throw new Error('Cannot set the remote description. The remote SDP is undefined');
        }

        //Check if invite is an announcement
        if (config.remoteDescription && config.remoteDescription.indexOf('sendonly') !== -1) {
          config.remoteDescription = config.remoteDescription.replace(/sendonly/g, 'sendrecv');
        }

        this.setTheRemoteDescription(config.remoteDescription, 'offer');
        this.createAnswer();
      }
    },

    /**
    * Create a Peer Connection
    * @param {String} callType 'Outgoing' or 'Incoming'
    */
    createPeerConnection: function (callType) {
      logger.logDebug('createPeerConnection');

      var self = this, pc;

      try {
        pc = new RTCPeerConnection(self.pcConfig);
        self.peerConnection = pc;
      } catch (e) {
        //todo get the sdk error
        onPeerConnectionError('Failed to create PeerConnection. Exception: ' + e.message);
      }

      // ICE candidate trickle
      pc.onicecandidate = function (evt) {
        logger.logDebug('pc.onicecandidate');
        if (evt.candidate) {
          logger.logDebug('ICE candidate', evt.candidate);
        } else {
          if (self.peerConnection !== null) {
            var sdp = pc.localDescription;
            logger.logTrace('callType', callType);
            // fix SDP
            try {
              SDPFilter.processChromeSDPOffer(sdp);
              logger.logInfo('processed Chrome offer SDP');
            } catch (e) {
              onPeerConnectionError('Could not process Chrome offer SDP. Exception: ' + e.message);
            }

            logger.logTrace('local description', sdp);
           // set local description
            try {
              //self.peerConnection.setLocalDescription(sdp);
              self.localDescription = sdp;
            } catch (e) {
              //todo get the sdk error
              onPeerConnectionError('Could not set local description. Exception: ' + e.message);
            }

            if (callType === ATT.CallTypes.OUTGOING) {
              if (self.callCanceled === true) {
                self.callCanceled = false;
                // if the on OfferCanceled callback is assigned, execute it
                if (typeof self.onOfferCanceled === 'function') {
                  self.onOfferCanceled();
                }
                return;
              }
              // send offer...
              logger.logInfo('sending offer');
              try {
                SignalingService.sendOffer({
                  calledParty: ATT.utils.createCalledPartyUri(self.peer),
                  sdp: self.localDescription,
                  sessionInfo: self.sessionInfo,
                  success: function (response) {
                    if (response && response.callId && response.xState && response.xState === 'invitation-sent') {
                      logger.logInfo('success for offer sent, outgoing call');
                      // keep copy of callId for future requests
                      self.callId = response.callId;
                      // trigger callback meaning successfully sent the offer
                      return self.onPeerConnectionInitiated({
                        state: response.xState,
                        callId: response.callId,
                        localSdp: self.localDescription
                      });
                    }
                    //todo get the sdk error and invoke
                    onPeerConnectionError('Failed to send offer');
                  },
                  error: function (error) {
                    onPeerConnectionError(error);
                  }
                });
              } catch (e) {
                //todo get the sdk error and invoke
                onPeerConnectionError('Could not send offer: ' + e);
              }

            } else if (callType === ATT.CallTypes.INCOMING) {
              // send answer...
              logger.logInfo('incoming call, sending answer');
              try {
                SignalingService.sendAnswer({
                  callId: self.callId,
                  sdp: self.localDescription,
                  sessionInfo: self.sessionInfo,
                  success: function (response) {
                    if (response && response.xState && response.xState === 'accepted') {
                      logger.logInfo('success for answer sent, incoming call');
                      // trigger callback meaning successfully sent the answer
                      return self.onPeerConnectionInitiated({
                        state: response.xState,
                        localSdp: self.localDescription
                      });
                    }
                    //get the sdk error
                    onPeerConnectionError('Failed to send answer');
                  },
                  error: function (error) {
                    onPeerConnectionError(error);
                  }
                });
              } catch (e) {
                //todo get the sdk error
                onPeerConnectionError('incoming call, could not send answer. Exception: ' + e.message);
              }
            }
          } else {
            //todo get the sdk error
            onPeerConnectionError('peerConnection is null!');
          }
        }
      };

      //add the local stream to peer connection
      logger.logInfo('Adding local stream to peer connection');
      try {
        pc.addStream(this.localStream);
      } catch (e) {sendAcreat
        //todo get the sdk error
        onPeerConnectionError('Failed to add local stream. Exception: ' + e.message);
      }

      // add remote stream
      //self.onRemoteStreamAdded.bind(this);
      pc.onaddstream = self.onRemoteStreamAdded;
    },

    /**
    * Handler for remote stream addition
    * @param {Obj} evt The event obj
    *
    */
    onRemoteStreamAdded: function (evt) {
      logger.logDebug('onRemoteStreamAdded');

      logger.logTrace('Adding Remote Stream...', evt.remoteStream);

      ATT.PeerConnectionService.onRemoteStream(evt.stream);
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
            //todo get the sdk error
            onPeerConnectionError('Create answer failed.');
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
        //todo get the sdk error
        onPeerConnectionError('Create answer failed');
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
          // Need to figure out why Chrome throws this event though it works
          //todo get the sdk error
          //onPeerConnectionError('Set Remote Description Fail: ' + err);
        });
      } catch (err) {
        // Need to figure out why Chrome throws this event though it works
        //todo get the sdk error
        //onPeerConnectionError('Set Remote Description Fail: ' + err);
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
      this.isModInitiator = false;
      this.createAnswer();
    },

    /**
    *
    * Set Local And Send Message
    * @param {Object} description SDP
    */
    setLocalAndSendMessage : function (description) {
        var filter = ATT.sdpFilter.getInstance();

      logger.logDebug('setLocalAndSendMessage');
      // fix SDP
      logger.logTrace('Fixing SDP for Chrome', description);
      //SDPFilter.processChromeSDPOffer(description);

      //Remove the 'crypto' attribute because Chrome is going to remove support for SDES, and only implement DTLS-SRTP
      //We have to ensure that no 'crypto' attribute exists while DTLS is enabled.
      while (description.sdp.indexOf('crypto:') != -1) {
          description.sdp = filter.removeSDPAttribute(sdp.sdp.match(/crypto.+/)[0], description.sdp);
      }

      this.localDescription = description;

      // set local description
      try {
        this.peerConnection.setLocalDescription(this.localDescription);
      } catch (e) {
        onPeerConnectionError('Could not set local description. Exception: ' + e.message);
      }

      // send accept modifications...
      if (this.modificationId) {
        logger.logInfo('Accepting modification', this.modificationId);
        try {
          SignalingService.sendAcceptMods({
            callId: this.callId,
            sdp: this.localDescription,
            modId: this.modificationId,
            sessionInfo: this.sessionInfo
          });
        } catch (e) {
          onPeerConnectionError('Accepting modification failed. Exception: ' + e.message);
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
    * Reset modification Id
    *
    */
    resetModId: function () {
      this.modificationId = null;
    },

   /**
    *
    * Hold Call
    *
    */
    holdCall: function (options) {
      logger.logDebug('holdCall');

      var sdp = this.peerConnection.localDescription;

      logger.logTrace('holding call', sdp);

      // adjust SDP for hold request
      sdp.sdp = sdp.sdp.replace(/a=sendrecv/g, 'a=recvonly');
      //sdp.sdp = sdp.sdp.replace(/a=setup:active/g, 'a=setup:actpass');
      sdp.type = 'offer';
      SDPFilter.processChromeSDPOffer(sdp);
      this.incrementModCount();

      try {
        SDPFilter.incrementSDP(sdp, this.modificationCount);
      } catch (e) {
        onPeerConnectionError('Could not increment SDP. Exception: ' + e.message);
      }

      try {
        // set local description
        this.peerConnection.setLocalDescription(sdp);
        this.localDescription = sdp;
      } catch (e) {
        onPeerConnectionError('Could not set local description. Exception: ' + e.message);
      }

      try {
        // send hold signal...
        logger.logTrace('sending modified sdp', sdp);
        SignalingService.sendHoldCall({
          sdp : sdp,
          sessionInfo: this.sessionInfo,
          callId: options.callId,
          success: function () {
            options.onHoldSuccess(sdp);
          }
        });
      } catch (e) {
        onPeerConnectionError('Send hold signal fail: ' + e.message);
      }

      this.isModInitiator = true;
    },

    /**
    *
    * Resume Call
    */
    resumeCall: function (options) {
      logger.logDebug('resumeCall');

      var sdp = this.localDescription;

      logger.logTrace('resuming call', sdp);

      // adjust SDP for resume request
      sdp.sdp = sdp.sdp.replace(/a=recvonly/g, 'a=sendrecv');
      sdp.type = 'offer';
      SDPFilter.processChromeSDPOffer(sdp);
      this.incrementModCount();

      try {
        SDPFilter.incrementSDP(sdp, this.modificationCount);
      } catch (e) {
        onPeerConnectionError('Could not increment SDP. Exception: ' + e.message);
      }

      try {
        // set local description
        this.peerConnection.setLocalDescription(sdp);
        this.localDescription = sdp;
      } catch (e) {
        onPeerConnectionError('Could not set local description. Exception: ' + e.message);
      }

      try {
        // send resume signal...
        logger.logTrace('sending modified sdp', sdp);
        SignalingService.sendResumeCall({
          sdp : sdp,
          sessionInfo: this.sessionInfo,
          callId: options.callId,
          success: function () {
            options.onResumeSuccess(sdp);
          }
        });
      } catch (e) {
        onPeerConnectionError('Send resume call Fail: ' + e.message);
      }

      this.isModInitiator = true;
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
      this.resetModId();
      this.peer = null;
      this.callId = null;
      this.callType = null;
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

  //Expose the dependencies
  module.setError = setError;
  module.setSignalingService = setSignalingService;
  module.setSDPFilter = setSDPFilter;
  module.setLogger = setLogger;

  //Name of the module
  app.PeerConnectionService = module;

  init();

}(ATT));
