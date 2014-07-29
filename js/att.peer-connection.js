/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, RTCPeerConnection*/
(function () {
  'use strict';

  function createPeerConnection(options) {

    var pc;

    function setRemoteDescription() {

    }

    function setLocalDescription(sdp) {

    }

    if (undefined === options) {
      throw new Error('Invalid options.');
    }
    if ('function' !== typeof options.onPCReady) {
      throw new Error('Invalid `onPCReady` callback.');
    }
    if ('function' !== typeof options.onError) {
      throw new Error('Invalid `onError` callback.');
    }

    try {
      pc = new RTCPeerConnection();

      options.onPCReady();
    } catch (error) {
      options.onError(new Error('Failed to create PeerConnection.'));
    }

    return {
      setLocalDescription: setLocalDescription,
      setRemoteDescription: setRemoteDescription
    };
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createPeerConnection');
  }

  ATT.private.factories.createPeerConnection = createPeerConnection;

}());


