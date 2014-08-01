/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/

//Dependency: ATT.logManager

(function () {
  'use strict';

  var factories = ATT.private.factories,

    // TODO: Review if this is the right place to define ATT.APIConfigs
    // define ATT.APIConfigs: this seems to be the logical
    // point where this object should be first defined since
    // only ResourceManager, EventChannel, SignalingService will use it
    // and those three modules are `managed` by RTCManager, so
    // RTCManager can pass in the configured ResourceManager created with
    //   var apiConfigs = ATT.APIConfigs
    //   resourceManager = factories.createResourceManger(apiConfigs);

    apiConfigs = ATT.private.config.api,
    appConfig = ATT.private.config.app,
    logManager = ATT.logManager.getInstance(),
    logger = logManager.getLoggerByName("RTCManager");

  /**
  * Create a new RTC Manager
  * @param {Object} options The options
  * })
  */
  function RTCManager(options) {

    var appConfiguration,
      eventManager,
      resourceManager,
      userMediaSvc,
      peerConnSvc;

    resourceManager = options.resourceManager;
    userMediaSvc = options.userMediaSvc;
    peerConnSvc = options.peerConnSvc;

    logger.logDebug('RTCManager');

    appConfiguration = appConfig.getConfiguration();

    eventManager = factories.createEventManager({
      resourceManager : resourceManager,
      channelConfig: appConfiguration.eventChannelConfig
    });

    function setMediaModifications(modifications) {
      peerConnSvc.setRemoteAndCreateAnswer(modifications.remoteSdp, modifications.modificationId);
    }

    function setRemoteDescription(modifications) {
      peerConnSvc.setTheRemoteDescription(modifications.remoteSdp, modifications.type);
    }

    function resetPeerConnection() {
      peerConnSvc.endCall();
    }

    function stopUserMedia() {
      userMediaSvc.stopStream();
    }

    function extractSessionInformation(responseObject) {
      logger.logDebug('extractSessionInformation');

      var sessionId = null,
        timeout = null;

      if (responseObject) {
        if (responseObject.getResponseHeader('Location')) {
          sessionId = responseObject.getResponseHeader('Location').split('/')[4];
        }
        if (responseObject.getResponseHeader('x-expires')) {
          timeout = responseObject.getResponseHeader('x-expires');
          timeout = Number(timeout);
          timeout = isNaN(timeout) ? 0 : timeout * 1000; // convert to ms
        }
      }

      if (!sessionId) {
        throw 'Failed to retrieve session id';
      }

      return {
        sessionId: sessionId,
        timeout: timeout
      };
    }

    function on(event, handler) {
      eventManager.on(event, handler);
    }

    function off(event, handler) {
      eventManager.off(event, handler);
    }

    function refreshSession(options) {

      if (undefined === options
          || Object.keys(options).length === 0) {
        throw new Error('Invalid options');
      }

      if (undefined === options.sessionId) {
        throw new Error('No session ID passed');
      }

      if (undefined === options.token) {
        throw new Error('No token passed');
      }

      if (undefined === options.success) {
        throw new Error('No `success` callback passed');
      }

      if (typeof options.success !== 'function') {
        throw new Error('`success` callback has to be a function');
      }

      if (undefined === options.error) {
        throw new Error('No `error` callback passed');
      }

      if (typeof options.error !== 'function') {
        throw new Error('`error` callback has to be a function');
      }

      resourceManager.doOperation('refreshWebRTCSession', {
        success : function (response) {
          var timeout;

          timeout = parseInt(response.getResponseHeader('x-expires'), 10);

          options.success({ timeout: (timeout * 1000).toString() });
        },
        error: function(error) {
          //todo fix this
/*
          logger.logError(error);
          options.onError(ATT.Error.createAPIErrorCode(error,"ATT.rtc.Phone","refreshSession","RTC"));
*/
		  return;
        },
        params: {
          url: [options.sessionId],
          headers: {'Authorization': options.token}
        }
      });
    }

    function connectSession(options) {

      if (undefined === options) {
        throw new Error('No options defined.');
      }
      if (undefined === options.token) {
        throw new Error('No token defined.');
      }
      if (undefined === options.onSessionConnected) {
        throw new Error('Callback onSessionConnected not defined.');
      }
      if (undefined === options.onSessionReady) {
        throw new Error('Callback onSessionReady not defined.');
      }
      if (undefined === options.onError) {
        throw new Error('Callback onError not defined.');
      }

      logger.logDebug('connectSession');

      var doOperationSuccess = function (response) {
        try {
          logger.logInfo('Successfully created web rtc session on blackflag');

          var sessionInfo = extractSessionInformation(response);

          options.onSessionConnected(sessionInfo);

          eventManager.on('listening', function () {
            logger.logInfo('listening@eventManager');

            options.onSessionReady({
              sessionId: sessionInfo.sessionId
            });
          });

          eventManager.setup({
            sessionId: sessionInfo.sessionId,
            token: options.token
          });

        } catch(err) {
          logger.logError (err);

          options.onError({
            error: ATT.errorDictionary.getSDKError('2004')
          });
        }
      };

      resourceManager.doOperation('createWebRTCSession', {
        data: {
          'session': {
            'mediaType': 'dtls-srtp',
            'ice': 'true',
            'services': [
              'ip_voice_call',
              'ip_video_call'
            ]
          }
        },
        params: {
          headers: {
            'Authorization': options.token,
            'x-e911Id': options.e911Id || '',
            'x-Arg': 'ClientSDK=WebRTCTestAppJavascript1'
          }
        },
        success: doOperationSuccess,
        error: function (error) {
          logger.logError(error);
          options.onError(ATT.Error.createAPIErrorCode(error,"ATT.rtc.Phone","login","RTC"));
        }
      });

    };

    function disconnectSession (options) {

      if (undefined === options) {
        throw new Error('No options defined.');
      }
      if (undefined === options.sessionId) {
        throw new Error('No session id defined.');
      }
      if (undefined === options.token) {
        throw new Error('No token defined.');
      }
      if (undefined === options.onSessionDisconnected) {
        throw new Error('Callback onSessionDisconnected not defined.');
      }

      logger.logDebug('disconnectSession');

      eventManager.stop();

      // Call BF to delete WebRTC Session.
      resourceManager.doOperation('deleteWebRTCSession', {
        params: {
          url: [options.sessionId],
          headers: {
            'Authorization': options.token,
            'x-e911Id': options.e911Id
          }
        },
        success: function () {
          logger.logInfo('Successfully deleted web rtc session on blackflag');

          options.onSessionDisconnected();
        },
        error: function (error) {
          logger.logError(error);
          options.onError(ATT.Error.createAPIErrorCode(error,"ATT.rtc.Phone","logout","RTC"));
        }
      });
    }

    function connectCall(options) {
      if (undefined === options) {
        throw new Error('No options defined.');
      }
      if (undefined === options.peer && undefined === options.callId) {
        throw new Error('No `peer` or `callId` defined');
      }
      if (undefined === options.mediaType) {
        throw new Error('No MediaType defined.');
      }
      if (undefined === options.onCallConnecting) {
        throw new Error('Callback `onCallConnecting` not defined.');
      }
      if (undefined === options.onUserMediaError) {
        throw new Error('Callback `onUserMediaError` not defined.')
      }
      if (undefined === options.onError) {
        throw new Error('Callback `onError` not defined.');
      }

      userMediaSvc.getUserMedia({
        mediaType: options.mediaType,
        localMedia: options.localMedia,
        remoteMedia: options.remoteMedia,
        onUserMedia: function (userMedia) {

          peerConnSvc.initiatePeerConnection({
            breed: options.breed,
            peer: options.peer,
            callId: options.callId,
            type: options.type,
            mediaConstraints: userMedia.mediaConstraints,
            localStream: userMedia.localStream,
            remoteSdp: options.remoteSdp,
            sessionInfo: options.sessionInfo,
            onPeerConnectionInitiated: function (callInfo) {
              if (undefined !== callInfo.xState
                  && (callInfo.xState === 'invitation-sent'
                      || callInfo.xState === 'accepted')) { // map connecting to IIP event types
                callInfo.xState = 'connecting';
              }

              options.onCallConnecting(callInfo);
            },
            onRemoteStream: function (stream) {
              userMediaSvc.showStream({
                localOrRemote: 'remote',
                stream: stream
              });
            },
            onPeerConnectionError: function(error) {
              options.onError(error);
            }
          });
        },
        onMediaEstablished: function () { },
        onUserMediaError: function (error) {
          options.onError(error);
        }
      });
    }

    function connectConference(options) {
      var config = {
        data: {
          conferenceModifications: {
            sdp: options.localSdp
          }
        },
        success: function (response) {

          var responseData = {
            id: response.getResponseHeader('Location').split('/')[6],
            state: response.getResponseHeader('x-state')
          };
          options.onSuccess(responseData);
        },
        error: function (error) {
          options.onError(error);
        }
      };
      if (undefined !== options.conferenceId) {
        resourceManager.doOperation('acceptConference', config);
      } else {
        resourceManager.doOperation('createConference', config);
      }
    }

    function addParticipant(options) {

      if (undefined === options) {
        throw new Error('No `options` passed');
      }

      if (undefined === options.sessionInfo) {
        throw new Error('No `sessionInfo` passed');
      }

      if (undefined === options.confId) {
        throw new Error('No `confId` passed');
      }

      if (undefined === options.onParticipantPending
        || typeof options.onParticipantPending !== 'function') {
        throw new Error('No `onParticipantPending` callback passed');
      }

      resourceManager.doOperation('addParticipant', {
        params: {
          url: [
            options.sessionInfo.sessionId,
            options.confId,
            options.participant
          ],
          headers: {
            'Authorization': 'Bearer ' + options.sessionInfo.token
          }
        },
        success: function (response) {
          logger.logInfo('addParticipant Request success');
          var modId;

          if ('add-pending' === response.getResponseHeader('x-state')) {
            modId = response.getResponseHeader('x-modId');
            options.onParticipantPending(modId);
          }
        },
        error: function (error) {
          logger.logError(error);
          options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'addParticipant', 'RTC'));
        }
      });
    }

    // Reused for call & conference
    function disconnectCall (options) {
      var sessionInfo,
        uri;

      if (undefined === options) {
        throw new Error('No options defined.');
      }

      if (undefined === options.callId) {
        throw new Error('CallId not defined');
      }

      if (undefined === options.sessionInfo) {
        throw new Error('sessionInfo not defined');
      }

      if (undefined === options.breed) {
        throw new Error('breed not defined');
      }

      if (undefined === options.onError) {
        throw new Error('onError callback not defined');
      }

      sessionInfo = options.sessionInfo;
      uri = (options.breed === 'call' ? '/calls/' : '/conferences/');

      resourceManager.doOperation('endCall', {
        params: {
          url: [
            sessionInfo.sessionId,
            uri,
            options.callId
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token
          }
        },
        success: function () {
          logger.logInfo('ResourceManager.disconnect request success');
        },
        error: function (error) {
          logger.logError(error);
          if ('call' === options.breed) {
            options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'hangup', 'RTC'));
          } else if ('conference' === options.breed) {
            options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'endConference', 'RTC'));
          }
        }
      });
    }

    function cancelCall(options) {

      if (undefined === options
          || 0 === Object.keys(options).length) {
        throw new Error('No `options` passed');
      }

      if (undefined === options.success) {
        throw new Error('No `success` callback passed');
      }

      if (undefined === options.sessionInfo) {
        throw new Error('No `sessionInfo` passed');
      }

      if (undefined === options.callId) {
        throw new Error('No `callId` passed');
      }

      // Its not ringing on the other end yet
      if (null === options.callId) {
        peerConnSvc.cancelSdpOffer(function () {
          options.success();
        });

      // Its probably ringing on the other end
      } else if (options.callId['length'] > 0) {
        resourceManager.doOperation('cancelCall', {
          params: {
            url: [
              options.sessionInfo.sessionId,
              options.callId
            ],
            headers: {
              'Authorization': 'Bearer ' + options.sessionInfo.token
            }
          },
          success: function () {
            logger.logInfo('ResourceManager.cancel request success');
          },
          error: function (error) {
            logger.logError(error);
            options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'cancel', 'RTC'));
          }
        });
      }
    }

    function playStream() {

    }

    function muteCall(options) {
      userMediaSvc.muteStream({
        onLocalStreamMuted: function () {
          options.onSuccess();
        }
      });
    }

    function unmuteCall(options) {
      userMediaSvc.unmuteStream({
        onLocalStreamUnmuted: function () {
          options.onSuccess();
        }
      });
    }

    function holdCall(options) {

      if (undefined === options) {
        throw new Error('No options passed');
      }

      if (undefined === options.callId) {
        throw new Error('No callId passed');
      }

      if (undefined === options.onSuccess) {
        throw new Error('No onSuccess callback passed');
      }

      peerConnSvc.holdCall({
        onHoldSuccess: function (localSdp) {
          options.onSuccess(localSdp);
        },
        callId: options.callId
      });
    }

    function resumeCall(options) {

      if (undefined === options) {
        throw new Error('No options passed');
      }

      if (undefined === options.callId) {
        throw new Error('No callId passed');
      }

      if (undefined === options.onSuccess) {
        throw new Error('No onSuccess callback passed');
      }

      peerConnSvc.resumeCall({
        onResumeSuccess: function (localSdp) {
          options.onSuccess(localSdp);
        },
        callId: options.callId
      });
    }

    function disableMediaStream() {
      userMediaSvc.disableMediaStream();
    }

    function enableMediaStream() {
      userMediaSvc.enableMediaStream();
    }

    function updateSessionE911Id(options) {
      var dataForRefreshWebRTCSessionWithE911Id;
      if (undefined === options) {
        throw 'Invalid options';
      }
      if (undefined === options.token || '' === options.token) {
        throw 'No token passed';
      }
      if (undefined === options.e911Id || '' === options.e911Id) {
        throw 'No e911Id passed';
      }

      if (undefined === options.sessionId || '' === options.sessionId) {
        throw 'No session Id passed';
      }

      if (undefined === options.onSuccess  || typeof options.onSuccess !== 'function') {
        throw 'No success callback passed';
      }

      if (undefined === options.onError || typeof options.onError !== 'function') {
        throw 'No error callback passed';
      }

      dataForRefreshWebRTCSessionWithE911Id = {
        data: {
          "e911Association": { "e911Id": options.e911Id }
        },
        params: {
          url: [options.sessionId],
          headers: {
            'Authorization': options.token
          }
        },
        success: options.onSuccess,
        error: function (error) {
          logger.logError(error);
          options.onError(ATT.Error.createAPIErrorCode(error,"ATT.rtc.Phone","updateE911Id","RTC"));
        }
      };

    // Call BF to refresh WebRTC Session.
      resourceManager.doOperation('refreshWebRTCSessionWithE911Id', dataForRefreshWebRTCSessionWithE911Id);
    }

    function rejectCall(options) {


      if (undefined === options) {
        throw 'Invalid options';
      }
      if (undefined === options.token || '' === options.token) {
        throw 'No token passed';
      }
      if (undefined === options.callId || '' === options.callId) {
        throw 'No callId passed';
      }

      if (undefined === options.sessionId || '' === options.sessionId) {
        throw 'No session Id passed';
      }

      if (undefined === options.onSuccess  || typeof options.onSuccess !== 'function') {
        throw 'No success callback passed';
      }

      if (undefined === options.onError || typeof options.onError !== 'function') {
        throw 'No error callback passed';
      }


      resourceManager.doOperation('rejectCall', {
        params: {
          url: [
            options.sessionId,
            options.callId
          ],
          headers: {
            'Authorization': 'Bearer ' + options.token
          }
        },
        success: function () {
          logger.logInfo('RejectCall Request success');
        },
        error: function (error) {
          logger.logError(error);
          options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'reject', 'RTC'));
        }
      });
    }

    this.on = on.bind(this);
    this.off = off.bind(this);
    this.connectSession = connectSession.bind(this);
    this.disconnectSession = disconnectSession.bind(this);
    this.connectCall = connectCall.bind(this);
    this.connectConference = connectConference;
    this.addParticipant = addParticipant.bind(this);
    this.disconnectCall = disconnectCall.bind(this);
    this.refreshSession = refreshSession.bind(this);
    this.cancelCall = cancelCall.bind(this);
    this.playStream = playStream.bind(this);
    this.muteCall = muteCall.bind(this);
    this.unmuteCall = unmuteCall.bind(this);
    this.setMediaModifications = setMediaModifications.bind(this);
    this.resetPeerConnection = resetPeerConnection.bind(this);
    this.setRemoteDescription = setRemoteDescription.bind(this);
    this.disableMediaStream = disableMediaStream.bind(this);
    this.enableMediaStream = enableMediaStream.bind(this);
    this.stopUserMedia = stopUserMedia.bind(this);
    this.holdCall = holdCall.bind(this);
    this.resumeCall = resumeCall.bind(this);
    this.rejectCall = rejectCall.bind(this);
    this.updateSessionE911Id = updateSessionE911Id.bind(this);
    this.connectConference = connectConference;
  }

  if (undefined === ATT.private) {
    throw new Error('Error exporting `RTCManager`');
  }

  ATT.private.RTCManager = RTCManager;

  ATT.private.rtcManager = (function () {
    var instance,
      resourceManager;

    return {
      getRTCManager: function () {
        if (undefined === instance) {

          resourceManager = factories.createResourceManager(apiConfigs);

          instance = new RTCManager({
            resourceManager: resourceManager,
            userMediaSvc: ATT.UserMediaService,
            peerConnSvc: ATT.PeerConnectionService
          });
        }
        return instance;
      }
    };

  }());

}());
