/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env:true, getUserMedia*/

//Runtime: cmgmt.CallManager, ATT.peerConnectionService

(function (app) {
  'use strict';

  var module,
    logManager = ATT.logManager.getInstance(),
    Error,
    eventEmitter,
    defaultMediaConstraints = { // default to video call
      audio: true,
      video: true
    },
    logger = logManager.getLoggerByName("UserMediaService"),
    factories = ATT.private.factories;

  function setError(service) {
    Error = service;
  }

  function setEventEmitter(service) {
    eventEmitter = service;
  }

  //When this modules gets loaded, we should have the following services available to consume
  function init() {
    logger.logInfo("Initializing User Media Service...");
    logger.logDebug("Setting the call manager");

    setError(app.Error);
    setEventEmitter(factories.createEventEmitter());

    eventEmitter.subscribe(ATT.SdkEvents.REMOTE_STREAM_ADDED, module.showStream, module);
  }

  module = {
    localMedia: null,
    remoteMedia: null,
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
    getUserMedia: function (options) {
      logger.logTrace('starting call');

      this.localMedia = options.localMedia;
      this.remoteMedia = options.remoteMedia;
      this.mediaConstraints = defaultMediaConstraints;

      if(undefined !== options.mediaType) {
        this.mediaConstraints.video = 'audio' !== options.mediaType
      }

      var config = {
        mediaConstraints: this.mediaConstraints,
        onUserMedia: options.onUserMedia
      };

      // get a local stream, show it in a self-view and add it to be sent
      getUserMedia(this.mediaConstraints, this.getUserMediaSuccess.bind(this, config), function (err) {
        options.onError(Error.create('Get user media failed: ' + err));
      });

      // set up listener for remote video start
      this.onRemoteVideoStart(options.onMediaEstablished);
    },

    /**
    * getUserMediaSuccess
    * @param {Object} stream The media stream
    */
    getUserMediaSuccess: function (config, stream) {
      logger.logDebug('getUserMediaSuccess');

      // call the user media service to show stream
      this.showStream({
        localOrRemote: 'local',
        stream: stream
      });

      // created user media object
      var userMedia = {
        mediaConstraints: config.mediaConstraints,
        localStream: stream
      };

      config.onUserMedia(userMedia);
    },

    /**
    * Listen for start of remote video
    * @param {HTMLElement} remoteVideo The remote video element
    * @returns {HTMLElement} remoteVideo
    */
    onRemoteVideoStart: function (callback) {
      this.remoteVideo.addEventListener('playing', function () {
        callback();
      });
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
          videoStreamEl = this.remoteVideo;
        } else {
          this.localStream = args.stream;
          videoStreamEl = this.localVideo;
          videoStreamEl.setAttribute('muted', '');
        }

        if (videoStreamEl) {
          videoStreamEl.src = window.URL.createObjectURL(args.stream);
          videoStreamEl.play();
        }
      } catch (e) {
        Error.publish('Could not start stream: ' + e.message);
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
        Error.publish('Could not stop stream: ' + e.message);
      }
    },

    /**
    * Mute Stream
    */
    muteStream: function () {
      logger.logTrace('muting stream...');
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
    * Unmute Stream
    */
    unmuteStream: function () {
      logger.logTrace('unmuting stream...');
      if (this.localStream) {
        var audioTracks = this.localStream.getAudioTracks(),
          i,
          l = audioTracks.length;
        for (i = 0; i < l; i = i + 1) {
          audioTracks[i].enabled = true;
        }
      }
    },

    /**
    * Disable the remote video stream
    */
    holdVideoStream: function () {
      if (this.remoteStream) {
        var videoTracks = this.remoteStream.getVideoTracks(),
          i,
          l = videoTracks.length;
        for (i = 0; i < l; i = i + 1) {
          videoTracks[i].enabled = false;
        }
      }
    },

    /**
    * Enable the remote video stream
    */
    resumeVideoStream: function () {
      if (this.remoteStream) {
        var videoTracks = this.remoteStream.getVideoTracks(),
          i,
          l = videoTracks.length;
        for (i = 0; i < l; i = i + 1) {
          videoTracks[i].enabled = true;
        }
      }
    },
    setError: setError  // testability
  };

  init();

  app.UserMediaService = module;
}(ATT));
