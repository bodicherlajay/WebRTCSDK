/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env: true*/

if (!ATT) {
  var ATT = {};
}

(function (app) {
  "use strict";

  var apiObject,
    resourceManager = Env.resourceManager.getInstance();

  // configure the resource manager (add api methods to ATT namespace)
  apiObject = resourceManager.getAPIObject();

  app.SignalingService = {

    send : function (config) {

      // fix description just before sending
      var description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
        // call data
        data = {
          call : {
            calledParty : 'sip:' + config.calledParty + '@icmn.api.att.net',
            sdp : description.sdp
          }
        };

      apiObject.startCall({
        urlParams : [apiObject.Session.Id], // pass this to the urlFormatter
        headers : {
          'Authorization' : 'Bearer ' + apiObject.Session.accessToken
        },
        data : data,
        success : function (obj) {

          var location = obj.getResponseHeader('Location'), xState = obj.getResponseHeader('x-state'), headers = {
            location : location,
            xState : xState
          };

          // move later. used for hangup()
          apiObject.Calls = {};
          apiObject.Calls.Id = location.split('/')[8];

          // call success callback passed to send.
          if (typeof config.success === 'function') {
            config.success.call(null, headers);
          }
        },
        error : function () {
          if (typeof config.error === 'function') {
            config.error.call(null);
          }
        }
      });
    }
  };
}(ATT || {}));
