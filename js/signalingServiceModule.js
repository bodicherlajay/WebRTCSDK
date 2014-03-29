/**
 * Created by Alex on 3/24/2014.
 */

var ATT = ATT || {};

(function (app) {
  "use strict";
  
  //Todo:  Move these SDP functions out.
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

  /**
   *  Function to remove crypto & BUNDLE from the SDP.
   * @param {String} sdp
   * @returns {*|sdp}
   */
  function fixSDP(sdp) {
    //Remove the 'crypto' attribute because Chrome is going to remove support for SDES, and only implement DTLS-SRTP
    //We have to ensure that no 'crypto' attribute exists while DTLS is enabled.
    while (sdp.indexOf('crypto:') !== -1) {
      sdp = removeSDPAttribute(sdp.match(/crypto.+/)[0], sdp);
    }

    //Remove the BUNDLE because it does not work with the ERelay. Media must be separated not bundle.
    sdp = removeSDPAttribute("group:BUNDLE audio video", sdp);
    sdp = removeSDPAttribute("group:BUNDLE audio", sdp);

    sdp = sdp.replace(/a=mid:video\r\n/g, "");
    sdp = sdp.replace(/a=mid:audio\r\n/g, "");

    //Remove Opus from Chrome and Leif
    sdp = sdp.replace("RTP/SAVPF 111 103 104 0 ", "RTP/SAVPF 0 ");
    sdp = sdp.replace("\r\na=rtpmap:111 opus/48000/2", "");
    sdp = sdp.replace("\r\na=rtpmap:103 ISAC/16000", "");
    sdp = sdp.replace("\r\na=rtpmap:104 ISAC/32000", "");
    sdp = sdp.replace("\r\na=fmtp:111 minptime=10", "");

    return sdp;
  }

  app.SignalingService = {

    send: function (config) {

      var data = {
        call: {
          calledParty: 'sip:' + config.calledParty + '@icmn.api.att.net',
          sdp: fixSDP(config.sdp)
        }
      };

      ATT.WebRTC.startCall({
        urlParams: [ATT.WebRTC.Session.Id], // pass this to the urlFormatter
        headers: {
          'Authorization': 'Bearer ' + ATT.WebRTC.Session.accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: data,
        success: function (obj) {

          var location = obj.getResponseHeader('Location'),
            xState = obj.getResponseHeader('x-state'),
            headers = {
              location: location,
              xState: xState
            };

          ATT.event.publish('call-initiated', headers);

          // call success callback passed to send.
          if (typeof config.success === 'function') {
            config.success.call(null, headers);
          }
        },
        error: function () {
          if (typeof config.error === 'function') {
            config.error.call(null);
          }
        }
      });
    }
  };
}(ATT || {}));