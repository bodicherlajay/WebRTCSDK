/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true */

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  var module = {

    localVideoElement: null,

    remoteVideoElement: null,

    localStream: null,

    remoteStream: null,

    /**
    * Start Call
    * @param {Object} config The configuration
    * @attribute {String} phoneNumber
    * @attribute {HTMLElement} localVideo
    * @attribute {HTMLElement} remoteVideo
    * @attribute {Object} mediaConstraints
    * @attribute {Object} callbacks UI callbacks. Event object will be passed to these callbacks.
    */
    startCall: function (config) {
      this.localVideoElement = config.localVideo;
      this.remoteVideoElement = config.remoteVideo;

      ATT.PeerConnectionService.start(config);
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

    /**
    *
    * Stop Stream
    */
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

    /**
    *
    * Mute Stream
    */
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

   /**
    *
    * Unmute Stream
    */
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