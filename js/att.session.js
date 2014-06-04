/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function (app) {
  'use strict';

  var errMgr,
    resourceManager,
    logger;

  function handleError(operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);

    logger.logInfo('There was an error performing operation ' + operation);

    var error = errMgr.create(err, operation);

    if (typeof errHandler === 'function') {
      errHandler(error);
    }
  }

  function extractSessionInformation(responseObject) {
    logger.logDebug('extractSessionInformation');

    var sessionId = null,
      expiration = null;

    if (responseObject) {
      if (responseObject.getResponseHeader('Location')) {
        sessionId = responseObject.getResponseHeader('Location').split('/')[4];
      }
      if (responseObject.getResponseHeader('x-expires')) {
        expiration = responseObject.getResponseHeader('x-expires');
        expiration = Number(expiration);
        expiration = isNaN(expiration) ? 0 : expiration * 1000; // convert to ms
      }
    }

    if (!sessionId) {
      throw 'Failed to retrieve session id';
    }

    return {
      sessionId: sessionId,
      expiration: expiration
    };
  }

  function createWebRTCSession(args) {
    logger.logDebug('createWebRTCSession');

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
          'Authorization': args.token,
          'x-e911Id': args.e911Id || '',
          'x-Arg': 'ClientSDK=WebRTCTestAppJavascript1'
        }
      },
      success: function (responseObj) {
        logger.logInfo('Successfully created web rtc session on blackflag');
        args.onWebRTCSessionCreated(extractSessionInformation(responseObj));
      },
      error: args.onError
    });
  }

  function refreshWebRTCSession(args) {
    var dataForRefreshWebRTCSession = {
      params: {
        url: [args.sessionId],
        headers: {
          'Authorization': args.token
        }
      },
      success: function () {
        logger.logInfo('Successfully refreshed web rtc session on blackflag');
        args.onWebRTCSessionRefreshed();
      },
      error: args.onError
    };

    // Call BF to refresh WebRTC Session.
    resourceManager.doOperation('refreshWebRTCSession', dataForRefreshWebRTCSession);
  }

  function deleteWebRTCSession(args) {
    var dataForDeleteWebRTCSession = {
      params: {
        url: [args.sessionId],
        headers: {
          'Authorization': args.token,
          'x-e911Id': args.e911Id
        }
      },
      success: function () {
        logger.logInfo('Successfully deleted web rtc session on blackflag');
        args.onWebRTCSessionDeleted();
      },
      error: args.onError
    };

    // Call BF to delete WebRTC Session.
    resourceManager.doOperation('deleteWebRTCSession', dataForDeleteWebRTCSession);
  }

  function keepAlive(args) {
    logger.logDebug('keepSessionAlive');

    var keepAliveDuration = app.appConfig.KeepAlive || this.getExpiration(), // developer configured duration overrides the one set by API server
      timeBeforeExpiration = 5 * 60 * 1000, // refresh 5 minutes before expiration
      timeout = (keepAliveDuration > timeBeforeExpiration) ? (keepAliveDuration - timeBeforeExpiration) : keepAliveDuration;

    this.keepAliveInterval = setInterval(function () {
      logger.logInfo('Trying to refresh session after ' + (timeout / 1000) + ' seconds');

      refreshWebRTCSession({
        sessionId: this.getSessionId(),
        token: this.getAccessToken(),
        onWebRTCSessionRefreshed: function () {
          args.onSessionAlive('Next refresh in ' + (timeout / 1000) + ' seconds');
        },
        onError: args.onError
      });
    }, timeout);
  }

  function clearKeepAlive() {
    logger.logDebug('clearKeepAlive');
    clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = null;
  }

  function clearSession(args) {
    var session = this,
      deleteAllCalls = function () {
        var callId;
        if (session.calls && Object.keys(session.calls) > 0) {
          for (callId in session.calls) { // delete all exisinting calls
            if (session.calls.hasOwnProperty(callId)) {
              session.deleteCall(callId);
            }
          }
        }
      },
      deleteSession = function () {
        deleteWebRTCSession({
          sessionId: session.getSessionId(),
          token: session.getAccessToken(),
          e911Id: session.getE911Id(),
          onWebRTCSessionDeleted: function () {
            session.clearKeepAlive(); // clear keep alive interval
            args.onSessionCleared();
          },
          onError: handleError.bind(session, 'DeleteSession', args.onError)
        });
      };

    if (session.currentCall) {
      session.currentCall.end({
        onCallEndInitiated: function () {
          deleteAllCalls();
          deleteSession();
        },
        onError: handleError.bind(session, 'DeleteSession', args.onError)
      });
    } else {
      deleteAllCalls();
      deleteSession();
    }
  }

  function startCall(options) {
    logger.logDebug('startCall');

    options.factories.createCall(app.utils.extend(options, {
      onCallCreated: function (callObj) {
        if (callObj) {
          this.setCall(callObj);
          this.setCurrentCall(callObj);
          options.onCallStarted(callObj);
        }
      },
      onCallError: handleError.bind(this, 'CreateCall', options.onCallError)
    }));
  }

  /**
  * session prototype
  * @param {String} sessionId The sessionId
  * @param {String} expiration The expiration duration
  * @param {String} token The access token
  * @param {String} e9Id The e911Id
  */
  function session(args) {
    // private attributes
    var sessionId = args.sessionId,
      expiration = args.expiration,
      accessToken = args.token,
      e911Id = args.e911Id,
      currentCall = null,
      calls = {};

    return {
      // public attributes
      keepAliveInterval: null,

      // public methods
      getSessionId: function () {
        return sessionId;
      },
      getExpiration: function () {
        return expiration;
      },
      getAccessToken: function () {
        return accessToken;
      },
      getE911Id: function () {
        return e911Id;
      },
      keepAlive: keepAlive,
      clearKeepAlive: clearKeepAlive,
      clearSession: clearSession,
      startCall: startCall,
      getCalls: function () {
        return calls;
      },
      getCall: function (callId) {
        return calls[callId];
      },
      setCall: function (callObj) {
        calls[callObj.id] = callObj;
      },
      deleteCall: function (callId) {
        calls[callId] = null;
        delete calls[callId];
      },
      getCurrentCall: function () {
        return currentCall;
      },
      setCurrentCall: function (callObj) {
        currentCall = callObj;
      },
      deleteCurrentCall: function () {
        currentCall = null;
      }
    };
  }

  /**
  * Create a new session
  * @param {Object} options The options
  * createSession({
  *   token: 'abcd'
  *   e911Id: 'e911Id'
  * })
  */
  function createSession(options) {
    errMgr = options.errorManager;
    resourceManager = options.resourceManager;
    logger = resourceManager.getLogger('Session');

    logger.logDebug('createSession');

    createWebRTCSession({
      token: options.token,
      e911Id: options.e911Id,
      onWebRTCSessionCreated: function (sessionInfo) {
        if (sessionInfo) {
          var sessObj = session({
            sessionId: sessionInfo.sessionId,
            token: options.token,
            e911Id: options.e911Id,
            expiration: sessionInfo.expiration
          });

          // keep web rtc session alive
          sessObj.keepAlive({
            onSessionAlive: function (msg) {
              logger.logInfo(msg);
            },
            onError: handleError.bind(this, 'RefreshSession', options.onError)
          });

          options.onSessionCreated(sessObj);
        }
      },
      onError: handleError.bind(this, 'CreateSession', options.onError)
    });
  }

  app.factories.createSession = createSession;
}(ATT || {}));
