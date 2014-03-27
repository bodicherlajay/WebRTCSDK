/**
 * Created by Alex on 3/26/2014.
 */

var ATT = ATT || {};

(function (app, PeerConnectionService) {
    "use strict";
    
    //ATT.WebRTC.localVideoDOMId = '#x';
    //ATT.WebRTC.remoteVideoDOMId = '#y';
    
    var module = {
        
        localVideoElement: null, //document.getElementById(ATT.WebRTC.localVideoDOMId),
        
        remoteVideoElement: null, //document.getElementById(ATT.WebRTC.remoteVideoDOMId),
        
        remoteStream: null,
        
        localStream: null,
        
        startCall: function (mediaConstraints) {
           PeerConnectionService.start(mediaConstraints || this.mediaConstraints);
        },

        //standard webRTC audio, video constraints
        mediaConstraints: {
            "audio": true,
            "video": true
        },

        /**
         * Attaches media stream to DOM and plays video.
         * @param localOrRemote  Specify either 'local' or 'remote'
         * @param stream The media stream.
         */
        showStream: function (localOrRemote, stream) {   // 'local' or 'remote'
            var videoStreamEl;
            
            if (localOrRemote === 'remote') {
                this.remoteStream = stream;
                videoStreamEl = this.remoteVideoElement;
            } else {
                this.localStream = stream;
                videoStreamEl = this.localVideoElement;
            }
            
            videoStreamEl.src = URL.createObjectURL(stream);
            videoStreamEl.play();
        }
    };
    
    app.UserMediaService = module;
}(ATT || {}, ATT.PeerConnectionService || {}));