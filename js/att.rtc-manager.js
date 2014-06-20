/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function () {
  'use strict';

  var factories = ATT.factories,
    errMgr,
    session,
    rtcEvent,
    resourceManager,
    userMediaSvc,
    peerConnSvc,
    logger;

  function handleError(operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);

    logger.logInfo('There was an error performing operation ' + operation);

    var error = errMgr.create(err, operation);

    if (typeof errHandler === 'function') {
      errHandler(error);
    }
  }

 /**
   *  Removes extra characters from the phone number and formats it for
   *  clear display
   */
  function cleanPhoneNumber(number) {
    var callable, cleaned;
    //removes the spaces form the number
    callable = number.replace(/\s/g, '');

    if (ATT.SpecialNumbers[number]) {
      return number;
    }

    callable = ATT.phoneNumber.getCallable(callable);

    if (callable) {
      return callable;
    }
    logger.logWarning('Phone number not callable, will check special numbers list.');
    logger.logInfo('checking number: ' + callable);
    cleaned = ATT.phoneNumber.translate(number);
    console.log('ATT.SpecialNumbers[' + cleaned + '] = ' + cleaned);
    if (number.charAt(0) === '*') {
      cleaned = '*' + cleaned;
    }
    ATT.Error.publish('SDK-20027', null, function (error) {
      logger.logWarning('Undefined `onError`: ' + error);
    });
  }

  function formatNumber(number) {
    var callable = cleanPhoneNumber(number);
    if (!callable) {
      logger.logWarning('Phone number not formatable .');
      return;
    }
    if (number.length <= 10) {
      return callable;
    }
    logger.logInfo('The formated Number' + callable);
    return ATT.phoneNumber.stringify(callable);
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
  * mute call
  *
  */
  function muteCall() {
    if (!session) {
      throw 'No session found . Please login first';
    }
    if (!session.getCurrentCall()) {
      throw 'No current call. Please establish a call first.';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    session.getCurrentCall().mute();
  }

  /**
  * unmute call
  *
  */
  function unmuteCall() {
    if (!session) {
      throw 'No session found . Please login first';
    }
    if (!session.getCurrentCall()) {
      throw 'No current call. Please establish a call first.';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    session.getCurrentCall().unmute();
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
        state: app.RTCCallEvents.SESSION_TERMINATED,
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
  function createRTCManager(options) {
    var eventManager;

    errMgr = options.errorManager;
    resourceManager = options.resourceManager;
    rtcEvent = options.rtcEvent;
    userMediaSvc = options.userMediaSvc;
    peerConnSvc = options.peerConnSvc;


    logger = resourceManager.getLogger("RTCManager");

    logger.logDebug('createRTCManager');


    eventManager = factories.createEventManager({
      resourceManager: resourceManager,
      errorManager: errMgr
    });

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

    }

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
          eventManager.stop();
          options.onSessionDisconnected();
        },
        error: function (error) {
          logger.logError(error);
        }
      });
    }

    return {
      connectSession: connectSession,
      disconnectSession: disconnectSession
    };
  }

  if (undefined === ATT.factories) {
    throw new Error('Error exporting `createRTCManager`');
  }
  ATT.factories.createRTCManager = createRTCManager;
}());
