/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global performance, mozRTCPeerConnection, mozRTCSessionDescription,
mozRTCIceCandidate, mozRTCIceCandidate, MediaStream, webkitRTCPeerConnection,
URL*/
/**
 * Adapter.js.
 * From: https://code.google.com/p/webrtc/source/browse/stable/samples/js/base/adapter.js
 */

'use strict';

var RTCPeerConnection = null,
  RTCSessionDescription,
  RTCIceCandidate = null,
  getUserMedia = null,
  attachMediaStream = null,
  reattachMediaStream = null,
  webrtcDetectedBrowser = null,
  webrtcDetectedVersion = null,
  createIceServer;


function trace(text) {
  // This function is used for logging.
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  console.log((performance.now() / 1000).toFixed(3) + ': ' + text);
}

if (navigator.mozGetUserMedia) {
  console.log('This appears to be Firefox');

  webrtcDetectedBrowser = 'firefox';

  webrtcDetectedVersion = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);

  // The RTCPeerConnection object.
  RTCPeerConnection = mozRTCPeerConnection;

  // The RTCSessionDescription object.
  RTCSessionDescription = mozRTCSessionDescription;

  // The RTCIceCandidate object.
  RTCIceCandidate = mozRTCIceCandidate;

  // Get UserMedia (only difference is the prefix).
  // Code from Adam Barth.
  getUserMedia = navigator.mozGetUserMedia.bind(navigator);

  // Creates iceServer from the url for FF.
  createIceServer = function (url, username, password) {
    var iceServer = null,
      url_parts = url.split(':'),
      turn_url_parts;

    if (url_parts[0].indexOf('stun') === 0) {
      // Create iceServer with stun url.
      iceServer = { 'url': url };
      return iceServer;
    }

    // It's not STUN, check for TURN

    if (url_parts[0].indexOf('turn') === 0) {
      // Create iceServer with turn url.

      if (webrtcDetectedVersion >= 27) {
        // FF 27 and above supports transport parameters in TURN url,
        // So passing in the full url to create iceServer.
        iceServer = {
          'url': url,
          'credential': password,
          'username': username
        };
        return iceServer;
      }

      // Ignore the transport parameter from TURN url for FF version <27.
      turn_url_parts = url.split('?');

      if (turn_url_parts[1].indexOf('transport=udp') === 0) {
        iceServer = {
          'url': turn_url_parts[0],
          'credential': password,
          'username': username
        };
        return iceServer;
      }

      // Return null for createIceServer if transport===tcp.
      return null;
    }
  };

  // Attach a media stream to an element.
  attachMediaStream = function (element, stream) {
    console.log('Attaching media stream');
    element.mozSrcObject = stream;
    element.play();
  };

  reattachMediaStream = function (to, from) {
    console.log('Reattaching media stream');
    to.mozSrcObject = from.mozSrcObject;
    to.play();
  };

  // Fake get{Video,Audio}Tracks
  if (!MediaStream.prototype.getVideoTracks) {
    MediaStream.prototype.getVideoTracks = function () {
      return [];
    };
  }

  if (!MediaStream.prototype.getAudioTracks) {
    MediaStream.prototype.getAudioTracks = function () {
      return [];
    };
  }
} else if (navigator.webkitGetUserMedia) {
  console.log('This appears to be Chrome');

  webrtcDetectedBrowser = 'chrome';
  webrtcDetectedVersion =
    parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);

  // Creates iceServer from the url for Chrome.
  var createIceServer = function (url, username, password) {
    var iceServer = null,
      url_parts = url.split(':');
    if (url_parts[0].indexOf('stun') === 0) {
      // Create iceServer with stun url.
      iceServer = { 'url': url };
    } else if (url_parts[0].indexOf('turn') === 0) {
      // Chrome M28 & above uses below TURN format.
      iceServer = {
        'url': url,
        'credential': password,
        'username': username
      };
    }
    return iceServer;
  };

  // The RTCPeerConnection object.
  RTCPeerConnection = webkitRTCPeerConnection;

  // Get UserMedia (only difference is the prefix).
  // Code from Adam Barth.
  getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

  // Attach a media stream to an element.
  attachMediaStream = function (element, stream) {
    if (!(element.srcObject === 'undefined')) {
      element.srcObject = stream;
    } else if (!(element.mozSrcObject === 'undefined')) {
      element.mozSrcObject = stream;
    } else if (!(element.src === 'undefined')) {
      element.src = URL.createObjectURL(stream);
    } else {
      console.log('Error attaching stream to element.');
    }
  };

  reattachMediaStream = function (to, from) {
    to.src = from.src;
  };
} else {
  console.log('Browser does not appear to be WebRTC-capable');
}
