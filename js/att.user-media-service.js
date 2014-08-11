/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env:true, getUserMedia*/

//Runtime: cmgmt.CallManager, ATT.peerConnectionService

(function (app) {
  'use strict';

  var module,
    logManager = ATT.logManager.getInstance(),
    Error, //todo remove this reference
    defaultMediaConstraints = { // default to video call
      audio: true,
      video: true
    },
    logger = logManager.getLoggerByName("UserMediaService");

  function setError(service) {
    Error = service;
  }

  //When this modules gets loaded, we should have the following services available to consume
  function init() {
    logger.logInfo("Initializing User Media Service...");
    logger.logDebug("Setting the call manager");

    setError(app.Error);
  }

  module = {
    localMedia: null,
    remoteMedia: null,
    localStream: null,
    remoteStream: null,
    mediaConstraints: null,
    onUserMedia: null,
    onMediaEstablished: null,
    onUserMediaError: null,

    /**
    * Start Call
    * @param {Object} config The configuration
    * @attribute {String} phoneNumber
    * @attribute {HTMLElement} localVideo
    * @attribute {HTMLElement} remoteVideo
    * @attribute {Object} mediaConstraints
    * @attribute {Object} callbacks UI callbacks. Event object will be passed to these callbacks.
    */
    getUserMedia: function (options) {
      logger.logInfo('getUserMedia');
      var that = this, error;

      this.localMedia = options.localMedia;
      this.remoteMedia = options.remoteMedia;
      this.mediaConstraints = defaultMediaConstraints;
      this.onUserMedia = options.onUserMedia;
      this.onMediaEstablished = options.onMediaEstablished;
      this.onUserMediaError = options.onUserMediaError;

      if (undefined !== options.mediaType) {
        this.mediaConstraints.video = 'audio' !== options.mediaType;
      }

      // get a local stream, show it in a self-view and add it to be sent
      getUserMedia(this.mediaConstraints, that.getUserMediaSuccess.bind(that), function (mediaError) {
        logger.logError(mediaError);
        var error = ATT.errorDictionary.getSDKError(14000);
        options.onUserMediaError(error);
        logger.logError(error);
      });
    },

    /**
    * getUserMediaSuccess
    * @param {Object} stream The media stream
    */
    getUserMediaSuccess: function (stream) {
      logger.logDebug('getUserMediaSuccess');

      // call the user media service to show stream
      this.showStream({
        localOrRemote: 'local',
        stream: stream
      });

      // created user media object
      var userMedia = {
        mediaConstraints: this.mediaConstraints,
        localStream: stream
      };

      this.onUserMedia(userMedia);
    },

    /**
     * Attaches media stream to DOM and plays video.
     * @param localOrRemote  Specify either 'local' or 'remote'
     * @param stream The media stream.
     */
    showStream: function (args) {
      var videoStreamEl;

      logger.logTrace('showing ' + args.localOrRemote + ' stream...');

      try {
        if (args.localOrRemote === 'remote') {
          this.remoteStream = args.stream;
          videoStreamEl = this.remoteMedia;
        } else {
          this.localStream = args.stream;
          videoStreamEl = this.localMedia;
          videoStreamEl.setAttribute('muted', '');
        }

        if (videoStreamEl) {
          videoStreamEl.src = window.URL.createObjectURL(args.stream);
          videoStreamEl.play();
          if (args.localOrRemote === 'remote') {
            this.onMediaEstablished();
          }
        }
      } catch (e) {
        //get the sdk error
        logger.logError('showStream error');
        logger.logError(e);
        if (undefined !== onUserMediaError
            && 'function' === typeof onUserMediaError) {
          onUserMediaError(e);
        };
      }
    },

    /**
    * Removes all media streams from the DOM
    */
    stopStream: function () {
      logger.logTrace('stopping streams...');
      try {
        if (this.localMedia) {
          this.localMedia.src = '';
        }
        if (this.remoteMedia) {
          this.remoteMedia.src = '';
        }
        if (this.localStream) {
          this.localStream.stop();
          this.localStream = null;
        }
        if (this.remoteStream) {
          this.remoteStream.stop();
          this.remoteStream = null;
        }
      } catch (e) {
        //todo get the sdk error
        onUserMediaError(e);
      }
    },

    /**
    * Mute Stream
    * @param {Object} options The callbacks from rtcmanager
    */
    muteStream: function (options) {
      logger.logTrace('muting stream...');
      if (this.localStream) {
        var audioTracks = this.localStream.getAudioTracks(),
          i,
          l = audioTracks.length;
        for (i = 0; i < l; i = i + 1) {
          audioTracks[i].enabled = false;
        }
        return options.onLocalStreamMuted();
      }
    },

   /**
    * Unmute Stream
    * @param {Object} options The callbacks from rtcmanager
    */
    unmuteStream: function (options) {
      logger.logTrace('unmuting stream...');
      if (this.localStream) {
        var audioTracks = this.localStream.getAudioTracks(),
          i,
          l = audioTracks.length;
        for (i = 0; i < l; i = i + 1) {
          audioTracks[i].enabled = true;
        }
        return options.onLocalStreamUnmuted();
      }
    },

    /**
    * Disable the remote media stream
    */
    disableMediaStream: function () {
      if (this.remoteStream) {
        var videoTracks = this.remoteStream.getVideoTracks(),
          i,
          l = videoTracks.length,
          audioTracks;
        for (i = 0; i < l; i = i + 1) {
          videoTracks[i].enabled = false;
        }
        audioTracks = this.remoteStream.getAudioTracks();
        l = audioTracks.length;
        for (i = 0; i < l; i = i + 1) {
          audioTracks[i].enabled = false;
        }
      }
    },

    /**
    * Enable the remote media stream
    */
    enableMediaStream: function () {
      if (this.remoteStream) {
        var videoTracks = this.remoteStream.getVideoTracks(),
          i,
          l = videoTracks.length,
          audioTracks;
        for (i = 0; i < l; i = i + 1) {
          videoTracks[i].enabled = true;
        }
        audioTracks = this.remoteStream.getAudioTracks();
        l = audioTracks.length;
        for (i = 0; i < l; i = i + 1) {
          audioTracks[i].enabled = true;
        }
      }
    },
    setError: setError  // testability
  };

  init();

  app.UserMediaService = module;
}(ATT));
