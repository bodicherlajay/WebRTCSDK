/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function (app) {
  'use strict';

  var errMgr,
    session,
    eventManager,
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
  * start a new session
  * @param {Object} options The options
  * rtcManager.startSession({
  *   token: 'abcd'
  *   e911Id: 'e911Id'
  * })
  */
  function startSession(options) {
    logger.logDebug('startSession');

    options.factories.createSession({
      factories: options.factories,
      token: options.token,
      e911Id: options.e911Id,
      onSessionCreated: function (sessionObj) {
        session = sessionObj; // store the newly created session

        options.factories.createEventManager({
          callbacks: options.callbacks,
          session: session,
          rtcEvent: rtcEvent,
          resourceManager: resourceManager,
          errorManager: errMgr,
          onEventManagerCreated: function (evtMgr) {
            eventManager = evtMgr;
            options.onSessionStarted(session);
          },
          onError: handleError.bind(this, 'CreateEventManager', options.onError)
        });
      },
      onError: handleError.bind(this, 'CreateSession', options.onError),
      errorManager: errMgr,
      resourceManager: resourceManager
    });
  }

  function getSession() {
    return session;
  }

  function deleteSession(options) {
    if (!session) {
      throw 'No session found to delete. Please login first';
    }

    session.clearSession({
      onSessionCleared: function () {
        try {
          session = null; // set session to null
          if (eventManager) {
            eventManager.shutDown({
              onShutDown: function () {
                eventManager = null;
                options.onSessionDeleted();
              },
              onError: handleError.bind(this, 'DeleteSession', options.onError)
            });
          } else {
            throw 'Session was cleared but there is no event manager instance to shut down.';
          }
        } catch (err) {
          handleError.call(this, 'DeleteSession', options.onError, err);
        }
      },
      onError: handleError.bind(this, 'DeleteSession', options.onError)
    });
  }

  function dialCall(options) {
    if (!session) {
      throw 'No session found to start a call. Please login first';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    session.startCall(ATT.utils.extend(options, {
      type: app.CallTypes.OUTGOING,
      onCallStarted: function (callObj) {
        options.onCallDialed(eventManager.createRTCEvent({
          state: app.CallStatus.CALLING,
          to: callObj.to
        }));
      },
      onCallError: handleError.bind(this, 'StartCall', options.onCallError),
      errorManager: errMgr,
      resourceManager: resourceManager,
      userMediaSvc: userMediaSvc,
      peerConnSvc: peerConnSvc
    }));
  }

  /**
  * Create a new RTC Manager
  * @param {Object} options The options
  * })
  */
  function createRTCManager(options) {
    errMgr = options.errorManager;
    resourceManager = options.resourceManager;
    rtcEvent = options.rtcEvent;
    userMediaSvc = options.userMediaSvc;
    peerConnSvc = options.peerConnSvc;
    logger = resourceManager.getLogger("RTCManager");

    logger.logDebug('createRTCManager');

    return {
      startSession: startSession,
      getSession: getSession,
      deleteSession: deleteSession,
      dialCall: dialCall
    };
  }

  app.factories.createRTCManager = createRTCManager;
}(ATT || {}));
