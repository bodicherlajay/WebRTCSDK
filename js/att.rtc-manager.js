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
    logger = logManager.getLoggerByName("RTCManager"),
    utils = ATT.utils;

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
      peerConnSvc.setRemoteAndCreateAnswer(modifications.remoteDescription, modifications.modificationId);
    }

    function setRemoteDescription(modifications) {
      peerConnSvc.setTheRemoteDescription(modifications.remoteDescription, modifications.type);
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
          logger.logInfo('refreshWebRTCSession: success');

          var timeout = parseInt(response.getResponseHeader('x-expires'), 10);

          options.success({
            timeout: (timeout * 1000).toString()
          });
        },
        error: function (error) {
          logger.logError('refreshWebRTCSession: error');
          logger.logTrace(error);

          options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'refreshSession', 'RTC'));
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
        var onListening,
          sessionInfo;
        try {
          logger.logDebug('createWebRTCSession: success');
          logger.logInfo('Successfully created web rtc session on blackflag');

          sessionInfo = extractSessionInformation(response);

          options.onSessionConnected(sessionInfo);

          onListening = function () {
            logger.logInfo('listening@eventManager');

            options.onSessionReady({
              sessionId: sessionInfo.sessionId
            });

            eventManager.off('listening', onListening);
          };

          eventManager.on('listening', onListening);

          eventManager.setup({
            sessionId: sessionInfo.sessionId,
            token: options.token,
            onError: function (error) {
              logger.logError('eventManager.setup: onError');

              logger.logTrace(error);

              // TODO: test this
              options.onError({
                error: error
              });
            }
          });

        } catch (err) {
          logger.logError(err);

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
          logger.logError('createWebRTCSession: error');
          logger.logTrace(error);

          options.onError(ATT.Error.createAPIErrorCode(error, "ATT.rtc.Phone", "login", "RTC"));
        }
      });

    }

    function disconnectSession(options) {

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
          logger.logDebug('deleteWebRTCSession: error');
          logger.logInfo('Successfully deleted web rtc session on blackflag');

          options.onSessionDisconnected();
        },
        error: function (error) {
          logger.logError('deleteWebRTCSession: error');
          logger.logTrace(error);

          options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'logout', 'RTC'));
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
            remoteDescription: options.remoteDescription,
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

      var responseData,
        connectConfig,
        createConfig,
        headers,
        data;

      if (undefined === options) {
        throw new Error('No options provided');
      }

      if (undefined === options.breed) {
        throw new Error('No call breed provided');
      }

      if ('call' === options.breed
          && undefined === options.peer) {
        throw new Error('No peer provided');
      }

      if (undefined === options.sessionId) {
        throw new Error('No session id provided');
      }

      if (undefined === options.token) {
        throw new Error('No token provided');
      }

      if (undefined === options.description) {
        throw new Error('No description provided');
      }

      if (undefined === options.onSuccess
          && 'function' !== typeof options.onSuccess) {
        throw new Error('No success callback provided');
      }

      if (undefined === options.onError
          && 'function' !== typeof options.onError) {
        throw new Error('No error callback provided');
      }

      // If you DON'T have a callId ID, then create the call
      if (undefined === options.callId) {

        if ('call' === options.breed) {
          data = {
            call: {
              calledParty: utils.createCalledPartyUri(options.peer),
              sdp: options.description.sdp
            }
          };
        } else {
          data = {
            conference: {
              sdp: options.description.sdp
            }
          };
        }

        createConfig = {
          params: {
            url: {
              sessionId : options.sessionId,
              type: options.breed + 's'
            },
            headers: {
              'Authorization': 'Bearer ' + options.token
            }
          },
          data: data,
          success: function (response) {
            responseData = {
              id: response.getResponseHeader('Location').split('/')[6],
              state: response.getResponseHeader('x-state')
            };
            options.onSuccess(responseData);
          },
          error: options.onError
        };

        resourceManager.doOperation('createCall', createConfig);
        return;
      }

      // If you DO have a call ID, then connect
      headers = {
        'Authorization': 'Bearer ' + options.token,
        'options': {}
      };

      if ('call' === options.breed) {
        headers.options['x-calls-action'] = 'call-answer';
        data = {
          callsMediaModifications: {
            sdp: options.description.sdp
          }
        };
      } else {
        headers.options['x-conference-action'] = 'call-answer';
        data = {
          conferenceModifications: {
            sdp: options.description.sdp
          }
        };
      }

      connectConfig = {
        params: {
          url: {
            sessionId: options.sessionId,
            callId: options.callId,
            type: options.breed + 's'
          },
          headers: headers
        },
        data: data,
        success: function (response) {
          responseData = {
            state: response.getResponseHeader('x-state')
          };
          options.onSuccess(responseData);
        },
        error: options.onError
      };

      resourceManager.doOperation('connectCall', connectConfig);
    }

    function acceptMediaModifications(options) {
      var data, type = ('call' === options.breed ? 'calls' : 'conferences');

      if ('calls' === type) {
        data = {
          callsMediaModifications: {
            sdp: options.sdp
          }
        };
      } else {
        data = {
          conferenceModifications: {
            sdp: options.sdp
          }
        };
      }

      resourceManager.doOperation('acceptModifications', {
        params: {
          url: {
            sessionId: options.sessionId,
            type: type,
            callId: options.callId
          },
          headers: {
            'Authorization': 'Bearer ' + options.token,
            'x-modId': options.modId
          }
        },
        data: data,
        success: function () {
          logger.logInfo('acceptMediaModifications: success');
        },
        error: function (error) {
          logger.logError('acceptMediaModifications: error');
          logger.logTrace(error);
        }
      });
    }

    function addParticipant(options) {
      var invitee,
        modId;

      if (undefined === options) {
        throw new Error('No `options` passed');
      }

      if (undefined === options.sessionInfo) {
        throw new Error('No `sessionInfo` passed');
      }

      if (undefined === options.confId) {
        throw new Error('No `confId` passed');
      }

      if (typeof options.onSuccess !== 'function') {
        throw new Error('No `onSuccess` callback passed');
      }

      invitee = options['invitee'].toString();

      if (invitee.indexOf('@') > -1) {
        invitee = 'sip:' + invitee;
      } else {
        invitee = 'tel:+' + invitee;
      }

      resourceManager.doOperation('addParticipant', {
        params: {
          url: [
            options.sessionInfo.sessionId,
            options.confId,
            invitee
          ],
          headers: {
            'Authorization': 'Bearer ' + options.sessionInfo.token
          }
        },
        success: function (response) {
          logger.logInfo('addParticipant Request success');

          if ('add-pending' === response.getResponseHeader('x-state')) {
            modId = response.getResponseHeader('x-modId');
            options.onSuccess(modId);
          }
        },
        error: function (error) {
          logger.logError(error);
          options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'addParticipant', 'RTC'));
        }
      });
    }

    function removeParticipant(options) {
      var participant;

      if (undefined === options) {
        throw new Error('No `options` passed');
      }

      if (undefined === options.sessionInfo) {
        throw new Error('No `sessionInfo` passed');
      }

      if (undefined === options.confId) {
        throw new Error('No `confId` passed');
      }

      if (typeof options.onSuccess !== 'function') {
        throw new Error('No `onSuccess` callback passed');
      }

      participant = options.participant.toString();

      if (participant.indexOf('@') > -1) {
        participant = 'sip:' + participant;
      } else {
        participant = 'tel:+' + participant;
      }

      resourceManager.doOperation('removeParticipant', {
        params: {
          url: [
            options.sessionInfo.sessionId,
            options.confId,
            participant
          ],
          headers: {
            'Authorization': 'Bearer ' + options.sessionInfo.token
          }
        },
        success: function (response) {
          logger.logInfo('removeParticipant Request success');

          if ('remove-pending' === response.getResponseHeader('x-state')) {
            options.onSuccess();
          }
        },
        error: function (error) {
          logger.logError(error);
          options.onError(error);
        }
      });

    }

    // Reused for call & conference
    function disconnectCall(options) {

      if (undefined === options) {
        throw new Error('No options provided');
      }
      if (undefined === options.callId) {
        throw new Error('No CallId provided');
      }
      if (undefined === options.breed) {
        throw new Error('No call breed provided');
      }
      if (undefined === options.sessionId) {
        throw new Error('No sessionId provided');
      }
      if (undefined === options.token) {
        throw new Error('No token provided');
      }
      if (undefined === options.onSuccess) {
        throw new Error('No success callback provided');
      }
      if (undefined === options.onError) {
        throw new Error('No error callback provided');
      }

      var type = (options.breed === 'call' ? 'calls' : 'conferences'),
        operation = (options.breed === 'call' ? 'hangup' : 'endConference');

      resourceManager.doOperation('endCall', {
        params: {
          url: [
            options.sessionId,
            type,
            options.callId
          ],
          headers: {
            'Authorization': 'Bearer ' + options.token
          }
        },
        success: function () {
          logger.logInfo('ResourceManager.disconnect request success');
        },
        error: function (error) {
          logger.logError(error);

          options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', operation, 'RTC'));
        }
      });
    }

    function cancelCall(options) {

      if (undefined === options) {
        throw new Error('No options provided');
      }
      if (undefined === options.callId) {
        throw new Error('No callId provided');
      }
      if (undefined === options.sessionId) {
        throw new Error('No sessionId provided');
      }
      if (undefined === options.token) {
        throw new Error('No token provided');
      }
      if (undefined === options.onSuccess) {
        throw new Error('No success callback provided');
      }
      if (undefined === options.onError) {
        throw new Error('No error callback provided');
      }

      // Its not ringing on the other end yet
      if (null === options.callId) {
        peerConnSvc.cancelSdpOffer(function () {
          options.onSuccess();
        });

      // Its probably ringing on the other end
      } else if (options.callId.length > 0) {
        resourceManager.doOperation('cancelCall', {
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
            logger.logInfo('ResourceManager.cancel request success');
          },
          error: function (error) {
            logger.logError(error);

            options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'cancel', 'RTC'));
          }
        });
      }
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
      var data,
        type;

      if (undefined !== options) {
        type = options.move ? 'move' : 'hold';
      }

      if (2 === ATT.private.pcv) {
        if (undefined === options) {
          throw new Error('No options provided');
        }
        if (undefined === options.callId) {
          throw new Error('No callId provided');
        }
        if (undefined === options.sessionId) {
          throw new Error('No sessionId provided');
        }
        if (undefined === options.token) {
          throw new Error('No token provided');
        }
        if (undefined === options.description) {
          throw new Error('No sdp provided');
        }
        if (undefined === options.breed) {
          throw new Error('No breed provided');
        }
        if (undefined === options.onSuccess) {
          throw new Error('No success callback provided');
        }
        if (undefined === options.onError) {
          throw new Error('No error callback provided');
        }

        if ('conference' === options.breed) {
          data = {
            conferenceModifications: {
              sdp: options.description.sdp,
              type: options.description.type
            }
          };

          resourceManager.doOperation('modifyConference', {
            params: {
              url: {
                sessionId: options.sessionId,
                callId: options.callId
              },
              headers: {
                'Authorization': 'Bearer ' + options.token,
                'x-conference-action': 'initiate-hold'
              }
            },
            data: data,
            success: function (response) {
              if (response.getResponseStatus() === 204) {
                logger.logTrace('resourceManager.doOperation(`modifyConference`)');
                options.onSuccess();
              } else {
                options.onError();
              }
            },
            error: function (error) {
              options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'hold', 'RTC'));
            }
          });
          return;
        }

        data = {
          callsMediaModifications: {
            sdp: options.description.sdp,
            type: options.description.type
          }
        };

        logger.logTrace('doOperation: modifyCall');

        resourceManager.doOperation('modifyCall', {
          params: {
            url: {
              sessionId: options.sessionId,
              callId: options.callId
            },
            headers: {
              'Authorization': 'Bearer ' + options.token,
              'x-calls-action': true === options.move ? 'initiate-call-move' : 'initiate-call-hold'
            }
          },
          data: data,
          success: function (response) {
            if (response.getResponseStatus() === 204) {
              logger.logTrace(type + 'request sent...');
              options.onSuccess();
            } else {
              options.onError();
            }
          },
          error: function (error) {
            options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', type, 'RTC'));
          }
        });
      } else {
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
    }

    function resumeCall(options) {
      var data;

      if (2 === ATT.private.pcv) {
        if (undefined === options) {
          throw new Error('No options provided');
        }
        if (undefined === options.callId) {
          throw new Error('No callId provided');
        }
        if (undefined === options.sessionId) {
          throw new Error('No sessionId provided');
        }
        if (undefined === options.token) {
          throw new Error('No token provided');
        }
        if (undefined === options.description) {
          throw new Error('No sdp provided');
        }
        if (undefined === options.breed) {
          throw new Error('No breed provided');
        }
        if (undefined === options.onSuccess) {
          throw new Error('No success callback provided');
        }
        if (undefined === options.onError) {
          throw new Error('No error callback provided');
        }

        if ('conference' === options.breed) {
          data = {
            conferenceModifications: {
              sdp: options.description.sdp,
              type: options.description.type
            }
          };

          logger.logTrace('doOperation: modifyConference');
          resourceManager.doOperation('modifyConference', {
            params: {
              url: {
                sessionId: options.sessionId,
                callId: options.callId
              },
              headers: {
                'Authorization': 'Bearer ' + options.token,
                'x-conference-action': 'initiate-resume'
              }
            },
            data: data,
            success: function (response) {
              if (response.getResponseStatus() === 204) {
                logger.logTrace('resume request sent...');
                options.onSuccess();
              } else {
                options.onError();
              }
            },
            error: function (error) {
              options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'resume', 'RTC'));
            }
          });
          return;
        }

        data = {
          callsMediaModifications: {
            sdp: options.description.sdp,
            type: options.description.type
          }
        };
        logger.logTrace('doOperation: modifyCall');
        resourceManager.doOperation('modifyCall', {
          params: {
            url: {
              sessionId: options.sessionId,
              callId: options.callId
            },
            headers: {
              'Authorization': 'Bearer ' + options.token,
              'x-calls-action': 'initiate-call-resume'
            }
          },
          data: data,
          success: function (response) {
            if (response.getResponseStatus() === 204) {
              logger.logTrace('resume request sent...');
              options.onSuccess();
            } else {
              options.onError();
            }
          },
          error: function (error) {
            options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', 'resume', 'RTC'));
          }
        });
      } else {
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
        throw new Error('Invalid options');
      }
      if (undefined === options.callId || '' === options.callId) {
        throw new Error('No callId provided');
      }
      if(undefined === options.breed || '' === options.breed) {
        throw new Error('No call breed provided');
      }
      if (undefined === options.sessionId || '' === options.sessionId) {
        throw new Error('No session Id provided');
      }
      if (undefined === options.token || '' === options.token) {
        throw new Error('No token provided');
      }
      if (undefined === options.onSuccess  || typeof options.onSuccess !== 'function') {
        throw new Error('No success callback provided');
      }
      if (undefined === options.onError || typeof options.onError !== 'function') {
        throw new Error('No error callback provided');
      }

      var type = 'call' === options.breed ? 'calls' : 'conferences',
        operation = 'call' === options.breed ? 'reject' : 'rejectConference';

      resourceManager.doOperation('rejectCall', {
        params: {
          url: [
            options.sessionId,
            type,
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
          options.onError(ATT.Error.createAPIErrorCode(error, 'ATT.rtc.Phone', operation, 'RTC'));
        }
      });
    }

    this.on = on;
    this.off = off;
    this.connectSession = connectSession;
    this.disconnectSession = disconnectSession;
    this.connectCall = connectCall;
    this.connectConference = connectConference;
    this.acceptMediaModifications = acceptMediaModifications;
    this.addParticipant = addParticipant;
    this.removeParticipant = removeParticipant;
    this.disconnectCall = disconnectCall;
    this.refreshSession = refreshSession;
    this.cancelCall = cancelCall;
    this.muteCall = muteCall;
    this.unmuteCall = unmuteCall;
    this.setMediaModifications = setMediaModifications;
    this.resetPeerConnection = resetPeerConnection;
    this.setRemoteDescription = setRemoteDescription;
    this.disableMediaStream = disableMediaStream;
    this.enableMediaStream = enableMediaStream;
    this.stopUserMedia = stopUserMedia;
    this.holdCall = holdCall;
    this.resumeCall = resumeCall;
    this.rejectCall = rejectCall;
    this.updateSessionE911Id = updateSessionE911Id;
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
