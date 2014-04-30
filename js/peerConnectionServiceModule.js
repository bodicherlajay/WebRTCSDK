/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RTCPeerConnection, RTCSessionDescription, getUserMedia, Env, cmgmt */

/**
 * PeerConnection Service
 * Dependencies:  adapter.js
 */

var logMgr = ATT.logManager.getInstance(), logger;
logMgr.configureLogger('peerConnectionServiceModule', logMgr.loggerType.CONSOLE, logMgr.logLevel.DEBUG);
logger = logMgr.getLogger('peerConnectionServiceModule');

(function (app, UserMediaService, SignalingService) {
  'use strict';

  var module = {

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

    /**
    *
    * Create a Peer Connection
    */
    createPeerConnection: function () {
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
            // get the call state from the session
            var callState = session.getCallState(),
              sdp = pc.localDescription;
            logger.logTrace('callState', callState);
            // fix SDP
            ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
            logger.logTrace('processed Chrome offer SDP');
            // set local description
            self.peerConnection.setLocalDescription(sdp);
            self.localDescription = sdp;

            logger.logTrace('local description', sdp);
            if (callState === rm.SessionState.OUTGOING_CALL) {
              // send offer...
              logger.logTrace('sending offer');
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
            } else if (callState === rm.SessionState.INCOMING_CALL) {
              // send answer...
              logger.logTrace('incoming call, sending answer');
              SignalingService.sendAnswer({
                sdp : self.localDescription
              });
            }
          } else {
            logger.logError('peerConnection is null!');
          }
        }
      };

      //add the local stream to peer connection
      logger.logTrace('Adding local stream to peer connection');
      pc.addStream(this.localStream);

      // add remote stream
      pc.addEventListener('addstream', function (evt) {
        this.remoteStream = evt.stream;
        UserMediaService.showStream('remote', evt.stream);
        logger.logTrace('Adding Remote Stream...', evt.stream);
      }, false);
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
      self.createPeerConnection();
      logger.logTrace('session state', callState);

      if (callState === rm.SessionState.OUTGOING_CALL) {
        // call the user media service to show stream
        UserMediaService.showStream('local', this.localStream);

        //todo: switch constraints to dynamic
        logger.logTrace('creating offer for outgoing call -- audio video hard-coded to true still');
        this.peerConnection.createOffer(this.setLocalAndSendMessage.bind(this), function () {
          logger.logTrace('Create offer failed');
        }, {'mandatory': {
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true
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
      if (this.userAgent().indexOf('Chrome') < 0) {
        this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this), function () {
          logger.logWarning('Create answer failed.');
        }, {
          'mandatory' : { //todo: switch constraints to dynamic
            'OfferToReceiveAudio' : true,
            'OfferToReceiveVideo' : true
          }
        });
      } else {
        logger.logTrace('Creating answer.');
        this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this));
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
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.remoteDescription), function () {
        logger.logTrace('Set Remote Description Success');
      }, function (err) {
        // hack for difference between FF and Chrome
        if (typeof err === 'object') {
          err = err.message;
        }
        logger.logWarning('Set Remote Description Fail', err);
      });
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
    * Set Local And Send Message
    * @param {Object} description SDP
    */
    setLocalAndSendMessage : function (description) {
      // fix SDP
      logger.logTrace('Fixing SDP for Chrome', description);
      ATT.sdpFilter.getInstance().processChromeSDPOffer(description);

      this.localDescription = description;

      // set local description
      this.peerConnection.setLocalDescription(this.localDescription);

      // send accept modifications...
      if (this.modificationId) {
        logger.logTrace('Accepting modification', this.modificationId);
        SignalingService.sendAcceptMods({
          sdp : this.localDescription,
          modId: this.modificationId
        });
      }
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

      this.modificationCount = this.modificationCount + 1;

      ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);

      logger.logTrace('sending modified sdp', sdp);
      // set local description
      this.peerConnection.setLocalDescription(sdp);

      // send hold signal...
      SignalingService.sendHoldCall({
        sdp : sdp.sdp
      });
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

      this.modificationCount = this.modificationCount + 1;

      ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);

      // set local description
      this.peerConnection.setLocalDescription(sdp);

      logger.logTrace('sending modified sdp', sdp);
      // send resume signal...
      SignalingService.sendResumeCall({
        sdp : sdp.sdp
      });
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
      UserMediaService.stopStream();
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