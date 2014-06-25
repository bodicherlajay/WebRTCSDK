/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function () {
  'use strict';

  var factories = ATT.factories,
    errMgr,
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

   //Do put operation to set the new E911Id for the current session
  function refreshWebRTCSessionWithE911Id(args) {
    var dataForRefreshWebRTCSessionWithE911Id = {
      data: {
        "e911Association": { "e911Id": args.e911Id }
      },
      params: {
        url: [args.sessionId],
        headers: {
          'Authorization': args.token,
        }
      },
      success: args.onSuccess,
      error: args.onError
    };

    // Call BF to refresh WebRTC Session.
    resourceManager.doOperation('refreshWebRTCSessionWithE911Id', dataForRefreshWebRTCSessionWithE911Id);
  }

   // methods takes on the e911Id and refresh the session with he new ID
  function updateE911Id(args) {
    // the session object will contain the token ,sessionId
    var self = this;
    logger.logDebug('Updated e911ID in session object');
    logger.logDebug('Triggres the refresh session with new e911 address ');
    refreshWebRTCSessionWithE911Id({
      sessionId: this.getSessionId(),
      token: this.getAccessToken(),
      e911Id: this.getE911Id(),
      onSuccess: function () {
        self.setE911Id(args.e911Id);
        args.onSuccess();
      },
      onError: args.onError
    });
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

    var keepAliveDuration = ATT.appConfig.KeepAlive || this.getExpiration(), // developer configured duration overrides the one set by API server
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
    var session = this;

    options.factories.createCall(ATT.utils.extend(options, {
      session: session,  // TODO: this should not be needed once we refactor UM and PC
      onCallCreated: function (callObj) {
        try {
          if (!callObj) {
            throw 'Failed to create the call';
          }
          session.setCall(callObj);
          session.setCurrentCall(callObj);
          options.onCallStarted(callObj);
        } catch (err) {
          handleError.call(session, 'CreateCall', options.onCallError, err);
        }
      },
      onCallError: handleError.bind(session, 'CreateCall', options.onCallError)
    }));
  }
//  function endCall(call) {
//    call.on('disconnected', function () {
//      deleteCall(call.id);
//    })
//    call.disconnect();
//  }

  function on(event, handler) {

    if ('ready' !== event &&
      'connecting' !== event &&
      'connected' !== event &&
      'updating' !== event &&
      'needs-refresh' !== event &&
      'disconnecting' !== event &&
      'disconnected' !== event &&
      'allcallsterminated' !== event) {
      throw new Error('Event not defined');
    }

    ATT.event.unsubscribe(event, handler);
    ATT.event.subscribe(event, handler, this);
  }

  /**
  * session prototype
  * @param {String} sessionId The sessionId
  * @param {String} expiration The expiration duration
  * @param {String} token The access token
  * @param {String} e9Id The e911Id
  */
  function Session() {

    // dependencies
    var rtcManager,
      // private attributes
      id = null,
      calls = {};

    rtcManager = factories.createRTCManager({
      errMgr : ATT.error,
      resourceManager : Env.resourceManager.getInstance(),
      rtcEvent : ATT.RTCEvent,
      userMediaSvc : ATT.UserMediaService,
      peerConnSvc : ATT.PeerConnectionService
    });

    // public attributes
    this.timeout = null;
    this.token = null;
    this.e911Id = null;
    this.currentCall = null;
    this.timer = null;

    // public methods
    this.on = on.bind(this);

    this.getId = function () {
      return id;
    };

    this.setId = function (sessionId) {
      id = sessionId;

      if (null === sessionId) {
        ATT.event.publish('disconnected');
        return;
      }

      ATT.event.publish('connected');
    };

    this.update = function update(options) {
      if (options === undefined) {
        throw new Error('No options provided');
      }

      if ('number' !== typeof options.timeout) {
        throw new Error('Timeout is not a number.');
      }

      this.timeout = options.timeout || this.timeout;
      this.token = options.token || this.token;
      this.e911Id = options.e911Id || this.e911Id;

      ATT.event.publish('updating', options);

      if (undefined !== options.timeout) {
        var i = 0;
        if (this.timer !== null) {
          clearInterval(this.timer);
        }
        this.timer = setInterval(function () {
          ATT.event.publish('needs-refresh', i++);
        }, this.timeout - 60000);
      }
    };

    this.connect =   function connect(options) {
      if (!options) {
        throw 'No input provided';
      }
      if (!options.token) {
        throw 'No access token provided';
      }
      this.token = options.token;
      this.e911Id = options.e911Id;

      ATT.event.publish('connecting');

      var session = this;

      rtcManager.connectSession({
        token: options.token,
        e911Id: options.e911Id,
        onSessionConnected: function (sessionInfo) {
          session.setId(sessionInfo.sessionId);
          session.update({
            timeout: sessionInfo.timeout
          });
        },
        onSessionReady: function (data) {
          ATT.event.publish('ready', data);
        }
      });
    };

    this.disconnect =   function () {
      ATT.event.publish('disconnecting');

      var session = this;

      rtcManager.disconnectSession({
        sessionId: session.getId(),
        token: session.token,
        e911Id: session.e911Id,
        onSessionDisconnected: function () {
          session.setId(null);
        }
      });
    };

    this.terminateCalls = function () {
      var callId;
      for (callId in calls) {
        if (calls.hasOwnProperty(callId)) {
          calls[callId].disconnect();
        }
      }
    };

    this.addCall = function (callObj) {
      calls[callObj.id] = callObj;
    };

    this.getCall = function (callId) {
      return calls[callId];
    };

    this.deleteCall =   function deleteCall(callId) {
      var call = this.getCall(callId);
      if (call === undefined) {
        throw new Error("Call not found");
      }
      delete calls[call.id];
      call = null;

      if (Object.keys(calls).length === 0) {
        ATT.event.publish('allcallsterminated');
      }
    };
  }

  if (undefined === ATT.rtc) {
    throw new Error('Cannot export Session. ATT.rtc is undefined');
  }
  ATT.rtc.Session = Session;

}());
