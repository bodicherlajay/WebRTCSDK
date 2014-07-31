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
      onError,
      mediaConstraint;

    function setRemoteDescription(sdp) {
      pc.setRemoteDescription(sdp);
    }

    if (undefined === options || Object.keys(options).length === 0) {
      throw new Error('No options passed.');
    }
    if (undefined === options.stream) {
      throw new Error('No `stream` passed.');
    }

    if (undefined === options.mediaType) {
      throw new Error('No `mediaType` passed.');
    }


    mediaConstraint =  {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': (options.mediaType === 'video')
    };

    if ('function' !== typeof options.onSuccess) {
      throw new Error('No `onSuccess` callback passed.');
    }
    onSuccess = options.onSuccess;

    if ('function' !== typeof options.onRemoteStream) {
      throw new Error('No `onRemoteStream` callback passed.');
    }
    if ('function' !== typeof options.onError) {
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
      if ('function' === typeof options.onRemoteStream) {
        options.onRemoteStream(event.remoteStream);
      }
    };

    if (undefined === options.remoteSDP) {
      pc.createOffer(function (description) {
        var fixedSDP;
        //description is the new SDP Which needs to processed
        try {
          fixedSDP = sdpFilter.processChromeSDPOffer(description);
        } catch (err) {
          throw new Error('Could not process Chrome offer SDP.');
        }
        pc.setLocalDescription(fixedSDP, function () { // SUCCESS
          onSuccess(fixedSDP);
        }, function () { // ERROR
          throw new Error('Could not set the localDescription.');
        });
      }, function () { // ERROR createOffer
        throw new Error('Failed to create offer.');
      }, {mandatory: mediaConstraint});
    } else {
      pc.createAnswer(function (description) {// SUCCESS
        var fixedSDP;
        //description is the new SDP Which needs to processed
        try {
          fixedSDP = sdpFilter.processChromeSDPOffer(description);
        } catch (err) {
          throw new Error('Could not process Chrome offer SDP.');
        }
        pc.setLocalDescription(fixedSDP, function () {
          onSuccess(fixedSDP);
        }, function () { // ERROR setLocal
          throw new Error('Could not set the localDescription.');
        });
      }, function () {// ERROR createAnswer
        throw new Error('Failed to create answer.');
      }, { mandatory: mediaConstraint});
    }
    return {};
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createPeerConnection');
  }

  ATT.private.factories.createPeerConnection = createPeerConnection;

}());


