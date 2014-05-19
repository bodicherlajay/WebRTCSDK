/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//todo this module does not need to be exposed
if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';

  var module = {}, instance, init, logMgr = ATT.logManager.getInstance(), logger = null;
  logger = logMgr.getLogger('SDPFilterModule', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);

  /**
  * Remote an attribute from SDP
  * @param {String} attributeValue
  * @param {Object} sdp
  * returns {Object} sdp
  */
  function removeSDPAttribute(attributeValue, sdp) {
    logger.logTrace('removing sdp attribute');
    logger.logTrace('attribute', attributeValue);
    logger.logTrace('sdp', sdp);
    //remove attribute from the middle.
    var attribute = 'a=' + attributeValue + '\r\n',
      index = sdp.indexOf(attribute),
      prefix,
      rest;

    if (index > 0) {
      prefix = sdp.substr(0, index);
      rest = sdp.substr(index + attribute.length);
      sdp = prefix + rest;
    }
    logger.logTrace('modified sdp', sdp);
    return sdp;
  }

  /**
  *
  * Modify and SDP attribute
  * @param {String} originalValue
  * @param {String} newValue
  * @param {Object} sdp
  * @returns {Object} sdp
  */
  // function modifySDPAttribute(originalValue, newValue, sdp) {
  //   logger.logTrace('modifySDPAttribute');
  //   logger.logTrace('original value', originalValue);
  //   logger.logTrace('new value', newValue);
  //   logger.logTrace('sdp', sdp);
  //   var index = 0,
  //     attribute = 'a=' + originalValue + '\r\n',
  //     prefix,
  //     rest;

  //   while (index > -1) {
  //     index = sdp.indexOf(attribute, index);

  //     if (index > 0) {
  //       prefix = sdp.substr(0, index);
  //       rest = sdp.substr(index + attribute.length);
  //       sdp = prefix + 'a=' + newValue + '\n' + rest;
  //     }
  //   }
  //   logger.logTrace('modified sdp', sdp);
  //   return sdp;
  // }

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
   * Function to remove crypto & BUNDLE from the SDP.
   * @param {String} sdp
   * @returns {*|sdp}
  */
  function fixSDP(description) {
    logger.logTrace('fixSDP', description.sdp);
    var sdp = description.sdp,
      cryptoMatch;

    if (!sdp) {
      return description;
    }

    // Remove the 'crypto' attribute because Chrome is going to remove support for SDES, and only implement DTLS-SRTP
    // We have to ensure that no 'crypto' attribute exists while DTLS is enabled.
    cryptoMatch = sdp.match(new RegExp('crypto.+'));
    while (cryptoMatch && cryptoMatch.length > 0) {
      sdp = removeSDPAttribute(cryptoMatch[0], sdp);
      cryptoMatch = sdp.match(new RegExp('crypto.+'));
    }

    // Remove the BUNDLE because it does not work with the ERelay. Media must be separated not bundle.
    sdp = removeSDPAttribute('group:BUNDLE audio video', sdp);
    sdp = removeSDPAttribute('group:BUNDLE audio', sdp);

    sdp = sdp.replace(/a=mid:video\r\n/g, '');
    sdp = sdp.replace(/a=mid:audio\r\n/g, '');

    sdp = sdp.replace(/a=rtcp-mux\r\n/g, '');

    // Remove Opus from Chrome and Leif
    sdp = sdp.replace('RTP/SAVPF 111 103 104 0 ', 'RTP/SAVPF 0 ');
    sdp = sdp.replace('\r\na=rtpmap:111 opus/48000/2', '');
    sdp = sdp.replace('\r\na=rtpmap:103 ISAC/16000', '');
    sdp = sdp.replace('\r\na=rtpmap:104 ISAC/32000', '');
    sdp = sdp.replace('\r\na=fmtp:111 minptime=10', '');

    // set back the fixed sdp string on description
    description.sdp = sdp;

    logger.logTrace('fixed sdp', sdp);
    return description;
  }

  init = function () {
    return {
      processChromeSDPOffer : function (description) {
        return fixSDP(description);
      },
      incrementSDP: function (sdp, modCount) {
        return incrementSDP(sdp, modCount);
      },
      removeSDPAttribute : function (attributeValue, sdp) {
        return removeSDPAttribute(attributeValue, sdp);
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