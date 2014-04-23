/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RTCPeerConnection, RTCSessionDescription, getUserMedia, Env, cmgmt */

/**
 * PeerConnection Service
 * Dependencies:  adapter.js
 */

(function (app, UserMediaService, SignalingService) {
  "use strict";

  // STUN Server configuration
  var stun = { url: 'stun:stun.l.google.com:19302' },

    // TURN server configuration
    turn = { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' },

    module = {

      mediaConstraints: {},

      pcConstraints: {
        "optional": [
          {'DtlsSrtpKeyAgreement': 'false'}
        ]
      },

      // STUN Server configuration
      STUN: stun,

      // TURN server configuration
      TURN: turn,

      iceServers: { iceServers: [stun] },

      localDescription: {},

      remoteDescription: {},

      localStream: null,

      remoteStream: null,

      peerConnection: null,

      callingParty: null,

      calledParty: null,

      modificationId: null,

      modificationCount: 2,

      // create a peer connection
      createPeerConnection: function () {

        var  self = this,
          rm = cmgmt.CallManager.getInstance(),
          session = rm.getSessionContext(),
          pc,
          pc_config = {
            "iceServers": [
              { "url": "STUN:74.125.133.127:19302" }
            ]
          };
        self.peerConnection = new RTCPeerConnection(pc_config);
        pc = self.peerConnection;

        // ICE candidate trickle
        pc.onicecandidate = function (evt) {
          if (evt.candidate) {
            console.log('receiving ice candidate', evt.candidate);
          } else {
            // get the call state from the session
            var callState = session.getCallState();

            if (callState === rm.SessionState.OUTGOING_CALL) {
              self.localDescription = pc.localDescription;
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
              self.localDescription = pc.localDescription;
              SignalingService.sendAnswer({
                sdp : self.localDescription
              });
            }
          }
        };
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

        var self = this,
          rm = cmgmt.CallManager.getInstance(),
          session = rm.getSessionContext(),
          event = session.getEventObject(),
          callState = session.getCallState();

        self.createPeerConnection();

        if (callState === rm.SessionState.OUTGOING_CALL) {
          // set local stream
          this.localStream = stream;

          // call the user media service to show stream
          UserMediaService.showStream('local', this.localStream);

          //add the local stream to peer connection
          self.peerConnection.addStream(stream);

          //todo: switch constraints to dynamic
          this.peerConnection.createOffer(this.setLocalAndSendMessage.bind(this), function () {
            console.log('Create offer failed');
          }, {'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
          }});

        } else if (callState === rm.SessionState.INCOMING_CALL) {
          // set local stream
          this.localStream = stream;

          // call the user media service to show stream
          UserMediaService.showStream('local', this.localStream);
          
          this.remoteDescription = event.sdp;

          this.setTheRemoteDescription(this.remoteDescription, 'offer');

          if (this.userAgent().indexOf('Chrome') < 0) {
            this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this), function() {
              console.log('Create answer failed');
            }, {
              'mandatory' : {//todo: switch constaints to dynamic
                'OfferToReceiveAudio' : true,
                'OfferToReceiveVideo' : true
              }
            });
          } else {
            this.peerConnection.createAnswer(this.setLocalAndSendMessage.bind(this));
          }
        }
      },

      /**
      *
      * Set Remote Description
      * @param {Object} sdp description
      * @param {String} tipe 'answer' or 'offer'
      */
      setTheRemoteDescription: function (description, tipe) {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription({
          sdp : description,
          type : tipe
        }), function() {
          console.log('Set Remote Description Success');
        }, function(err) {
          // hack for difference between FF and Chrome
          if ( typeof err === 'object') {
            err = err.message;
          }
          console.log('Set Remote Description Fail', err);
        }); 
      },

      /**
      *
      * Set Local And Send Message
      * @param {Object} description SDP
      */
      setLocalAndSendMessage : function (description) {
        // fix SDP first time
        ATT.sdpFilter.getInstance().processChromeSDPOffer(description);

        this.localDescription = description;

        // set local description
        this.peerConnection.setLocalDescription(this.localDescription);

        if (this.modificationId) {
          SignalingService.sendAcceptMods({
            sdp : this.localDescription,
            modId: this.modificationId
          });
        }
      },

      // hold call
      holdCall: function () {

        var sdp = this.localDescription;

        // adjust for hold request
        sdp.sdp = sdp.sdp.replace(/a=sendrecv/g, 'a=recvonly');

        ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);

        this.modificationCount = this.modificationCount + 1;

        ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);

        // set local description
        this.peerConnection.setLocalDescription(sdp);

        // signal
        SignalingService.sendHoldCall({
          sdp : sdp.sdp
        });
      },

      // resume Call
      resumeCall: function () {

        var sdp = this.localDescription;

        // adjust for resume request
        sdp.sdp = sdp.sdp.replace(/a=recvonly/g, 'a=sendrecv');

        ATT.sdpFilter.getInstance().processChromeSDPOffer(sdp);

        this.modificationCount = this.modificationCount + 1;

        ATT.sdpFilter.getInstance().incrementSDP(sdp, this.modificationCount);

        // set local description
        this.peerConnection.setLocalDescription(sdp);

        // signal
        SignalingService.sendResumeCall({
          sdp : sdp.sdp
        });
      },

      // end Call
      endCall: function () {
        this.peerConnection.close();
        this.peerConnection = null;
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