/**
 * Created by Rakesh Malik on 2/24/14.
 */

navigator.getUserMedia  = navigator.getUserMedia ||
    navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.msGetUserMedia;

var localVideo;
var remoteVideo;

var startbutton;
var hangupbutton;
var callbutton;

function init (){
    console.log("initializing");
startbutton = document.getElementById("startButton");
hangupbutton = document.getElementById("hangupButton");
callbutton = document.getElementById("callButton");
    localVideo = document.getElementById("localVideo");
    remoteVideo = document.getElementById("remoteVideo");

var localStream, localPeerConnection, remotePeerConnection;

    console.log("Wiring buttons");
startbutton.disabled = false;
hangupbutton.disabled = true;
callbutton.disabled = true;

startbutton.onclick = start;
hangupbutton.onclick = hangup;
callbutton.onclick = call;
}
function trace(text){
    console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}

function gotStream(stream){
    console.log("Received a local stream");
    localVideo.src = URL.createObjectURL(stream);
    localStream = stream;
    callbutton.disabled = false;
}

function start(){
    console.log("Requesting local stream");
    startbutton.disabled = true;
    navigator.getUserMedia({audio: true, video: true},
        gotStream,
    function (error){trace("GetUserMedia error: " + error())}
    );
}

function call(){
    callbutton.disabled = true;
    hangupbutton.disabled = false;

    trace("Starting call");
    if(localStream.getVideoTracks().length > 0){
        trace('Using video device: ' + localStream.getVideoTracks()[0].label);
    }
    if(localStream.getAudioTracks().length > 0){
        trace('Using audio device: ' + localStream.getAudioTracks()[0].label);
    }

    var servers = null;

    localPeerConnection = new webkitRTCPeerConnection(servers);
    trace("Created localPeerConnection object");
    localPeerConnection.onicecandidate = gotLocalIceCandidate;

    remotePeerConnection = new webkitRTCPeerConnection(servers);
    trace("Created remotePeerConnection");
    remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
    remotePeerConnection.onaddstream = gotRemoteStream;

    localPeerConnection.addStream(localStream);
    trace("Add local stream to local connection");
    localPeerConnection.createOffer(gotLocalDescription, handleError);
}

function gotLocalDescription(description){
    localPeerConnection.setLocalDescription(description);
    trace("Offer from localPeerConnection: \n" + description.sdp);
    remotePeerConnection.setRemoteDescription(description);
    remotePeerConnection.createAnswer(gotRemoteDescription, handleError);
}

function gotRemoteDescription(description){
    remotePeerConnection.setLocalDescription(description);
    trace("Answer from remote peer: " + description.sdp);
    localPeerConnection.setRemoteDescription(description);
}

function hangup(){
    trace("Ending call");
    localPeerConnection.close();
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;
    hangupbutton.disabled = true;
    callbutton.disabled = false;
}

function gotRemoteStream(event){
    remoteVideo.src = URL.createObjectURL(event.stream);
    trace("Received remote stream");
}

function gotLocalIceCandidate(event){
    if(event.candidate){
        remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        trace("Local ICE candidate: \n" + event.candidate);
    }
}

function gotRemoteIceCandidate(event){
    if(event.candidate){
        localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        trace("Remote ICE candidate: \n " + event.candidate);
    }
}

function handleError(error){"Error: " + error}