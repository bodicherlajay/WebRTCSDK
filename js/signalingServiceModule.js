/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env: true, cmgmt: true*/

if (!ATT) {
  var ATT = {};
}

(function (app) {
  "use strict";

  var resourceManager = Env.resourceManager.getInstance(),
    callManager = cmgmt.CallManager.getInstance();

  app.SignalingService = {

    sendOffer: function (config) {

      // fix description just before sending
      var description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
        // call data
        data = {
          call : {
            calledParty : 'sip:' + config.calledParty + '@icmn.api.att.net',
            sdp : description.sdp
          }
        };

      resourceManager.doOperation('startCall', {
        params: {
          url: [callManager.getSessionContext().getSessionId()],
          headers: {
            'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken()
          }
        },
        data: data,
        success: function (obj) {
          console.log('offer sent successfully');

          var location = obj.getResponseHeader('Location'), xState = obj.getResponseHeader('x-state'), headers = {
            location : location,
            xState : xState
          };

          if (typeof config.success === 'function') {
            config.success.call(null, headers);
          }
        }
      });
    },

    sendAnswer: function (config) {

      // fix description just before sending
      var description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
      // call data
        data = {
          callsMediaModifications : {
            sdp : description.sdp
          }
        };

      resourceManager.doOperation('answerCall', {
        params: {
          url: [callManager.getSessionContext().getSessionId(), callManager.getSessionContext().getEventObject().resourceURL.split('/')[6]],
          headers : {
            'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken(),
            'x-calls-action' : 'call-answer'
          }
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

    // accept modifications
    sendAcceptMods: function (config) {
      // fix description just before sending
      var description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
      // call data
        data = {
          callsMediaModifications : {
            sdp : description.sdp
          }
        };

      resourceManager.doOperation('acceptModifications', {
        params: {
          url: [callManager.getSessionContext().getSessionId(), callManager.getSessionContext().getEventObject().resourceURL.split('/')[6]],
          headers : {
            'x-calls-action' : 'accept-call-mod',
            'x-modId' : config.modId
          }
        },
        data : data,
        success : function (obj) {
          console.log('accepted modifications successfully');

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
    // hold call
    // HTTP request to put a call on hold
    sendHoldCall: function (config) {
      // call data
      var data = {
        callsMediaModifications : {
          sdp : config.sdp
        }
      };
      resourceManager.doOperation('modifyCall', {
        params: {
          url: [ callManager.getSessionContext().getSessionId(),
            callManager.getSessionContext().getCurrentCallId() ],
          headers: {
            'x-calls-action' : "initiate-call-hold",
            'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken()
          }
        },
        data: data,
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            console.log('Call termination success.');
            callManager.setCallState(callManager.SessionState.HOLD_CALL);
          } else {
            console.log('CALL TERMINATION ERROR');
          }
        },
        error: function (err) {
          console.log('CALL TERMINATION ERROR', err);
        }
      });
    },
    //resume call
    //HTTP request to resume a call on hold
    sendResumeCall: function () {
      resourceManager.doOperation('modifyCall', {
        params: {
          url: [ callManager.getSessionContext().getSessionId(),
            callManager.getSessionContext().getCurrentCallId() ],
          headers: {
            'x-calls-action' : "initiate-call-resume",
            'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken()
          }
        },
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            console.log('Call termination success.');
          } else {
            console.log('CALL TERMINATION ERROR');
          }
        },
        error: function (err) {
          console.log('CALL TERMINATION ERROR', err);
        }
      });
    },
    // end call
    // HTTP request to terminate call
    sendEndCall: function () {
      resourceManager.doOperation('endCall', {
        params: {
          url: [ callManager.getSessionContext().getSessionId(),
            callManager.getSessionContext().getCurrentCallId() ],
          headers: {
            'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken()
          }
        },
        success: function (response) {
          if (response.getResponseStatus() === 204) {
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