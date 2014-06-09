/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env:true, getUserMedia*/

//Dependency: Env.resourceManager
//Runtime: cmgmt.CallManager, ATT.peerConnectionService

(function (app) {
  'use strict';

  var module,
    Error,
    eventEmitter,
    defaultMediaConstraints = { // default to video call
      audio: true,
      video: true
    },
    logger = Env.resourceManager.getInstance().getLogger("UserMediaService");

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
    setEventEmitter(app.event);

    eventEmitter.subscribe(ATT.SdkEvents.REMOTE_STREAM_ADDED, module.showStream, module);
  }

  module = {
    sessionId: null,
    localVideoElement: null,
    remoteVideoElement: null,
    localStream: null,
    remoteStream: null,
    mediaConstraints: null,

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
      logger.logTrace('starting call');

      this.sessionId = config.session.getSessionId(); // TODO: UM shouldn't use session
      this.localVideoElement = config.localVideo;
      this.remoteVideoElement = config.remoteVideo;
      this.mediaConstraints = config.mediaConstraints || defaultMediaConstraints;

      if (config.mediaType) {
        // for incoming call, overwrite media constraints
        // TODO: need to compare and upgrade/downgrade call 
        this.mediaConstraints.video = (config.mediaType === 'video');
      }

      var args = {
        from: config.from,
        to: config.to,
        mediaConstraints: this.mediaConstraints,
        type: config.type,
        session: config.session  // TODO: UM shouldn't use session
      };

      // get a local stream, show it in a self-view and add it to be sent
      getUserMedia(this.mediaConstraints, this.getUserMediaSuccess.bind(this, args), function () {
        Error.publish('Get user media failed');
      });

      // set up listener for remote video start
      this.onRemoteVideoStart(config.remoteVideo);
    },

    /**
    * getUserMediaSuccess
    * @param {Object} stream The media stream
    */
    getUserMediaSuccess: function (args, stream) {
      logger.logDebug('getUserMediaSuccess');

      // call the user media service to show stream
      this.showStream({
        localOrRemote: 'local',
        stream: stream
      });

      // set local stream
      args.localStream = stream;

      eventEmitter.publish(ATT.SdkEvents.USER_MEDIA_INITIALIZED, args);
    },

    /**
    * Listen for start of remote video
    * @param {HTMLElement} remoteVideo The remote video element
    * @returns {HTMLElement} remoteVideo
    */
    onRemoteVideoStart: function (remoteVideo) {
      remoteVideo.addEventListener('playing', function () {
        eventEmitter.publish(this.sessionId + '.responseEvent', {
          state : ATT.RTCCallEvents.CALL_IN_PROGRESS
        });
      });

      remoteVideo.src = '';

      return remoteVideo;
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
          videoStreamEl = this.remoteVideoElement;
        } else {
          this.localStream = args.stream;
          videoStreamEl = this.localVideoElement;
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
        if (this.localVideoElement) {
          this.localVideoElement.src = '';
        }
        if (this.remoteVideoElement) {
          this.remoteVideoElement.src = '';
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
