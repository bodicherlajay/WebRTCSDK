/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, Env: true, cmgmt: true*/

//Dependency: cmgmt.CallManager

(function (app) {
  'use strict';

  var logMgr = ATT.logManager.getInstance(),
    logger = null,
    factories = ATT.private.factories,
    apiConfig = ATT.private.config.api,
    resourceManager = factories.createResourceManager(apiConfig);

  logger = logMgr.getLoggerByName('SignalingService');

  app.SignalingService = {
    /**
     * Send offer
     * @param {Object} config the peer conn config
     */
    sendOffer: function (config) {
      logger.logTrace('sendOffer');

      // fix description just before sending
      logger.logDebug(config.sdp);

      var sessionInfo = config.sessionInfo,
        description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
      // call data
        data = {
          call: {
            calledParty: config.calledParty,
            sdp: description.sdp
          }
        };

      resourceManager.doOperation('startCall', {
        params: {
          url: [sessionInfo.sessionId],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token
          }
        },
        data: data,
        success: function (obj) {
          logger.logInfo('offer sent successfully');

          var responseData = {
            callId: obj.getResponseHeader('Location') ? obj.getResponseHeader('Location').split('/')[6] : null,
            xState: obj.getResponseHeader('x-state')
          };

          config.success.call(null, responseData);
        },
        error: config.error
      });
    },

    /**
     * Send Answer
     * @param {Object} config the peer conn config
     */
    sendAnswer: function (config) {
      // fix description just before sending
      logger.logTrace('sendAnswer, pre-processing SDP', config.sdp);

      var sessionInfo = config.sessionInfo,
        description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
      // call data
        data = {
          callsMediaModifications: {
            sdp: description.sdp
          }
        };

      logger.logTrace('answerCall');
      resourceManager.doOperation('answerCall', {
        params: {
          url: [
            sessionInfo.sessionId,
            sessionInfo.getCurrentCall().id()
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token
          }
        },
        data: data,
        success: function (obj) {
          logger.logInfo('answer sent successfully');

          var headers = {
            location: obj.getResponseHeader('Location'),
            xState: obj.getResponseHeader('x-state')
          };

          if (typeof config.success === 'function') {
            config.success.call(null, headers);
          }
        },
        error: function (err) {
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

      var sessionInfo = config.sessionInfo,
        description = ATT.sdpFilter.getInstance().processChromeSDPOffer(config.sdp),
      // call data
        data = {
          callsMediaModifications: {
            sdp: description.sdp
          }
        };

      logger.logTrace('doOperation, acceptModifications');
      resourceManager.doOperation('acceptModifications', {
        params: {
          url: [
            sessionInfo.sessionId,
            sessionInfo.getCurrentCall().id()
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token,
            'x-modId': config.modId
          }
        },
        data: data,
        success: function (obj) {
          console.log('accepted modifications successfully');

          var headers = {
            location: obj.getResponseHeader('Location'),
            xState: obj.getResponseHeader('x-state')
          };

          if (typeof config.success === 'function') {
            config.success.call(null, headers);
          }
        },
        error: function (err) {
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
      var sessionInfo = config.sessionInfo,
        data = {
          callsMediaModifications: {
            sdp: config.sdp.sdp,
            type: config.sdp.type
          }
        };

      logger.logTrace('doOperation: modifyCall');
      resourceManager.doOperation('modifyCall', {
        params: {
          url: [
            sessionInfo.sessionId,
            sessionInfo.getCurrentCall().id()
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token,
            'x-calls-action': 'initiate-call-hold'
          }
        },
        data: data,
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            logger.logTrace('Hold request sent...');
            if (typeof config.success === 'function') {
              config.success();
            }
          } else {
            if (typeof config.error === 'function') {
              config.error();
            }
          }
        },
        error: function (err) {
          logger.logError('CALL HOLD ERROR', err);
          ATT.Error.publish('SDK-20032', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        },
        ontimeout: function () {
          logger.logError('CALL HOLD ERROR');
          ATT.Error.publish('SDK-20032', null);
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
      var sessionInfo = config.sessionInfo,
        data = {
          callsMediaModifications: {
            sdp: config.sdp.sdp,
            type: config.sdp.type
          }
        };

      logger.logTrace('sendResumeCall, doOperation: modifyCall');
      resourceManager.doOperation('modifyCall', {
        params: {
          url: [
            sessionInfo.sessionId,
            sessionInfo.getCurrentCall().id()
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token,
            'x-calls-action': 'initiate-call-resume'
          }
        },
        data: data,
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            logger.logTrace('Resume request sent...');
            if (typeof config.success === 'function') {
              config.success();   // testability
            }
          } else {
            logger.logError('CALL RESUME ERROR, status', response.getResponseStatus());
            if (typeof config.error === 'function') {
              config.error();
            }
          }
        },
        error: function (err) {
          logger.logError('CALL RESUME ERROR', err);
          ATT.Error.publish('SDK-20033', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        },
        ontimeout: function () {
          logger.logError('CALL RESUME ERROR');
          ATT.Error.publish('SDK-20033', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        }
      });
    },

    /**
     * Send End Call
     * @param {Object} config the UI options
     */
    sendEndCall: function (config) {
      config = config || {};

      var sessionInfo = config.sessionInfo;

      logger.logTrace('ending call');
      resourceManager.doOperation('endCall', {
        params: {
          url: [
            sessionInfo.sessionId,
            sessionInfo.getCurrentCall().id()
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token
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
            ATT.Error.publish('SDK-20026', null);
            if (typeof config.error === 'function') {
              config.error();
            }
          }
        },
        error: function (err) {
          logger.logError('CALL TERMINATION ERROR', err);
          ATT.Error.publish('SDK-20026', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        },
        ontimeout: function (err) {
          logger.logError('CALL TERMINATION ERROR', err);
          ATT.Error.publish('SDK-20026', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        }
      });
    },

    /**
     * Send Cancel Call
     * @param {Object} config The dependencies
     */
    sendCancelCall: function (config) {
      config = config || {};

      var sessionInfo = config.sessionInfo;

      logger.logTrace('canceling call');
      resourceManager.doOperation('cancelCall', {
        params: {
          url: [
            sessionInfo.sessionId,
            sessionInfo.getCurrentCall().id()
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token
          }
        },
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            logger.logTrace('Call termination success.');
            if (typeof config.success === 'function') {
              config.success();
            }
          } else {
            logger.logError('CALL CANCELLATION ERROR, status:', response.getResponseStatus());
            ATT.Error.publish('SDK-20026', null);
            if (typeof config.error === 'function') {
              config.error();
            }
          }
        },
        error: function (err) {
          logger.logError('CALL CANCELLATION ERROR', err);
          ATT.Error.publish('SDK-20034', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        },
        ontimeout: function (err) {
          logger.logError('CALL TERMINATION ERROR', err);
          ATT.Error.publish('SDK-20026', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        }
      });
    },
    /**
     * Send Cancel Call
     * @param {Object} config The dependencies
     */
    sendRejectCall: function (config) {
      config = config || {};

      var sessionInfo = config.sessionInfo;

      logger.logTrace('rejecting call');
      resourceManager.doOperation('rejectCall', {
        params: {
          url: [
            sessionInfo.sessionId,
            sessionInfo.getCurrentCall().id()
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token
          }
        },
        success: function (response) {
          if (response.getResponseStatus() === 204) {
            logger.logTrace('Call rejection success.');
            if (typeof config.success === 'function') {
              config.success();
            }
          } else {
            logger.logError('CALL REJECTION ERROR, status:', response.getResponseStatus());
            ATT.Error.publish('SDK-20026', null);
            if (typeof config.error === 'function') {
              config.error();
            }
          }
        },
        error: function (err) {
          logger.logError('CALL REJECTION ERROR', err);
          ATT.Error.publish('SDK-20035', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        },
        ontimeout: function (err) {
          logger.logError('CALL REJECTION ERROR', err);
          ATT.Error.publish('SDK-20026', null);
          if (typeof config.error === 'function') {
            config.error();
          }
        }
      });
    }
  };
}(ATT || {}));
