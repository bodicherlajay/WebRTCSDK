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

      localStream: null,

      remoteStream: null,

      peerConnection: null,

      calledParty: null,

      /**
       * Create a new RTCPeerConnection.  Depends on the adapter.js module that abstracts away browser differences.
       * @returns {RTCPeerConnection}
       */
      start: function (config) {

        this.calledParty = config.calledParty;

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

        // set local stream
        this.localStream = stream;

        // call the user media service to show stream
        UserMediaService.showStream('local', stream);

        //add the local stream to peer connection
        this.peerConnection.addStream(stream);

        // create the offer. jslint complains when all are self or all are this.
        self.createOffer.call(this, self.peerConnection);

        // create the answer.
        this.createAnswer.call(self, self.peerConnection);
      },

      onLocalStreamCreateError: function () {
        //Call the UI callback to inform the user about the error
        console.log('Failed to get User Media');
      },

      createOffer: function (pc) {
        var self = this,
          arg1 = function (description) {
            ATT.sdpFilter.getInstance().processChromeSDPOffer(description); // fix SDP first time
            self.localDescription = description;
            pc.setLocalDescription(self.localDescription);
          },
          arg2,
          arg3;

        if (navigator.userAgent.indexOf('Chrome') < 0) {
          arg2 = function (err) {
            console.error(err);
          };
          arg3 = self.mediaConstrains;
          pc.createOffer(arg1, arg2, arg3);
        } else {
          pc.createOffer(arg1);
        }
      },

      createAnswer: function (pc) {
        var sessionId = cmgmt.getInstance().getSessionContext().getAccessToken();

        ATT.event.subscribe(sessionId + '.responseEvent', function (event) {
          if (event.type === 'calls' && event.state === 'session-open') {
            console.log('Received answer...');
            console.log(event.sdp);
            pc.setRemoteDescription(new RTCSessionDescription({
              sdp : event.sdp,
              type : 'answer'
            }));
          }
        });
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
            self.localDescription = pc.localDescription;
            SignalingService.send({
              calledParty : self.calledParty,
              sdp : self.localDescription
            });
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