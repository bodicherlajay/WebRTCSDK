/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, RTCPeerConnection*/
(function () {
  'use strict';

  function createPeerConnection() {

    var pc,
      sdpFilter;

    function addStream() {

    }

    function setRemoteDescription(sdp) {
      pc.setRemoteDescription(sdp);
    }

    function setLocalDescription(sdp) {
      pc.setLocalDescription(sdp);

    }

//    sdpFilter = ATT.sdpFilter.getInstance();

    try {
      pc = new RTCPeerConnection();
    } catch (error) {
      throw new Error('Failed to create PeerConnection.');
    }

    pc.onicecandidate = function () {
//      try {
//        sdpFilter.processChromeSDPOffer(pc.localDescription);
//      } catch (err) {
////        options.onError(new Error('Could not process Chrome offer SDP.'));
//      }
//
//      options.onICETricklingComplete();
//      options.onError(new Error('Could not set local description.'));
    };

    return {
      addStream: addStream,
      setLocalDescription: setLocalDescription,
      setRemoteDescription: setRemoteDescription,
      onICETricklingComplete: null,
      onError : null
    };
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createPeerConnection');
  }

  ATT.private.factories.createPeerConnection = createPeerConnection;

}());


