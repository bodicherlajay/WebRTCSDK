/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, RTCPeerConnection, RTCSessionDescription*/
(function () {
  'use strict';
  var logManager = ATT.logManager.getInstance();

  function createPeerConnection(options) {

    var pc,
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

    logger.setLevel(logManager.logLevel.TRACE);

    function processDescription(description, success) {
      var fixedSDP;
      //description is the new SDP Which needs to processed
      try {
        logger.logInfo('Fixing the SDP');
        logger.logTrace(description);
        fixedSDP = sdpFilter.processChromeSDPOffer(description);
        logger.logTrace(fixedSDP);
      } catch (err) {
        logger.logError('processChromeSDPOffer: error');
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

    function acceptSdpOffer(remoteSdp, success) {
      pc.setRemoteDescription(new RTCSessionDescription({
        sdp: remoteSdp,
        type: 'offer'
      }), function () {
        pc.createAnswer(function (description) {// SUCCESS
          processDescription(description, success);
        }, function (error) {// ERROR createAnswer
          logger.logError('createAnswer: error');
          logger.logTrace(error);
          throw new Error('Failed to create answer.');
        }, { mandatory: mediaConstraint});
      }, function (error) {
        logger.logError('setRemoteDescription: error');
        logger.logTrace(error);
      });
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
      options.remoteSdp = null;
    }

    if (null === options.remoteSdp) {

      pc.onicecandidate = function (event) {
        if (event.candidate) {
          logger.logInfo('Candidate: ' + event.candidate);
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

    } else {
      acceptSdpOffer(options.remoteSdp, onSuccess);
    }
    return {
      getLocalDescription: function () {
        return pc.localDescription;
      },
      setRemoteDescription: function (options) {
        acceptSdpOffer(options.remoteSdp, options.onSuccess);
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


