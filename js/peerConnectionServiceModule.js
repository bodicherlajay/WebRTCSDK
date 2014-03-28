/**
 * Created by Alex on 3/26/2014.
 */
/**
 * PeerConnection Service
 * 
 * This module
 * 
 * Dependencies:  adapter.js
 */
var ATT = ATT || {};

(function(app, UserMediaService, SignalingService){
    "use strict";
   
    // STUN Server configuration
    var  stun = { url: 'stun:stun.l.google.com:19302' },

        // TURN server configuration
        turn = { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' },
   
        module = {

        createPeerConnection: function () {
            return new RTCPeerConnection(this.iceServers, this.pcConstraints);
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

            // send any ice candidates to the other peer
            // get a local stream, show it in a self-view and add it to be sent
            getUserMedia(config.mediaConstraints, this.getUserMediaSuccess.bind (this), this.onLocalStreamCreateError);
        },

        getUserMediaSuccess: function (stream) {

            // set local stream
            this.localStream = stream;

            // call the user media service to show stream
            UserMediaService.showStream('local', stream);

            //add the local stream to peer connection
            this.peerConnection.addStream(stream);

            // add eventing to peer connection.
            this.setUpICETrickling(this.peerConnection);

            // create the offer.
            this.createOffer(this.peerConnection);
        },

        onLocalStreamCreateError: function () {
            //Call the UI callback to inform the user about the error
            console.log ('Failed to get User Media');
        },

        createOffer: function (pc) {
            var self = this;
            var arg1 = function(description) {
                pc.setLocalDescription(description);
                SignalingService.send({
                    calledParty : self.calledParty,
                    sdp : description
                });
            };
            if (navigator.userAgent.indexOf('Chrome') < 0) {
                var arg2 = function(err) {
                    console.error(err);
                };
                var arg3 = this.mediaConstrains;
                pc.createOffer(arg1, arg2, arg3);
            } else {
                pc.createOffer(arg1);
            }
            
        },

        setUpICETrickling: function (pc) {
//            pc.onicecandidate = function (evt) {
//                if (evt.candidate) {
//                    SignalingService.send(JSON.stringify({ "candidate": evt.candidate }));
//                }
//            };

            // let the "negotiationneeded" event trigger offer generation
//            pc.onnegotiationneeded = function () {
//                pc.createOffer(this.cbk_localSDPOffer, this.cbk_streamError);
//            };

            // once remote stream arrives, show it in the remote video element
            pc.onaddstream = function (evt) {
                this.remoteStream = evt.stream;
                UserMediaService.showStream('remote', this.remoteStream);
            };

            pc.oniceconnectionstatechange = function (evt) {
            };

            pc.onsignalingstatechange = function (evt) {
            };

            pc.onremovestream = function (evt) {
            };

            pc.close = function (evt) {
            };
        }
    };

    module.createSession = function() {
        module.start();
    };

    //Name of the module
    app.PeerConnectionService = module;

})(ATT, ATT.UserMediaService || {}, ATT.SignalingService || {});

///**
// Gets initialized with UserMediaService object
// Gets initialize by mediator in response to SDP offer or gets initialized in response to user action and
// sends SDP offer to mediator
// **/
//
//var peerConnectionService = {
//    //stun server configuration
//    STUN: { url: 'stun:stun.l.google.com:19302' },
//    
//    //turn server configuration
//    TURN: { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' },
//    
//    iceServers: { iceServers: [this.STUN] },
//    
//    pc_constraints:
//    {"optional": [
//        {'DtlsSrtpKeyAgreement': 'false'}
//    ]},
//    
//    localStream: null,
//    
//    remoteStream: null,
//    
//    //TODO Use the adapter to create Cross browser compatible RTCPeerConnection
//    peerConnection: function newPeerConnection()
//    {
//        return new RTCPeerConnection(this.iceServers, this.pc_constraints);
//    },
//    
//    cbk_localSDPOffer: function localDesc(sdp) {
//        //Send the SDP to signalling channel
//        signalingChannel.send(sdp);
//    },
//    
//    cbk_streamError: function logError() {
//        //Call the UI callback to inform the user about the error
//    },
//    
//    cbk_ui_showLocalStream : function cbk_ui_showLocalStream(stream)
//    {
//        userMediaService.cbk_ui_showLocalStream(stream);
//    },
//    
//    cbk_ui_showRemoteStream: function cbk_ui_showRemoteStream(stream)
//    {
//        userMediaService.cbk_ui_showRemoteStream(stream);
//    },
//    
//    start : function (mediaConstraints) {
//        this.mediaConstrains = mediaConstraints;
//        
//        var pc = this.peerConnection();
//        // send any ice candidates to the other peer
//
//        // get a local stream, show it in a self-view and add it to be sent
//        navigator.getUserMedia(mediaConstraints, function (stream) {
//            this.localStream = stream;
//            this.cbk_ui_showLocalStream(stream);
//            //add the local stream to peer connection
//            pc.addStream(stream);
//        }, this.cbk_streamError);
//        
//        pc.onicecandidate = function (evt)
//        {
//            if (evt.candidate)
//                signalingChannel.send(JSON.stringify({ "candidate": evt.candidate }));
//        };
//
//        // let the "negotiationneeded" event trigger offer generation
//        pc.onnegotiationneeded = function () {
//            pc.createOffer(this.cbk_localSDPOffer, this.cbk_streamError);
//        };
//
//        // once remote stream arrives, show it in the remote video element
//        pc.onaddstream = function (evt)
//        {
//            this.remoteStream = evt.stream;
//            this.cbk_ui_showRemoteStream(evt.stream);
//        };
//
//        pc.oniceconnectionstatechange = function (evt){
//
//        };
//
//        pc.onsignalingstatechange = function(evt){
//
//        };
//
//        pc.onremovestream = function(evt){
//
//        };
//
//        pc.close = function(evt){
//
//        };
//
//        
//    }
//};
//
//(function(mainModule,peerConnectionService){
//    "use strict";
//    var module = {};
//    var self = this;
//
//    module.createSession = function()
//    {
//        peerConnectionService.start();
//    }
//
//    //Name of the module
//    mainModule.session = module;
//
//})(ATT.WebRTC, peerConnectionService);