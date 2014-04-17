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

    /**
    * Send offer
    * @param {Object} config the peer conn config
    */
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

    /**
    * Send Answer
    * @param {Object} config the peer conn config
    */
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
          headers: {
            'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken()
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

    /**
    * Send Accept Modifications
    * @param {Object} config the peer conn config
    */
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
            'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken(),
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

    /**
    * Send Hold Call
    * @param {Object} config the peer conn config
    */
    sendHoldCall: function (config) {
      // request payload
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
            'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken(),
            'x-calls-action' : 'initiate-call-hold'
          }
        },
        data: data,
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            console.log('Call hold success.');
          } else {
            console.log('CALL HOLD ERROR');
          }
        },
        error: function (err) {
          console.log('CALL HOLD ERROR', err);
        }
      });
    },

    /**
    * Send Resume Call
    * @param {Object} config the peer conn config
    */
    sendResumeCall: function (config) {
      // request payload
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
            'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken(),
            'x-calls-action' : 'initiate-call-resume'
          }
        },
        data: data,
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            console.log('Call resume success.');
            callManager.setCallState(callManager.SessionState.RESUME_CALL);
          } else {
            console.log('CALL RESUME ERROR');
          }
        },
        error: function (err) {
          console.log('CALL RESUME ERROR', err);
        }
      });
    },

    /**
    * Send End Call
    * @param {Object} config the peer conn config
    */
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