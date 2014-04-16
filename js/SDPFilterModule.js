/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//todo this module does not need tobe exposed
if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";

  function removeSDPAttribute(attributeValue, sdp) {
    //remove attribute from the middle.
    var attribute = "a=" + attributeValue + "\r\n",
      index = sdp.indexOf(attribute),
      prefix,
      rest;

    if (index > 0) {
      prefix = sdp.substr(0, index);
      rest = sdp.substr(index + attribute.length);
      sdp = prefix + rest;
    }
    return sdp;
  }

  function modifySDPAttribute(originalValue, newValue, sdp) {
    var index = 0,
      attribute = "a=" + originalValue + "\r\n",
      prefix,
      rest;

    while (index > -1) {
      index = sdp.indexOf(attribute, index);

      if (index > 0) {
        prefix = sdp.substr(0, index);
        rest = sdp.substr(index + attribute.length);
        sdp = prefix + 'a=' + newValue + '\n' + rest;
      }
    }
    return sdp;
  }

  /**
     * Function to remove crypto & BUNDLE from the SDP.
     * @param {String} sdp
     * @returns {*|sdp}
  */
  function fixSDP(description) {
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
    sdp = removeSDPAttribute("group:BUNDLE audio video", sdp);
    sdp = removeSDPAttribute("group:BUNDLE audio", sdp);

    sdp = sdp.replace(/a=mid:video\r\n/g, "");
    sdp = sdp.replace(/a=mid:audio\r\n/g, "");

    // Remove Opus from Chrome and Leif
    sdp = sdp.replace("RTP/SAVPF 111 103 104 0 ", "RTP/SAVPF 0 ");
    sdp = sdp.replace("\r\na=rtpmap:111 opus/48000/2", "");
    sdp = sdp.replace("\r\na=rtpmap:103 ISAC/16000", "");
    sdp = sdp.replace("\r\na=rtpmap:104 ISAC/32000", "");
    sdp = sdp.replace("\r\na=fmtp:111 minptime=10", "");

    // set back the fixed sdp string on description
    description.sdp = sdp;

    return description;
  }

  var module = {}, instance, init = function () {
    return {
      processChromeSDPOffer : function (description) {
        return fixSDP(description);
      },
      modifySDPAttribute: function (attributeValue, newValue, sdp) {
        return modifySDPAttribute(attributeValue, newValue, sdp);
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
