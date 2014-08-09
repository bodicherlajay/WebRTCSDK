/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//todo this module does not need to be exposed
if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';

  var module = {},
    instance,
    init,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logger = logMgr.getLoggerByName('SDPFilterModule');

  /**
  * Remove video from sdp
  * @param {String} sdp
  * returns {String} sdp
  */
  function removeVideoMediaPartFromSdp(sdp) {
      var indexof = sdp.indexOf("m=video");
      if (indexof > 0) {
          sdp = sdp.substr(0, indexof);
      }
      return sdp;
  };

  /**
  * Change video port to 0 in sdp
  * @param {String} sdp
  * returns {String} sdp
  */
  function changeVideoPortToZero(sdp) {
      var nth = 0;
      var replaced = sdp.replace(/m=video(.+)RTP/g, function (match, i, original) {
          nth++;
          return (nth === 1) ? "m=video 0 RTP" : match;
      });

      nth = 0;
      var replaced = replaced.replace(/a=rtcp:(.+)IN/g, function (match, i, original) {
          nth++;
          return (nth === 2) ? "a=rtcp:0 IN" : match;
      });

      return replaced;
  };

  /**
  * Remote an attribute from SDP
  * @param {String} attributeValue
  * @param {String} sdp
  * returns {String} sdp
  */
  function removeSDPAttribute(attributeValue, sdp) {
      //remove attribute from the middle.
      var attribute = "a=" + attributeValue + "\r\n"
      var index = sdp.indexOf(attribute);
      if (index > 0) {
          sdp = sdp.replace(attribute, "");
      }
      return sdp;
  };

  /**
  * Modify SDP
  * @param {String} sdp
  * @param {String} oldString
  * @param {String} newString
  * returns {String} sdp
  */
  function updateSdp(sdp, oldString, newString) {
      var regex = new RegExp(oldString, 'g');
      sdp = sdp.replace(regex, newString);
      return sdp;
  };

  /**
  * Function to increment SDP
  * @param {Object} sdp The SDP
  * @param {Number} count The increment
  * @returns {Object} sdp
  */
  function incrementSDP(sdp, count) {
    logger.logTrace('increment sdp', sdp);
    logger.logTrace('increment count', count);

    var oIndex = sdp.sdp.indexOf('o='),
      sIndex = sdp.sdp.indexOf('s=-'),
      oLine = sdp.sdp.slice(oIndex, sIndex),
      oLineArray = oLine.split(' '),
      oLine2 = oLine.replace(' ' + oLineArray[2].toString() + ' ', ' ' + count.toString() + ' ');

    sdp.sdp = sdp.sdp.replace(oLine, oLine2);

    logger.logTrace('modified sdp', sdp);
    return sdp;
  }

  /**
  * Function to get CODEC form SDP
  * @param {Object} sdp The SDP
  * @returns {Object} CODEC
  */
  function getCodecfromSDP(event_sdp) {
    var CODEC = [], idx, media, sdp = ATT.sdpParser.getInstance().parse(event_sdp);
    logger.logDebug('Parsed SDP ' + sdp);
    for (idx = 0; idx < sdp.media.length; idx = idx + 1) {
      media = {
        rtp: sdp.media[idx].rtp,
        type: sdp.media[idx].type
      };
      CODEC.push(media);
    }
    return CODEC;
  }

  /**
   * Function to remove mid & bundle lines from the SDP.
   * @param {String} sdp
   * @returns {*|sdp}
  */
  function jslWorkarounds(sdp) {
      // Remove mid lines
      sdp = sdp.replace(/a=mid:video\r\n/g, "");
      sdp = sdp.replace(/a=mid:audio\r\n/g, "");

      // Remove bundle lines
      sdp = sdp.replace(/a=group:BUNDLE audio video\r\n/g, "");
      sdp = sdp.replace(/a=group:BUNDLE audio\r\n/g, "");

      return sdp;
  };

  function setupActivePassive(description) {
    //FOR CHROME 31: If receiving a call (initial is true), we need to modify the SDP
    //Setup must be set to actpass for the answer to be made correctly
    if (description['sdp'].indexOf('setup:passive') != -1)
      description['sdp'] = description['sdp'].replace('setup:passive', 'setup:actpass');
    else if (description['sdp'].indexOf('setup:active') != -1)
      description['sdp'] = description['sdp'].replace('setup:active', 'setup:actpass');

    return description;
  }
  /**
   * Function to Opus from SDP generated by Firefox, Chrome and Leif.
   * @param {String} sdp
   * @returns {*|sdp}
  */
  function removeCodec(sdp) {
      if (navigator.mozGetUserMedia) {
          //Remove Opus from Firefox
          sdp = sdp.replace("RTP/SAVPF 109 0", "RTP/SAVPF 0");
          sdp = sdp.replace("\r\na=rtpmap:109 opus/48000/2", "");
      } else {
          //Remove Opus from Chrome and Leif
          sdp = sdp.replace("RTP/SAVPF 111 103 104 0 ", "RTP/SAVPF 0 ");
          sdp = sdp.replace("\r\na=rtpmap:111 opus/48000/2", "");
          sdp = sdp.replace("\r\na=rtpmap:103 ISAC/16000", "");
          sdp = sdp.replace("\r\na=rtpmap:104 ISAC/32000", "");
          sdp = sdp.replace("\r\na=fmtp:111 minptime=10", "");
      }
      return sdp;
  };

  init = function () {
    return {
      processChromeSDPOffer : function (description) {
          description.sdp = jslWorkarounds(description.sdp);
          description.sdp = removeCodec(description.sdp);
          logger.logTrace('fixed sdp', description.sdp);
          return description;
      },
      incrementSDP: function (sdp, modCount) {
        return incrementSDP(sdp, modCount);
      },
      removeSDPAttribute : function (attributeValue, sdp) {
        return removeSDPAttribute(attributeValue, sdp);
      },
      getCodecfromSDP : function (sdp) {
        return getCodecfromSDP(sdp);
      },
      replaceSendOnlyWithSendRecv: function (sdp) {
        // TODO: DON'T KNOW WHY, BUT THIS IS NEEDED
        return sdp.replace(/sendonly/g, 'sendrecv');
      }
    };
  };

  mainModule.sdpFilter = module;
  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

}(ATT || {}));