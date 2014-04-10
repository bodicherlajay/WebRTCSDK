/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env: true, cmgmt: true*/

if (!ATT) {
  var ATT = {};
}

(function (app) {
  "use strict";

  var apiObject,
    resourceManager = Env.resourceManager.getInstance(),
    callManager = cmgmt.CallManager.getInstance();

  apiObject = resourceManager.getAPIObject();
  app.SignalingService = {

    sendOffer : function (config) {

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
        apiParameters: {
          url: [callManager.getSessionContext().getSessionId()]
        },
        headers : {
          'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken()
        },
        data : data,
        success : function (obj) {
          console.log('offer sent successfully');

          var location = obj.getResponseHeader('Location'), xState = obj.getResponseHeader('x-state'), headers = {
            location : location,
            xState : xState
          };

          if (typeof config.success === 'function') {
            config.success.call(null, headers);
          }
        },
        error : function (err) {
          console.error(err.message);

          if (typeof config.error === 'function') {
            config.error.call(null);
          }
        }
      });
    },

    sendAnswer : function (config) {

      // fix description just before sending
      var description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
      // call data
        data = {
          callsMediaModifications : {
            sdp : description.sdp
          }
        };

      apiObject.answerCall({
        apiParameters: {
          url: [callManager.getSessionContext().getSessionId(), callManager.getSessionContext().getEventObject().resourceURL.split('/')[6]]
        },
        headers : {
          'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken(),
          'x-calls-action' : 'call-answer'
        },
        data : data,
        success : function (obj) {
          console.log('answer sent successfully');

          var location = obj.getResponseHeader('Location'), xState = obj.getResponseHeader('x-state'), headers = {
            location : location,
            xState : xState
          };

          if (typeof config.success === 'function') {
            config.success.call(null, headers);
          }
        },
        error : function (err) {
          console.error(err.message);

          if (typeof config.error === 'function') {
            config.error.call(null);
          }
        }
      });
    },

    // end call
    // HTTP request to terminate call
    endCall: function() {
      apiObject.endCall({
        apiParameters: {
          url: [ callManager.getSessionContext().getSessionId(),
            callManager.getSesionContext().getCurrentCallId ]
        },
        headers: {
          'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken()
        },
        success: function (response) {
          if (response.getResponseStatus === 204) {
            console.log('Call termination success.');
          } else {
            console.log('CALL TERMINATION ERROR');
          }
        },
        error: function (err) {
          console.log('CALL TERMINATION ERROR', err);
        }
      });
    }
  };
}(ATT || {}));
