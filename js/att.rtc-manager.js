/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function () {
  'use strict';

  var factories = ATT.private.factories,
    errMgr,

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
    logManager = ATT.logManager.getInstance();

  function handleError(operation, errHandler, err) {
//    logger.logDebug('handleError: ' + operation);
//
//    logger.logInfo('There was an error performing operation ' + operation);

    var error = errMgr.create(err, operation);

    if (typeof errHandler === 'function') {
      errHandler(error);
    }
  }
  function getSession() {
    return session;
  }

  function refreshSessionWithE911ID(args) {
    if (!session) {
      throw 'No session found to delete. Please login first';
    }
    logger.logInfo("Refreshing the session with the new e911Id ");
    session.updateE911Id({
      e911Id: args.e911Id,
      onSuccess: args.onSuccess,
      onError: args.onError
    });
  }

  function dialCall(options) {
    if (!session) {
      throw 'No session found to start a call. Please login first';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    // configure event manager for call event callbacks
    eventManager.onCallEventCallback = function (callback, event) {
      if (event.state === app.CallStatus.ENDED || event.state === app.CallStatus.ERROR) {
        peerConnSvc.endCall();
        userMediaSvc.stopStream();
        var currentCall  = session.getCurrentCall();
        if (currentCall) {
          session.deleteCall(session.getCurrentCall().id());
          session.deleteCurrentCall();
        }
      }

      options.onCallbackCalled(callback, event);
    };

    // Here, we publish `onConnecting`
    // event for the UI
    eventManager.publishEvent({
      state: app.RTCCallEvents.CALL_CONNECTING,
      to: options.to
    });

    session.startCall(app.utils.extend(options, {
      type: app.CallTypes.OUTGOING,
      onCallStarted: function (callObj) {
        eventManager.publishEvent({
          state: app.RTCCallEvents.CALL_RINGING,
          to: callObj.to()
        });
      },
      onCallError: handleError.bind(this, 'StartCall', options.onCallError),
      errorManager: errMgr,
      resourceManager: resourceManager,
      userMediaSvc: userMediaSvc,
      peerConnSvc: peerConnSvc
    }));
  }


  function answerCall(options) {
    if (!session) {
      throw 'No session found to answer a call. Please login first';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }
    // configure event manager for call event callbacks
    eventManager.onCallEventCallback = function (callback, event) {
      options.onCallbackCalled(callback, event);
    };

    session.getCurrentCall().answer(app.utils.extend(options, {
      type: app.CallTypes.INCOMING,
      session: session,
      onCallAnswered: function () {
        logger.logInfo('Successfully answered the incoming call');
      },
      onCallError: handleError.bind(this, 'StartCall', options.onCallError),
      errorManager: errMgr,
      resourceManager: resourceManager,
      userMediaSvc: userMediaSvc,
      peerConnSvc: peerConnSvc
    }));
  }

  function hangupCall() {
    if (!session) {
      throw 'No session found to answer a call. Please login first';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }
    session.getCurrentCall().end({
      session: session,
      onCallEnded: function() {
        logger.logInfo('Call ended successfully');
      },
      onError: handleError.bind(this, 'EndCall')
    });
  }



  function holdCall() {
    if (!session) {
      throw 'No session found to answer a call. Please login first';
    }
    if (!session.getCurrentCall()) {
      throw 'No current call. Please establish a call first.';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    session.getCurrentCall().hold();
  }

  /**
  * Resume call
  *
  */
  function resumeCall() {
    if (!session) {
      throw 'No session found to answer a call. Please login first';
    }
    if (!session.getCurrentCall()) {
      throw 'No current call. Please establish a call first.';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    session.getCurrentCall().resume();
  }

  /**
  * cancel call
  *
  */
  function cancelCall() {
    if (!session) {
      throw 'No session found . Please login first';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    if (session.getCurrentCall() && session.getCurrentCall().id()) {
      session.getCurrentCall().cancel(session);
    } else {
      peerConnSvc.notifyCallCancelation();
      eventManager.publishEvent({
        state: app.RTCCallEvents.SESSION_TERMINATED
      });
    }
  }

  /**
  * reject call
  */
  function rejectCall() {
    if (!session) {
      throw 'No session found. Please login first';
    }
    if (!session.getCurrentCall()) {
      throw 'No current call. Please establish a call first.';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    session.getCurrentCall().reject(session);
  }

  /**
  * Create a new RTC Manager
  * @param {Object} options The options
  * })
  */
  function RTCManager(options) {

    var appConfiguration,
      eventManager,
      resourceManager,
      logger,
      userMediaSvc,
      peerConnSvc;

    function setMediaModifications(modifications) {
      peerConnSvc.setRemoteAndCreateAnswer(modifications.remoteSdp, modifications.modificationId);
    }

    function setRemoteDescription(options) {
      peerConnSvc.setTheRemoteDescription(options.sdp, options.type);
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

    resourceManager = options.resourceManager;
    userMediaSvc = options.userMediaSvc;
    peerConnSvc = options.peerConnSvc;

    logger = logManager.getLoggerByName("RTCManager");

    logger.logDebug('createRTCManager');

    appConfiguration = appConfig.getConfiguration();
    eventManager = factories.createEventManager({
      resourceManager:resourceManager,
      channelConfig: appConfiguration.eventChannelConfig
    });

    function on(event, handler) {
      eventManager.on(event, handler);
    }

    function refreshSession (options) {

      if (undefined === options
        || Object.keys(options).length === 0) {
        throw new Error('Invalid options');
      }

      if (undefined == options.sessionId) {
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
        error: function() {
          return;
        },
        params: {
          url: [options.sessionId],
          headers: {'Authorization': options.token}
        }
      });
    }

    /**
     * start a new session
     * @param {Object} options The options
     * rtcManager.connectSession({
  *   token: 'abcd'
  *   e911Id: 'e911Id'
  * })
     */
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

      logger.logDebug('connectSession');

      var doOperationSuccess = function (response) {
        logger.logInfo('Successfully created web rtc session on blackflag');
        var sessionInfo = extractSessionInformation(response);
        options.onSessionConnected(sessionInfo);

        eventManager.on('listening', function () {
          options.onSessionReady({
            sessionId: sessionInfo.sessionId
          });
        });

        eventManager.setup({
          sessionId: sessionInfo.sessionId,
          token: options.token
        });
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
        throw new Error('Callback `onCallConnecting` not defined.')
      }

      userMediaSvc.getUserMedia({
        mediaType: options.mediaType,
        localMedia: options.localMedia,
        remoteMedia: options.remoteMedia,
        onUserMedia: function (userMedia) {
          eventManager.on('remote-sdp', function (remoteSdp) {
            peerConnSvc.setTheRemoteDescription({
              remoteSdp: remoteSdp,
              type: 'answer',
              success: function () {
                eventManager.publish('remote-sdp-set');
              }
            });
          });
          peerConnSvc.initiatePeerConnection({
            peer: options.peer,
            callId: options.callId,
            type: options.type,
            mediaConstraints: userMedia.mediaConstraints,
            localStream: userMedia.localStream,
            remoteSdp: options.remoteSdp,
            sessionInfo: options.sessionInfo,
            onPeerConnectionInitiated: function (callInfo) {
              if (callInfo.xState
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
            }
          });
        },
        onMediaEstablished: function () {
          eventManager.publish('media-established');
        }
      });
    }

    function disconnectCall (options) {
      var sessionInfo;

      if (undefined === options) {
        throw new Error('No options defined.');
      }

      if (undefined === options.callId) {
        throw new Error('CallId not defined');
      }

      if (undefined === options.sessionInfo) {
        throw new Error('sessionInfo not defined');
      }

      sessionInfo = options.sessionInfo;

      resourceManager.doOperation('endCall', {
        params: {
          url: [
            sessionInfo.sessionId,
            options.callId
          ],
          headers: {
            'Authorization': 'Bearer ' + sessionInfo.token
          }
        },
        success: function () {
          logger.logInfo('EndCall Request success');
        },
        error: function (error) {
          logger.logError(error);
        }
      });
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

      peerConnSvc.holdCall();

    }

    function resumeCall(options) {

      peerConnSvc.resumeCall();
    }

    this.on = on.bind(this);
    this.connectSession = connectSession.bind(this);
    this.disconnectSession = disconnectSession.bind(this);
    this.connectCall = connectCall.bind(this);
    this.disconnectCall = disconnectCall.bind(this);
    this.refreshSession = refreshSession.bind(this);
    this.muteCall = muteCall.bind(this);
    this.unmuteCall = unmuteCall.bind(this);
    this.setMediaModifications = setMediaModifications;
    this.setRemoteDescription = setRemoteDescription;
	this.holdCall = holdCall.bind(this);
    this.resumeCall = resumeCall.bind(this);
  }

  if (undefined === ATT.private) {
    throw new Error('Error exporting `RTCManager`');
  }

  ATT.private.RTCManager = RTCManager;

  ATT.private.rtcManager = (function () {
    var instance,
        resourceManager,
        rtcEvent;

    return {
      getRTCManager: function () {
        if (undefined === instance) {

          resourceManager = factories.createResourceManager(apiConfigs);
          rtcEvent = ATT.RTCEvent.getInstance();

          instance = new RTCManager({
            errorManager: ATT.Error,
            resourceManager: resourceManager,
            rtcEvent: rtcEvent,
            userMediaSvc: ATT.UserMediaService,
            peerConnSvc: ATT.PeerConnectionService
          });
        }
        return instance;
      }
    };

  }());

}());
