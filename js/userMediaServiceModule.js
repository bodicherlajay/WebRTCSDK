/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true */

if (!ATT) {
  var ATT = {};
}

(function (app) {
  "use strict";

  var module = {

    localVideoElement: null,

    remoteVideoElement: null,

    remoteStream: null,

    localStream: null,

    startCall: function (config) {
      // set local/remote vid element
      this.localVideoElement = config.localVideo;
      this.remoteVideoElement = config.remoteVideo;

      ATT.PeerConnectionService.start(config);
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

      if (videoStreamEl) {
        videoStreamEl.src = window.URL.createObjectURL(stream);
        videoStreamEl.play();
      }
    },

    // stop stream
    stopStream: function () {
      this.localVideoElement.src = '';
      this.remoteVideoElement.src = '';
      if (this.localStream) {
        this.localStream.stop();
      }
      if (this.remoteStream) {
        this.remoteStream.stop();
      }
    },

    // mute stream
    muteStream: function () {
      if (this.localStream) {
        var audioTracks = this.localStream.getAudioTracks(),
          i,
          l = audioTracks.length;
        for (i = 0; i < l; i = i + 1) {
          audioTracks[i].enabled = false;
        }
      }
    },

    // un-mute stream
    unmuteStream: function () {
      if (this.localStream) {
        var audioTracks = this.localStream.getAudioTracks(),
          i,
          l = audioTracks.length;
        for (i = 0; i < l; i = i + 1) {
          audioTracks[i].enabled = true;
        }
      }
    }
  };

  app.UserMediaService = module;
}(ATT || {}));
