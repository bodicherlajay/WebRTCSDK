/**
 * Created by Rakesh Malik on 2/25/14.
 */
var isInitiator;

var isChannelReady;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;
var socket;
var pc_config = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
var room;

var isChrome = !!navigator.webkitGetUserMedia;

var STUN = {
    url: isChrome
        ? 'stun:stun.l.google.com:19302'
        : 'stun:23.21.150.121'
};

var TURN = {
    url: 'turn:homeo@turn.bistri.com:80',
    credential: 'homeo'
};

var iceServers = {
    iceServers: [STUN, TURN]
};

// DTLS/SRTP is preferred on chrome
// to interop with Firefox
// which supports them by default

var DtlsSrtpKeyAgreement = {
    DtlsSrtpKeyAgreement: true
};

var optional = {
    optional: [DtlsSrtpKeyAgreement]
};

var pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};

var sdpConstraints = {mandatory: {
    'OfferToReceiveAudio': true,
    'OfferToReceiveVideo': true
}};

navigator.getUserMedia  = navigator.getUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.msGetUserMedia;

var MediaConstraints = {
    audio: true,
    video: true
};

var localVideo;
var remoteVideo;
var startPeerButton;
var initButton;
var startButton;
var joinButton;

var peer = new webkitRTCPeerConnection(iceServers, optional );

function init() {
    //room = prompt("Enter room name:");

    localVideo = document.getElementById("localVideo");
    remoteVideo = document.getElementById("remoteVideo");

    startPeerButton = document.getElementById("peer");
    initButton = document.getElementById('init');
    startButton = document.getElementById('start');
    joinButton = document.getElementById('join');

    startPeerButton.onclick = function(){
        this.disabled = true;

        peer.onaddstream = function(mediaStream){
            remoteVideo.src = webkitURLCreateObjectURL(mediaStream);
        };

        peer.onicecandidate = function(event){
            var candidate = event.candidate;
            if(candidate){
                socket.send({
                    'target-user':'target-user-id',
                    'candidate': candidate
                });
            }
        };
        pc.onaddstream = handleRemoteStreamAdded;
    };

    //socket = io.connect();
    socket = new io.connect('localhost', {
        port: 2013
    });
    socket.on("connection", function(){
       console.log('Server connection established successfully.');
    });


        //WebSocket('ws://localhost:2013');

    joinButton.onclick = function(){
        console.log('Join has been clicked.');
        room = prompt("Name of room to join (or create):");
        socket.emit('create or join', room, function(data){
            alert("Response: " + data);
        });
    };
    socket.onopen = function() {

    };

    socket.onclose = function(){};
    socket.on('joined', function(){
        console.log("a new client has joined the room");
    });

    socket.onmessage = function(e){
        var data = e.data;
        console.log("Message from server: " + e.data);
        if (data.targetUser != self) {
            if (data.offerSDP) {
                createAnswer(data.offerSDP);
            }
            if (data.answerSDP) {
                var remoteDescription = new RTCSessionDescription(data.answerSDP);
                peer.setRemoteDescription(remoteDescription);
            }
            if (data.candidate) {
                var candidate = data.candidate.candidate;
                var sdpMLineIndex = data.candidate.spdMLineIndex;
                peer.addIceCandidate(new RTCIceCandidate({
                    sdpMLineIndex: sdpMLineIndex,
                    candidate: candidate
                }));
            }
        }
    };

    if (room !== "") {
        console.log('Joining room ' + room);
        //socket.emit('create or join', room);
    }


    startLocalVideoStream();
}

function gotStream(stream){
    console.log("Received a local stream");
    localVideo.src = webkitURL.createObjectURL(stream);
    localStream = stream;
    peer.addStream(stream);
}

function startLocalVideoStream(){
    console.log("Requesting local stream");
    navigator.getUserMedia(MediaConstraints,
        gotStream,
        function (error){trace("GetUserMedia error: " + error)}
    );
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
}

function createAnswer(offerSDP){
    navigator.webkitGetUserMedia(MediaConstraints, OnMediaSuccess, OnMediaError);

    var remoteDescription = new RTCSessionDescription(offerSDP);
    peer.setRemoteDescription(remoteDescription);
    peer.createAnswer(function (answerSDP){
       peer.setlocalDescription(answerSDP);
        socket.send({
            targetUser: 'target-user-id',
            answerSDP: answerSDP
        }), onfailure, sdpConstraints
    });

    function OnMediaError(error){
        console.log("Media error: " + error);
    }

    function OnMediaSuccess(mediaStream){
        var peer = new webkitRTCMediaConnection(iceServers, optional);
        peer.addStream(mediaStream);
        peer.onaddstream(function(stream){
            remoteVideo.src = WebkitURL.createObjectURL(stream);
        });

        peer.onicecandidate = function(event){
            var candidate = event.candidate;
            if(candidate){
                socket.send({
                    'target-user':'target-user-id',
                    candidate: candidate
                });
            }
        }
    }
}