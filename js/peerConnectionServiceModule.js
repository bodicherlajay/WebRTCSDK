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

      localDescription: {},

      remoteDescription: {},

      localStream: null,

      remoteStream: null,

      peerConnection: null,

      callingParty: null,

      calledParty: null,

      modificationId: null,

      /**
       * Create a new RTCPeerConnection.  Depends on the adapter.js module that abstracts away browser differences.
       * @returns {RTCPeerConnection}
       */
      start: function (config) {

        this.callingParty = config.from;
        this.calledParty = config.to;
        this.mediaConstraints = config.mediaConstraints;

        this.peerConnection = this.createPeerConnection();

        // add eventing to peer connection.
        this.setUpICETrickling(this.peerConnection);

        // send any ice candidates to the other peer
        // get a local stream, show it in a self-view and add it to be sent
        getUserMedia(config.mediaConstraints, this.getUserMediaSuccess.bind(this), this.onLocalStreamCreateError);
      },

      getUserMediaSuccess: function (stream) {
        var self = this,
          rm = cmgmt.CallManager.getInstance(),
          session = rm.getSessionContext(),
          event = session.getEventObject(),
          callState = session.getCallState();

        if (callState === rm.SessionState.OUTGOING_CALL) {
          // set local stream
          this.localStream = stream;

          // call the user media service to show stream
          UserMediaService.showStream('local', this.localStream);

          //add the local stream to peer connection
          this.peerConnection.addStream(stream);

          // create the offer. jslint complains when all are self or all are this.
          self.createOffer.call(this, self.peerConnection);

        } else if (callState === rm.SessionState.INCOMING_CALL) {
          // set local stream
          this.localStream = stream;

          // call the user media service to show stream
          UserMediaService.showStream('local', this.localStream);

          // create the offer. jslint complains when all are self or all are this.
          self.setRemoteAndCreateAnswer.call(this, event.sdp, true);
        }
      },

      onLocalStreamCreateError: function () {
        //Call the UI callback to inform the user about the error
        console.log('Failed to get User Media');
      },

      createOffer: function (pc) {
        var self = this,
          me = self;

        if (navigator.userAgent.indexOf('Chrome') < 0) {
          pc.createOffer(function (description) {
            self.setLocalAndSendMessage.call(me, description);
          }, function (err) {
            console.error(err);
          }, self.mediaConstraints);
        } else {
          pc.createOffer(function (description) {
            self.setLocalAndSendMessage.call(me, description);
          });
        }
      },

      createAnswer: function (createAnswer) {
        var self = this,
          me = self;

        console.log('Setting remote session description...');

        this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.remoteDescription), function () {
          console.log('Set Remote Description succeeded.');
        }, function (err) {
          // hack for difference between FF and Chrome
          if (typeof err === 'object') {
            err = err.message;
          }
          console.log('Set Remote Description failed: ' + err);
        });

        if (createAnswer) {
          if (navigator.userAgent.indexOf('Chrome') < 0) {
            this.peerConnection.createAnswer(function (description) {
              self.setLocalAndSendMessage.call(me, description);
            }, function (err) {
              console.error(err);
            }, self.mediaConstraints);
          } else {
            this.peerConnection.createAnswer(function (description) {
              self.setLocalAndSendMessage.call(me, description);
            });
          }
        }
      },

      setRemoteAndCreateAnswer: function (sdp, modId) {
        if (typeof modId === 'string') {
          this.modificationId = modId;
        }
        this.remoteDescription = {
          sdp: sdp,
          type: (modId !== undefined ? 'offer' : 'answer')
        };
        this.createAnswer(modId !== undefined);
      },

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

      setUpICETrickling: function (pc) {
        var self = this,
          rm = cmgmt.CallManager.getInstance(),
          session = rm.getSessionContext();

        pc.onicecandidate = function (evt) {
          if (evt.candidate) {
            console.log('receiving ice candidate ' + evt.candidate);
            // SignalingService.send(JSON.stringify({
              // "candidate" : evt.candidate
            // }));
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

        // let the "negotiationneeded" event trigger offer generation
        // pc.onnegotiationneeded = function() {
        // pc.createOffer(this.cbk_localSDPOffer, this.cbk_streamError);
        // }; 

        // once remote stream arrives, show it in the remote video element
        pc.onaddstream = function (evt) {
          this.remoteStream = evt.stream;
          UserMediaService.showStream('remote', this.remoteStream);
          console.log(this.remoteStream);
        };

        pc.oniceconnectionstatechange = function () {};

        pc.onsignalingstatechange = function () {};

        pc.onremovestream = function () {};

        pc.close = function () {};
      },

      // hold Call
      holdCall: function () {
        // fix SDP for hold call
        var holdSDP = this.localDescription.sdp.replace(/sendrecv/g, "recvonly");
        // set local description
        //this.peerConnection.setLocalDescription(this.localDescription);
        SignalingService.sendHoldCall({
          sdp : holdSDP
        });
      },

      // resume Call
      resumeCall: function () {
        // fix SDP for hold call
        var resumeSDP = this.localDescription.sdp.replace(/recvonly/g, "sendrecv");
        // set local description
        //this.peerConnection.setLocalDescription(this.localDescription);
        SignalingService.sendHoldCall({
          sdp : resumeSDP
        });
      },

      // end Call
      endCall: function () {
        this.peerConnection.close();
        this.peerConnection = null;
      }
    };

  module.createSession = function () {
    module.start();
  };

  //Name of the module
  app.PeerConnectionService = module;

}(ATT || {}, ATT.UserMediaService || {}, ATT.SignalingService || {}));