/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env:true, getUserMedia*/

//Dependency: Env.resourceManager
//Runtime: cmgmt.CallManager, ATT.peerConnectionService

(function (app) {
  'use strict';

  var module,
    callManager,
    logger = Env.resourceManager.getInstance().getLogger("UserMediaService");

  function setCallManager(callMgr) {
    callManager = callMgr;
  }


  //When this modules gets loaded, we should have the following services available to consume
  function init() {
    logger.logInfo("Initializing User Media Service...");
    logger.logDebug("Setting the call manager");

    setCallManager(window.cmgmt.CallManager.getInstance());
  }

  module = {

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
      logger.logTrace('starting call');

      this.localVideoElement = config.localVideo;
      this.remoteVideoElement = config.remoteVideo;

      var args = {
        from: config.from,
        to: config.to,
        mediaConstraints: config.mediaConstraints
      };

      // send any ice candidates to the other peer
      // get a local stream, show it in a self-view and add it to be sent
      getUserMedia(config.mediaConstraints, this.getUserMediaSuccess.bind(this, args), function () {
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
      this.showStream('local', stream);

      // set local stream
      args.localStream = stream;

      ATT.event.publish(ATT.SdkEvents.USER_MEDIA_INITIALIZED, args);
    },

    /**
    * Listen for start of remote video
    * @param {HTMLElement} remoteVideo The remote video element
    * @returns {HTMLElement} remoteVideo
    */
    onRemoteVideoStart: function (remoteVideo) {
      remoteVideo.addEventListener('playing', function () {
        var sessionId = callManager.getSessionContext().getSessionId();

        ATT.event.publish(sessionId + '.responseEvent', {
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
     * @param {Object} callManager The call manager
     */
    showStream: function (localOrRemote, stream) {
      var videoStreamEl;

      logger.logTrace('showing ' + localOrRemote + ' stream...');
      if (localOrRemote === 'remote') {
        this.remoteStream = stream;
        videoStreamEl = this.remoteVideoElement;
      } else {
        this.localStream = stream;
        videoStreamEl = this.localVideoElement;
        videoStreamEl.setAttribute('muted', '');
      }

      if (videoStreamEl) {
        videoStreamEl.src = window.URL.createObjectURL(stream);
        videoStreamEl.play();
      }
    },

    /**
    * Removes all media streams from the DOM
    */
    stopStream: function () {
      logger.logTrace('stopping streams...');
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
    }
  };

  init();

  app.UserMediaService = module;
}(ATT));