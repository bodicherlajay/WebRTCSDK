/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true*/

if (!ATT) {
  var ATT = {};
}( function(app) {"use strict";

    app.SignalingService = {

      send : function(config) {

        // fix description just before sending
        var description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
        // call data
        data = {
          call : {
            calledParty : 'sip:' + config.calledParty + '@icmn.api.att.net',
            sdp : description.sdp
          }
        };

        ATT.WebRTC.startCall({
          urlParams : [ATT.WebRTC.Session.Id], // pass this to the urlFormatter
          headers : {
            'Authorization' : 'Bearer ' + ATT.WebRTC.Session.accessToken
          },
          data : data,
          success : function(obj) {

            var location = obj.getResponseHeader('Location'), xState = obj.getResponseHeader('x-state'), headers = {
              location : location,
              xState : xState
            };

            ATT.event.publish('call-initiated', headers);

            // call success callback passed to send.
            if ( typeof config.success === 'function') {
              config.success.call(null, headers);
            }
          },
          error : function() {
            if ( typeof config.error === 'function') {
              config.error.call(null);
            }
          }
        });
      }
    };
  }(ATT || {}));
