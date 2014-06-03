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
    logger = Env.resourceManager.getInstance().getLogger("RTCManager");

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
      token: options.token,
      e911Id: options.e911Id,
      onSessionCreated: function (sessionObj) {
        session = sessionObj; // store the newly created session

        options.factories.createEventManager({
          callbacks: options.callbacks
          session: session,
          rtcEvent: rtcEvent,
          resourceManager: resourceManager,
          onEventManagerCreated: function () {
            options.onSessionStarted(session);
          },
          onError: handleError.bind(this, 'CreateEventManager', options.onError)
        });
      },
      onError: handleError.bind(this, 'CreateSession', options.onError),
      errorManager: errMgr,
      resourceManager: options.resourceManager
    });
  }

  /**
  * Create a new RTC Manager
  * @param {Object} options The options
  * })
  */
  function createRTCManager(options) {
    logger.logDebug('createRTCManager');

    errMgr = options.errorManager;
    eventManager = options.eventManager;
    resourceManager = options.resourceManager;
    rtcEvent = options.rtcEvent;    

    return {
      startSession: startSession
    };
  }

  app.factories.createRTCManager = createRTCManager;
}(ATT || {}));
