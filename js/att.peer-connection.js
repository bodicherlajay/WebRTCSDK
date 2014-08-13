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
//      var fixedSDP;
      //description is the new SDP Which needs to processed
//      try {
//        logger.logInfo('Fixing the SDP');
//        logger.logTrace(description);
//        fixedSDP = sdpFilter.processChromeSDPOffer(description);
//        logger.logTrace(fixedSDP);
//      } catch (err) {
//        logger.logError('processChromeSDPOffer: error');
//        logger.logTrace(err);
//        throw new Error('Could not process Chrome offer SDP.');
//      }

      //We have to ensure that no 'crypto' attribute exists while DTLS is enabled.
      while (description.sdp.indexOf('crypto:') != -1) {
        description.sdp = sdpFilter.removeSDPAttribute(sdp.sdp.match(/crypto.+/)[0], description.sdp);
      }

      pc.setLocalDescription(description, function () {
        if (undefined !== success && 'function' === typeof success) {
          success(description);
        }
      }, function (error) { // ERROR setLocal
        logger.logError('setLocalDescription: error');
        logger.logTrace(error);
        throw new Error('Could not set the localDescription.');
      });
    }

    function createSdpOffer() {
      pc.createOffer(function (description) {
        var filter = ATT.sdpFilter.getInstance();
        logger.logInfo('createOffer: success');

        //Remove the 'crypto' attribute because Chrome is going to remove support for SDES, and only implement DTLS-SRTP
        //We have to ensure that no 'crypto' attribute exists while DTLS is enabled.
        while (description.sdp.indexOf('crypto:') != -1) {
            description.sdp = filter.removeSDPAttribute(sdp.sdp.match(/crypto.+/)[0], description.sdp);
        }

        pc.setLocalDescription(description, function () {
          logger.logInfo('setLocalDescription: success');
        }, function (error) {
          logger.logError('setLocalDescription: error');
          logger.logTrace(error);
        });
      }, function (error) { // ERROR createOffer
        logger.logError('createOffer: error');
        logger.logTrace(error);
        throw new Error('Failed to create offer.');
      }, {
        mandatory: mediaConstraint
      });
    }

    function acceptSdpOffer(options) {
      try {
        pc.setRemoteDescription(new RTCSessionDescription({
          sdp: options.remoteSdp,
          type: 'offer'
        }), function () {
          logger.logInfo('setRemoteDescription: success');
          try {
            pc.createAnswer(function (description) {// SUCCESS
              logger.logInfo('createAnswer: success');
              processDescription(description, options.onSuccess);
            }, function (error) {// ERROR createAnswer
              logger.logError('createAnswer: error');
              logger.logTrace(error);
              throw new Error('Failed to create answer.');
            }, {
              mandatory: mediaConstraint
            });
          } catch (err) {
            throw err;
          }
        }, function (error) {
          logger.logError('setRemoteDescription: error');
          logger.logTrace(error);
        });
      } catch (err) {
        throw err;
      }
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

    pc.onicecandidate = function (event) {
      if (event.candidate) {
        logger.logInfo('Candidate: ' + event.candidate);
      } else {
        logger.logInfo('End of candidates');
        //TODO for Audio only call change video port to ZERO
        onSuccess(pc.localDescription);
      }
    };

    if (null === options.remoteSdp) {

      createSdpOffer();

    } else {
      acceptSdpOffer({
        remoteSdp: options.remoteSdp
      });
    }
    return {
      getLocalDescription: function () {
        return pc.localDescription;
      },
      setRemoteDescription: function (description) {
        pc.setRemoteDescription(new RTCSessionDescription(description), function () {
          logger.logInfo('setRemoteDescription: success');
        }, function (error) {
          logger.logError('setRemoteDescription: error');
          logger.logTrace(error);
        });
      },
      acceptSdpOffer: acceptSdpOffer,
      getRemoteDescription: function () {
        return pc.remoteDescription;
      },
      close: function () {
        pc.close();
        pc = null;
      }
    };
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createPeerConnection');
  }

  ATT.private.factories.createPeerConnection = createPeerConnection;

}());


