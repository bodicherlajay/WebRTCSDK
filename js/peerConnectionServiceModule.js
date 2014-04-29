/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RTCPeerConnection, RTCSessionDescription, getUserMedia, Env, cmgmt */

/**
 * PeerConnection Service
 * Dependencies:  adapter.js
 */

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

      pc = new RTCPeerConnection(self.pcConfig);
      self.peerConnection = pc;

      // ICE candidate trickle
      pc.onicecandidate = function (evt) {
        if (evt.candidate) {
          ATT.logManager.logTrace('ICE candidate', evt.candidate);
          console.log('ICE candidate', evt.candidate);
        } else {
          if (self.peerConnection !== null) {
            // get the call state from the session
            var callState = session.getCallState(),
              sdp = pc.localDescription;
            ATT.logManager.logTrace('callState', callState);
            // fix SDP
            ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);
            // set local description
            self.peerConnection.setLocalDescription(sdp);
            self.localDescription = sdp;
            if (callState === rm.SessionState.OUTGOING_CALL) {
              // send offer...
              SignalingService.sendOffer({
                calledParty : self.calledParty,
                sdp : self.localDescription,
                success : function (headers) {
                  if (headers.xState === app.RTCCallEvents.INVITATION_SENT) {
                    // publish the UI callback for invitation sent event
                    app.event.publish(session.getSessionId() + '.responseEvent', {
                      state : app.RTCCallEvents.INVITATION_SENT
                    });
                  }
                }
              });
            } else if (callState === rm.SessionState.INCOMING_CALL) {
              // send answer...
              SignalingService.sendAnswer({
                sdp : self.localDescription
              });
            }
          }
        }
      };

      //add the local stream to peer connection
      pc.addStream(this.localStream);

      // add remote stream
      pc.addEventListener('addstream', function (evt) {
        this.remoteStream = evt.stream;
        UserMediaService.showStream('remote', evt.stream);
        console.log('Remote Stream', evt.stream);
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

      // send any ice candidates to the other peer
      // get a local stream, show it in a self-view and add it to be sent
      getUserMedia(config.mediaConstraints, this.getUserMediaSuccess.bind(this), function () {
        console.log('Get User Media Fail');
      });
    },

    /**
    * getUserMediaSuccess
    * @param {Object} stream The media stream
    */
    getUserMediaSuccess: function (stream) {
      // set local stream
      this.localStream = stream;

      var self = this,
        rm = cmgmt.CallManager.getInstance(),
        session = rm.getSessionContext(),
        event = session.getEventObject(),
        callState = session.getCallState();

      self.createPeerConnection();

      if (callState === rm.SessionState.OUTGOING_CALL) {

        // call the user media service to show stream
        UserMediaService.showStream('local', this.localStream);

        //todo: switch constraints to dynamic
        this.peerConnection.createOffer(this.setLocalAndSendMessage.bind(this), function () {
          console.log('Create offer failed');
        }, {'mandatory': {
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true
        }});

      } else if (callState === rm.SessionState.INCOMING_CALL) {

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
      if (this.userAgent().indexOf('Chrome') < 0) {
        this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this), function () {
          console.log('Create answer failed');
        }, {
          'mandatory' : { //todo: switch constraints to dynamic
            'OfferToReceiveAudio' : true,
            'OfferToReceiveVideo' : true
          }
        });
      } else {
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
      this.remoteDescription = {
        'sdp' : description,
        'type' : type
      };
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.remoteDescription), function () {
        console.log('Set Remote Description Success');
      }, function (err) {
        // hack for difference between FF and Chrome
        if (typeof err === 'object') {
          err = err.message;
        }
        console.log('Set Remote Description Fail', err);
      });
    },

    /**
    *
    * Set Remote Description and Create Answer
    * @param {Object} sdp description
    * @param {String} modId modification id
    */
    setRemoteAndCreateAnswer: function (sdp, modId) {
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
      ATT.sdpFilter.getInstance().processChromeSDPOffer(description);

      this.localDescription = description;

      // set local description
      this.peerConnection.setLocalDescription(this.localDescription);

      // send accept modifications...
      if (this.modificationId) {
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

      // adjust SDP for hold request
      sdp.sdp = sdp.sdp.replace(/a=sendrecv/g, 'a=recvonly');

      ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);

      this.modificationCount = this.modificationCount + 1;

      ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);

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

      // adjust SDP for resume request
      sdp.sdp = sdp.sdp.replace(/a=recvonly/g, 'a=sendrecv');

      ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);

      this.modificationCount = this.modificationCount + 1;

      ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);

      // set local description
      this.peerConnection.setLocalDescription(sdp);

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