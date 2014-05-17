/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env: true, cmgmt: true*/

/*
if (!ATT) {
  var ATT = {};
}

*/
//Dependency: Env.resourceManager, cmgmt.CallManager

(function (app) {
  'use strict';

  var logMgr = ATT.logManager.getInstance(), logger = null, resourceManager, callManager;
  logMgr.configureLogger('SignalingService', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);
  logger = logMgr.getLogger('SignalingService');

  resourceManager = Env.resourceManager.getInstance();
  callManager = cmgmt.CallManager.getInstance();

  app.SignalingService = {
    /**
    * Send offer
    * @param {Object} config the peer conn config
    */
    sendOffer: function (config) {
      logger.logTrace('sendOffer');

      // fix description just before sending
      logger.logDebug(config.sdp);

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
          logger.logInfo('offer sent successfully');

          var headers = {
            location : obj.getResponseHeader('Location'),
            xState : obj.getResponseHeader('x-state')
          };

          config.success.call(null, headers);
        },
        error: config.error.bind(this, config)
      });
    },

    /**
    * Send Answer
    * @param {Object} config the peer conn config
    */
    sendAnswer: function (config) {
      // fix description just before sending
      logger.logTrace('sendAnswer, pre-processing SDP', config.sdp);
      var description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
      // call data
        data = {
          callsMediaModifications : {
            sdp : description.sdp
          }
        };

      logger.logTrace('answerCall');
      resourceManager.doOperation('answerCall', {
        params: {
          url: [
            callManager.getSessionContext().getSessionId(),
            callManager.getSessionContext().getEventObject().resourceURL.split('/')[6]
          ],
          headers: {
            'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken()
          }
        },
        data : data,
        success : function (obj) {
          logger.logInfo('answer sent successfully');

          var headers = {
            location : obj.getResponseHeader('Location'),
            xState : obj.getResponseHeader('x-state')
          };

          if (typeof config.success === 'function') {
            config.success.call(null, headers);
          }
        },
        error : function (err) {
          logger.logError(err.message);

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
      logger.logTrace('sendAcceptMods, pre-processing sdp', config.sdp);
      var description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
      // call data
        data = {
          callsMediaModifications : {
            sdp : description.sdp
          }
        };

      logger.logTrace('doOperation, acceptModifications');
      resourceManager.doOperation('acceptModifications', {
        params: {
          url: [
            callManager.getSessionContext().getSessionId(),
            callManager.getSessionContext().getEventObject().resourceURL.split('/')[6]
          ],
          headers : {
            'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken(),
            'x-modId' : config.modId
          }
        },
        data : data,
        success : function (obj) {
          console.log('accepted modifications successfully');

          var headers = {
              location : obj.getResponseHeader('Location'),
              xState : obj.getResponseHeader('x-state')
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
    * @param {Object} config The peer conn config
    */
    sendHoldCall: function (config) {
      // request payload
      logger.logTrace('sendHoldCall');
      var data = {
        callsMediaModifications : {
          sdp : config.sdp
        }
      };
      logger.logTrace('doOperation: modifyCall');
      resourceManager.doOperation('modifyCall', {
        params: {
          url: [
            callManager.getSessionContext().getSessionId(),
            callManager.getSessionContext().getCurrentCallId()
          ],
          headers: {
            'Authorization' : 'Bearer ' + callManager.getSessionContext().getAccessToken(),
            'x-calls-action' : 'initiate-call-hold'
          }
        },
        data: data,
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            logger.logTrace('Hold request sent...');
            config.success();
          } else {
            if (typeof config.error === 'function') {
              config.error();
            }
          }
        },
        error: function (err) {
          logger.logError('CALL HOLD ERROR', err);
          if (typeof config.error === 'function') {
            config.error();
          }
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
      logger.logTrace('sendResumeCall, doOperation: modifyCall');
      resourceManager.doOperation('modifyCall', {
        params: {
          url: [
            callManager.getSessionContext().getSessionId(),
            callManager.getSessionContext().getCurrentCallId()
          ],
          headers: {
            'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken(),
            'x-calls-action' : 'initiate-call-resume'
          }
        },
        data: data,
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            logger.logTrace('Resume request sent...');
            config.success();   // testability
          } else {
            logger.logError('CALL RESUME ERROR, status', response.getResponseStatus());
            if (typeof config.error === 'function') {
              config.error();
            }
          }
        },
        error: function (err) {
          logger.logError('CALL RESUME ERROR', err);
          if (typeof config.error === 'function') {
            config.error();
          }
        }
      });
    },

    /**
    * Send End Call
    * @param {Object} config the peer conn config
    */
    sendEndCall: function (config) {
      config = config || {};

      logger.logTrace('ending call');
      resourceManager.doOperation('endCall', {
        params: {
          url: [
            callManager.getSessionContext().getSessionId(),
            callManager.getSessionContext().getCurrentCallId()
          ],
          headers: {
            'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken()
          }
        },
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            logger.logTrace('Call termination success.');
            if (typeof config.success === 'function') {
              config.success();
            }
          } else {
            logger.logError('CALL TERMINATION ERROR, status:', response.getResponseStatus());
            if (typeof config.error === 'function') {
              config.error();
            }
          }
        },
        error: function (err) {
          logger.logError('CALL TERMINATION ERROR', err);
          if (typeof config.error === 'function') {
            config.error();
          }
        }
      });
    }
  };
}(ATT || {}));
