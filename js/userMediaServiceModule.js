/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true */
/**
 * Created by Alex on 3/26/2014.
 */

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

      videoStreamEl.src = window.URL.createObjectURL(stream);
      videoStreamEl.play();
    }
  };

  app.UserMediaService = module;
}(ATT || {}, ATT.PeerConnectionService || {}));