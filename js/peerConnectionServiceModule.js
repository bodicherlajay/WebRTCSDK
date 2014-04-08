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

      createPeerConnection: function () {
        return new RTCPeerConnection(this.iceServers);//, this.pcConstraints);
      },

      mediaConstrains: {},

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

      localDescription: null,
      
      remoteDescription: null,

      localStream: null,

      remoteStream: null,

      peerConnection: null,

      callingParty: null,

      calledParty: null,

      /**
       * Create a new RTCPeerConnection.  Depends on the adapter.js module that abstracts away browser differences.
       * @returns {RTCPeerConnection}
       */
      start: function (config) {

        this.callingParty = config.from;
        this.calledParty = config.to;
        this.mediaConstrains = config.mediaConstraints;

        this.peerConnection = this.createPeerConnection();

        // add eventing to peer connection.
        this.setUpICETrickling(this.peerConnection);

        // send any ice candidates to the other peer
        // get a local stream, show it in a self-view and add it to be sent
        getUserMedia(config.mediaConstraints, this.getUserMediaSuccess.bind(this), this.onLocalStreamCreateError);
      },

      getUserMediaSuccess: function (stream) {
        var self = this;

         // get the call state from the session
        var callState = callManager.getSessionContext().getCallState();

        if (callState === callManager.SessionState.OUTGOING_CALL) {
          // set local stream
          this.localStream = stream;

          // call the user media service to show stream
          UserMediaService.showStream('local', this.localStream);

          //add the local stream to peer connection
          this.peerConnection.addStream(stream);
  
          // create the offer. jslint complains when all are self or all are this.
          self.createOffer.call(this, self.peerConnection);

        } else if (callState === callManager.SessionState.INCOMING_CALL) {
          // set local stream
          this.remoteStream = stream;

          // call the user media service to show stream
          UserMediaService.showStream('remote', this.remoteStream);

          // create the offer. jslint complains when all are self or all are this.
          self.createAnswer.call(this, self.peerConnection);

        }
      },

      onLocalStreamCreateError: function () {
        //Call the UI callback to inform the user about the error
        console.log('Failed to get User Media');
      },

      createOffer: function (pc) {
        var self = this;

        if (navigator.userAgent.indexOf('Chrome') < 0) {
          pc.createOffer(self.setLocalAndSendMessage, function(err) {
            console.error(err);
          }, self.mediaConstrains);
        } else {
          pc.createOffer(self.setLocalAndSendMessage);
        }
      },

      createAnswer: function (pc) {
        var self = this, sessionId = cmgmt.CallManager.getInstance().getSessionContext().getSessionId();

        console.log('Received answer...');
        console.log(self.remoteDescription);

        pc.setRemoteDescription(new RTCSessionDescription(self.remoteDescription), function() {
          console.log('Set Remote Description succeeded.');
        }, function(err) {
          console.log('Set Remote Description failed: ' + err);
        });

        console.log('Sending answer...');

        pc.createAnswer(self.setLocalAndSendMessage, function(err) {
          console.error(err);
        }, self.mediaConstraints);
      },

      setLocalAndSendMessage : function (description) {
        ATT.sdpFilter.getInstance().processChromeSDPOffer(description);
        // fix SDP first time
        this.localDescription = description;
        pc.setLocalDescription(self.localDescription);
      },

      setUpICETrickling: function (pc) {
        var self = this;
        pc.onicecandidate = function (evt) {
          if (evt.candidate) {
            console.log('receiving ice candidate ' + evt.candidate);
            // SignalingService.send(JSON.stringify({
              // "candidate" : evt.candidate
            // }));
          } else {
            // get the call state from the session
            var callState = callManager.getSessionContext().getCallState();
            
            if (callState === callManager.SessionState.OUTGOING_CALL) {
              self.localDescription = pc.localDescription;
              SignalingService.send({
                calledParty : self.calledParty,
                sdp : self.localDescription
              });
            } else if (callState === callManager.SessionState.INCOMING_CALL) {
              self.localDescription = pc.localDescription;
              SignalingService.send({
                callsMediaModifications : {
                  sdp : self.localDescription
                }
              }); 
            }
          }
        };

        // let the "negotiationneeded" event trigger offer generation
        // pc.onnegotiationneeded = function() {
        // pc.createOffer(this.cbk_localSDPOffer, this.cbk_streamError);
        // }; 

        // once remote stream arrives, show it in the remote video element
        pc.onaddstream = function (evt) {
          this.remoteStream = evt.stream;
          UserMediaService.showStream('remote', this.remoteStream);
        };

        pc.oniceconnectionstatechange = function () {};

        pc.onsignalingstatechange = function () {};

        pc.onremovestream = function () {};

        pc.close = function () {};
      }
    };

  module.createSession = function () {
    module.start();
  };

  //Name of the module
  app.PeerConnectionService = module;

}(ATT || {}, ATT.UserMediaService || {}, ATT.SignalingService || {}));