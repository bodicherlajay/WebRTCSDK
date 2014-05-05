/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */
/**
 *  The WebRTC SDK. 
 */

if (!ATT) {
  var ATT = {};
}

if (!Env) {
  var Env = {};
}

(function (app) {
  'use strict';

  var resourceManager = Env.resourceManager.getInstance(),
    callManager = cmgmt.CallManager.getInstance(),
    createWebRTCSessionSuccess,
    createWebRTCSessionError,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logMgr.configureLogger('WebRTC', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);
  logger = logMgr.getLogger('WebRTC');

  /**
   * Initialize the SDK with Oauth accessToken and e911Id
   * @param {String} accessToken
   * @param {String} e911Id
   */
  function initSession(accessToken, e911Id) {
    logger.logTrace('Initializing SDK session with token and optional e911 id');
    if (!accessToken) {
      return logger.logError('Cannot init SDK session, no access token');
    }
    if (!e911Id) {
      logger.logWarning('Initializing SDK session without e911 id');
    }
    // Set the access Token in the callManager.
    callManager.CreateSession({
      token: accessToken,
      e911Id: e911Id
    });
    logger.logTrace('Initialed SDK session with token and optional e911 id');
  }

  /**
   * SDK login will just create the webRTC session.  It requires
   * both the e911Id and the oauth access token set in the call manager.
   * @memberof WebRTC
   * @param {Object} data The required login form data from the UI.
   */
  function login(config) {
    if (!config) {
      return logger.logError('Cannot login to web rtc, no configuration');
    }
    if (!config.data) {
      return logger.logError('Cannot login to web rtc, no configuration data');
    }
    var token = config.data.token.access_token,
      e911Id = config.data.e911Id ? config.data.e911Id.e911Locations.addressIdentifier: null;

    // create new session with token and optional e911id
    initSession(token, e911Id);

    var session = callManager.getSessionContext(),
      accessToken = session.getAccessToken(),
      e911Id = session.getE911Id();

    // todo: need to decide if callbacks should be mandatory
    if (typeof config.onSessionReady !== 'function') {
      logger.logError('No UI success callback specified');
    }
    if (typeof config.onError !== 'function') {
      logger.logError('No UI error callback specified');
    }

    logger.logTrace('Creating WebRTC session...');
    resourceManager.doOperation('createWebRTCSession', {
      data: {     // Todo: this needs to be configurable in SDK, not hardcoded.
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
          'Authorization': accessToken,
          'x-e911Id': e911Id || ""
        }
      },
      success: createWebRTCSessionSuccess.bind(this, config),
      error: createWebRTCSessionError
    });
  }

  createWebRTCSessionSuccess = function (config, responseObject) {
    logger.logTrace('WebRTC Session created');
    var sessionId,
      session = callManager.getSessionContext(),
      channelConfig;

    sessionId = responseObject && responseObject.getResponseHeader('Location') ? responseObject.getResponseHeader('Location').split('/')[4] : null;

    if (sessionId) {

      // Set WebRTC.Session data object that will be needed downstream.
      session.setSessionId(sessionId);
      // Also setup UI callbacks
      session.setUICallbacks(config);

      // setting up event callbacks using RTC Events
      app.RTCEvent.getInstance().hookupEventsToUICallbacks();
      // publish the UI callback for ready state
      app.event.publish(sessionId + '.responseEvent', {
        state:  app.SessionEvents.RTC_SESSION_CREATED,
        data:   {
          webRtcSessionId: sessionId
        }
      });

      // Set event channel configuration
      // All parameters are required
      // Also, see appConfigModule
      channelConfig = {
        accessToken: session.getAccessToken(),
        endpoint: ATT.appConfig.eventChannelConfig.endpoint,
        sessionId: session.getSessionId(),
        publisher: ATT.event,
        resourceManager: resourceManager,
        publicMethodName: 'getEvents',
        usesLongPolling: true
      };
      logger.logTrace('Creating event channel...');
      ATT.utils.eventChannel = ATT.utils.createEventChannel(channelConfig);
      if (ATT.utils.eventChannel) {
        ATT.utils.eventChannel.startListening();
      }
    } else {
      logger.logDebug('No session id');
    }
  };

  createWebRTCSessionError = function () {
    logger.logError('createWebRTCSessionError');
  };

  function logout(config) {
    ATT.UserMediaService.stopStream();
    ATT.utils.eventChannel.stopListening();
    var session = callManager.getSessionContext(),
      dataForDeleteWebRTCSession,
      successCallback = function (statusCode) {
        var data = {};
        if (statusCode !== 200) {
          data = {
            type : 'error',
            error : 'Failed to delete the web rtc session on blackflag'
          };
        }
        if (typeof config.success === 'function') {
          config.success(data);
        }
      };

    if (!session) {
      successCallback();
    }

    dataForDeleteWebRTCSession = {
      params: {
        url: [session.getSessionId()],
        headers: {
          'Authorization': session.getAccessToken(),
          'x-e911Id': session.getE911Id()
        }
      },
      success: function (responseObject) {
        logger.logError('Successfully deleted web rtc session on blackflag');
        successCallback(responseObject.getResponseStatus());
      }
    };

    logger.logTrace('Logging out...');
    // Call BF to delete WebRTC Session.
    resourceManager.doOperation('deleteWebRTCSession', dataForDeleteWebRTCSession);
  }

  /**
   *
   * @param {Object} config Dial configuration object.
   * @attribute {String} phoneNumber
   * @attribute {HTMLElement} localVideo
   * @attribute {HTMLElement} remoteVideo
   * @attribute {Object} mediaConstraints
   * @attribute {Object} callbacks UI callbacks. Event object will be passed to these callbacks.
   */
  function dial(config) {
    callManager.CreateOutgoingCall(config);

    // setting up event callbacks using RTC Events
    app.RTCEvent.getInstance().hookupEventsToUICallbacks();
  }

  /**
   *
   * @param {Object} config answer configuration object.
   */
  function answer(config) {
    callManager.CreateIncomingCall(config);

    // setting up event callbacks using RTC Events
    app.RTCEvent.getInstance().hookupEventsToUICallbacks();
  }

  /**
  * Mute existing stream
  */
  function mute() {
    callManager.getSessionContext().getCallObject().mute();
  }

  /**
  * Unmute existing stream
  */
  function unmute() {
    callManager.getSessionContext().getCallObject().unmute();
  }

  /**
  * Hold existing call
  */
  function hold() {
    if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
      callManager.getSessionContext().getCallObject().hold();
    }
  }

  /**
  * Resume existing call
  */
  function resume() {
    if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
      callManager.getSessionContext().getCallObject().resume();
    }
  }

  /**
  * Hangup existing call
  */
  function hangup() {
    if (callManager.getSessionContext() && callManager.getSessionContext().getCallObject()) {
      callManager.getSessionContext().getCallObject().end();
    }
  }

  // The SDK public API.
  function configurePublicAPIs() {
    resourceManager.addPublicMethod('init', initSession);
    resourceManager.addPublicMethod('login', login);
    resourceManager.addPublicMethod('logout', logout);
    resourceManager.addPublicMethod('dial', dial);
    resourceManager.addPublicMethod('answer', answer);
    resourceManager.addPublicMethod('hold', hold);
    resourceManager.addPublicMethod('resume', resume);
    resourceManager.addPublicMethod('mute', mute);
    resourceManager.addPublicMethod('unmute', unmute);
    resourceManager.addPublicMethod('hangup', hangup);
  }

  // sub-namespaces on ATT.
  app.RESTClient = RESTClient;

  app.configurePublicAPIs = configurePublicAPIs;

}(ATT || {}));