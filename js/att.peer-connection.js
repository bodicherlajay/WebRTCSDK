/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, RTCPeerConnection*/
(function () {
  'use strict';

  function createPeerConnection(options) {

    var peerConnection,
      pc,
      localDescription,
      localStream;

    function addStream() {
//      localStream = stream;
//      pc.addStream(localStream);
    }

    function setRemoteDescription(sdp) {
      pc.setRemoteDescription(sdp);
    }

    function setLocalDescription(sdp) {
      localDescription = sdp;
      pc.setLocalDescription(sdp);

    }
    function createAnswer() {

    }

    if (undefined === options || Object.keys(options).length === 0) {
      throw new Error('No options passed.');
    }
    if (undefined === options.stream) {
      throw new Error('No `stream` passed.');
    }
    localStream = options.stream;

    try {
      pc = new RTCPeerConnection();
    } catch (error) {
      throw new Error('Failed to create PeerConnection.');
    }

    pc.onicecandidate = function () {
      try {
        pc.setLocalDescription(localDescription);
      } catch (err) {
        throw new Error('Could not set local description.');
      }
      if (undefined !== peerConnection
          && 'function' === typeof peerConnection.onICETricklingComplete) {
        peerConnection.onICETricklingComplete();
      }

    };

    pc.addStream(localStream);
    pc.onaddstream = function (event) {
      if ('function' === typeof peerConnection.onRemoteStream) {
        peerConnection.onRemoteStream(event.remoteStream);
      }
    }

    peerConnection = {
      addStream: addStream,
      onRemoteStream: null,
      setLocalDescription: setLocalDescription,
      setRemoteDescription: setRemoteDescription,
      createAnswer: createAnswer,
      onICETricklingComplete: null,
      onError : null
    };

    return peerConnection;
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createPeerConnection');
  }

  ATT.private.factories.createPeerConnection = createPeerConnection;

}());


