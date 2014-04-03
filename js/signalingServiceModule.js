/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true*/
/**
 * Created by Alex on 3/24/2014.
 */

if (!ATT) {
  var ATT = {};
}
//var ATT = ATT || {};

(function (app) {
  "use strict";

  app.SignalingService = {

    send: function (config) {
      var data = {
        call: {
          calledParty: 'sip:' + config.calledParty + '@icmn.api.att.net',
          sdp: ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp)
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