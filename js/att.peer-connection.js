/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, RTCPeerConnection, RTCSessionDescription*/
(function () {
  'use strict';
  var logManager = ATT.logManager.getInstance();

  function createPeerConnection(options) {

    var peerConnection,
      pc,
      localDescription,
      sdpFilter = ATT.sdpFilter.getInstance(),
      onSuccess,
      onError,
      mediaConstraint,
      logger = logManager.addLoggerForModule('PeerConnection'),
      pcConfig = {
        'iceServers': [
          { 'url': 'STUN:74.125.133.127:19302' }
        ]
      };

    function processDescription(description, success) {
      var fixedSDP;
      //description is the new SDP Which needs to processed
      try {
        logger.logInfo('Fixing the SDP');
        fixedSDP = sdpFilter.processChromeSDPOffer(description);
      } catch (err) {
        logger.logTrace(err);
        throw new Error('Could not process Chrome offer SDP.');
      }
      pc.setLocalDescription(fixedSDP, function () {
        success(fixedSDP);
      }, function (error) { // ERROR setLocal
        logger.logError('setLocalDescription: error');
        logger.logTrace(error);
        throw new Error('Could not set the localDescription.');
      });
    }

    logger.setLevel(logManager.logLevel.DEBUG);

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
      pc = new RTCPeerConnection(pcConfig);
    } catch (error) {
      throw new Error('Failed to create PeerConnection.');
    }

    pc.addStream(options.stream);
    pc.onaddstream = function (event) {
      if ('function' === typeof options.onRemoteStream) {
        options.onRemoteStream(event.stream);
      }
    };

    if (undefined === options.remoteSdp) {

      pc.onicecandidate = function (event) {
        if (event.candidate) {
          logger.logInfo('Candidate: ' + event.candidate);
          console.log(event.candidate);
        } else {
          logger.logInfo('End of candidates');
          processDescription(pc.localDescription, onSuccess);
        }
      };

      pc.createOffer(function (description) {
        logger.logInfo('createOffer: success');
        pc.setLocalDescription(description, function () {
          logger.logInfo('setLocalDescription: success');
        }, function (error) {
          logger.logError('setLocalDescription: error');
          logger.logTrace(error);
        });
      }, function () { // ERROR createOffer
        logger.logInfo('createOffer: success');
        throw new Error('Failed to create offer.');
      }, {mandatory: mediaConstraint});

    } else if (undefined !== options.remoteSdp){
      pc.setRemoteDescription(new RTCSessionDescription({
        sdp:options.remoteSdp,
        type: 'offer'
      }), function () {
        pc.createAnswer(function (description) {// SUCCESS
          processDescription(description, onSuccess);
        }, function () {// ERROR createAnswer
          throw new Error('Failed to create answer.');
        }, { mandatory: mediaConstraint});
      }, function () {

      });
    }
    return {
      getLocalDescription: function () {
        return pc.localDescription;
      },
      setRemoteDescription: function (description) {
        logger.logInfo(description.sdp);
        pc.setRemoteDescription(new RTCSessionDescription(description), function () {
          logger.logInfo('setRemoteDescription: Remote Description set.');
        }, function (error) {
          logger.logError(error);
        });
      },
      getRemoteDescription: function () {
        return pc.remoteDescription;
      }
    };
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createPeerConnection');
  }

  ATT.private.factories.createPeerConnection = createPeerConnection;

}());


