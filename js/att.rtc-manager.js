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

  function formatNumber(number) {
    var callable = ATT.rtc.Phone.cleanPhoneNumber(number);
    if (!callable) {
      logger.logWarning('Phone number not formatable .');
      return;
    }
    logger.logInfo('The formated Number' + callable);
    return ATT.phoneNumber.stringify(callable);
  }

  /**
   *  Removes extra characters from the phone number and formats it for
   *  clear display
   */
  function cleanPhoneNumber(number) {
    var callable;
    //removes the spaces form the number
    callable = ATT.phoneNumber.getCallable(number.replace(/\s/g, ''));

    if (!callable) {
      logger.logWarning('Phone number not callable.');
      return;
    }

    logger.logInfo('checking number: ' + callable);

    if (callable.length < 10) {

      if (number.charAt(0) === '*') {
        callable = '*' + callable;
      }

      if (!ATT.SpecialNumbers[callable]) {
        ATT.Error.publish('SDK-20027', null, function (error) {
          logger.logWarning('Undefined `onError`: ' + error);
        });
        return;
      }
    }

    logger.logWarning('found number in special numbers list');

    return callable;
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
          session: session,
          rtcEvent: rtcEvent,
          resourceManager: resourceManager,
          errorManager: errMgr,
          onEventManagerCreated: function (evtMgr) {
            eventManager = evtMgr;

            // fire the session created event
            eventManager.publishEvent({
              state: app.SessionEvents.RTC_SESSION_CREATED
            });

          },
          onEventCallback: function (callback, event) {
            options.onCallbackCalled(callback, event);
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

    eventManager.hookupUICallbacks({
      callbacks: options.callbacks,
      onUICallbacksHooked: function () {
        logger.logInfo('UI Call backs hooked to events successfully');

        // Here, we publish `onConnecting`
        // event for the UI
        eventManager.publishRTCEvent({
          state: app.RTCCallEvents.CALL_CONNECTING,
          to: options.to
        });
    
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
      },
      onError: handleError.bind(this, 'HookUICallbacks', options.onError)
    });
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
      dialCall: dialCall,
      cleanPhoneNumber: cleanPhoneNumber,
      formatNumber: formatNumber
    };
  }

  app.factories.createRTCManager = createRTCManager;
}(ATT || {}));
