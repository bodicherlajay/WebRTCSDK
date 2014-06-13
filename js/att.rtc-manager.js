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

            // configure event manager for session event callbacks
            eventManager.onSessionEventCallback = function (callback, event, data) {
              if (data) { // If data, SDK needs additional processing
                if (data.modId) { // media modification event, SDK need to take action
                  if (data.action === 'accept-mods') {
                    session.getCurrentCall().handleCallMediaModifications(event, data);
                  } else if (data.action === 'term-mods') {
                    session.getCurrentCall().handleCallMediaTerminations(event, data);
                  }
                } else { // invitation-received, create incoming call before passing ui event to UI
                  if (data.action === 'term-session') {
                    session.deleteCall(session.getCurrentCall().id());
                  }
                  if (event) {
                    if (event.state === app.CallStatus.RINGING) {
                      ATT.utils.extend(options, data);
                      session.startCall(ATT.utils.extend(options, {
                        type: app.CallTypes.INCOMING,
                        onCallStarted: function (callObj) {
                          logger.logInfo('onCallStarted ...');
                          options.onCallbackCalled(callback, event);
                        },
                        onCallError: handleError.bind(this, 'StartCall', options.onCallError),
                        errorManager: errMgr,
                        resourceManager: resourceManager,
                        userMediaSvc: userMediaSvc,
                        peerConnSvc: peerConnSvc
                      }));
                    } else if (event.state === app.CallStatus.ESTABLISHED) {
                      session.getCurrentCall().handleCallOpen(data);
                      options.onCallbackCalled(callback, event);
                    } else if (event.state === app.CallStatus.ENDED) {
                      options.onCallbackCalled(callback, event);
                    }
                  }
                }
                return;
              }

              // for all other UI events
              options.onCallbackCalled(callback, event);
            };

            // fire the session created event
            eventManager.publishEvent({
              state: app.SessionEvents.RTC_SESSION_CREATED
            });

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

function refreshSessionWithE911ID(args) {
    if (!session) {
      throw 'No session found to delete. Please login first';
    }
    session.updateE911Id({
      e911Id:args.e911Id,
      onSuccess:args.onSuccess,
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
      onCallAnswered: function() {
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
    if (!session.getCurrentCall()) {
      throw 'No current call. Please establish a call first.';
    }
    if (!eventManager) {
      throw 'No event manager found to start a call. Please login first';
    }

    session.getCurrentCall().hangupCall();
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
      throw 'No session found . Please login first';
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
      answerCall: answerCall,
      unmuteCall: unmuteCall,
      muteCall: muteCall,
      resumeCall: resumeCall,
      cancelCall: cancelCall,
      rejectCall: rejectCall,
      refreshSessionWithE911ID: refreshSessionWithE911ID,
      hangupCall: hangupCall,
      holdCall: holdCall,
      cleanPhoneNumber: cleanPhoneNumber,
      formatNumber: formatNumber
    };
  }

  app.factories.createRTCManager = createRTCManager;
}(ATT || {}));
