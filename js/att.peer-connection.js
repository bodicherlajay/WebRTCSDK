/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, RTCPeerConnection*/
(function () {
  'use strict';

  function createPeerConnection(options) {

    var peerConnection,
      pc,
      localDescription,
      sdpFilter = ATT.sdpFilter.getInstance(),
      onSuccess,
      onError;

    function setRemoteDescription(sdp) {
      pc.setRemoteDescription(sdp);
    }

    if (undefined === options || Object.keys(options).length === 0) {
      throw new Error('No options passed.');
    }
    if (undefined === options.stream) {
      throw new Error('No `stream` passed.');
    }

    if ('function' !== typeof options.onSuccess ) {
      throw new Error('No `onSuccess` callback passed.');
    }
    onSuccess = options.onSuccess;

    if ('function' !== typeof options.onError ) {
      throw new Error('No `onError` callback passed.');
    }
    onError = options.onError;

    try {
      pc = new RTCPeerConnection();
    } catch (error) {
      throw new Error('Failed to create PeerConnection.');
    }

    pc.addStream(options.stream);
    pc.onaddstream = function (event) {
      if ('function' === typeof peerConnection.onRemoteStream) {
        peerConnection.onRemoteStream(event.remoteStream);
      }
    };

    if (undefined === options.remoteSDP) {
      pc.createOffer(function (description) {
        //description is the new SDP Which needs to processed
        var fixedSDP = sdpFilter.processChromeSDPOffer(description);
        pc.setLocalDescription(fixedSDP, function () {
          onSuccess(fixedSDP);
        }, onError);
      }, function () {
        //should be an error
      });
    } else {
      pc.createAnswer(function (description) {
        var fixedSDP = sdpFilter.processChromeSDPOffer(description);
        pc.setLocalDescription(fixedSDP, function () {
          onSuccess(fixedSDP);
        }, onError);
      }, function () {
        return;
      });
    }

    peerConnection = {
      onRemoteStream: null
    };

    return peerConnection;
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createPeerConnection');
  }

  ATT.private.factories.createPeerConnection = createPeerConnection;

}());


