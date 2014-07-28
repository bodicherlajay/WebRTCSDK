/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT*/
(function () {
  'use strict';

  function createPeerConnection() {

    function setRemoteDescription() {

    }

    function setLocalDescription(sdp) {

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


