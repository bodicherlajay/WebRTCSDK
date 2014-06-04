/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function (app) {
  'use strict';

  var session,
    rtcEvent,
    resourceManager,
    errMgr,
    logger;

  function handleError(operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);

    logger.logInfo('There was an error performing operation ' + operation);

    var error = errMgr.create(err, operation);

    if (typeof errHandler === 'function') {
      errHandler(error);
    }
  }

  function setupEventChannel(options) {
    logger.logDebug('setupEventChannel');

    // Set event channel configuration
    // All parameters are required
    // Also, see appConfigModule
    var channelConfig = {
      accessToken: session.getAccessToken(),
      endpoint: app.appConfig.EventChannelConfig.endpoint,
      sessionId: session.getSessionId(),
      publisher: app.event,
      resourceManager: resourceManager,
      publicMethodName: 'getEvents',
      usesLongPolling: (app.appConfig.EventChannelConfig.type === 'longpolling')
    };

    app.utils.eventChannel = app.utils.createEventChannel(channelConfig);
    if (ATT.utils.eventChannel) {
      logger.logInfo('Event channel up and running');

      app.utils.eventChannel.startListening({
        success: function (msg) {
          logger.logInfo(msg);
        },
        error: options.onError
      });

      options.onEventChannelSetup();
    } else {
      throw 'Event channel setup failed';
    }
  }

  function shutdownEventChannel() {
    logger.logDebug('shutdownEventChannel');
    ATT.utils.eventChannel.stopListening();
    logger.logInfo('Event channel shutdown successfully');
  }

  function hookupUICallbacks(options) {
    try {
      rtcEvent.setupEventBasedCallbacks({
        session: session,
        callbacks: options.callbacks
      });
      options.onUICallbcaksHooked();
    } catch (err) {
      handleError.call(this, 'HookUICallbacks', options.onError)
    }
  }

  function createEventManager(options) {
    session = options.session;
    rtcEvent = options.rtcEvent;
    resourceManager = options.resourceManager;
    errMgr = options.errorManager;
    logger = resourceManager.getLogger("EventManager");

    logger.logDebug('createEventManager');

    // fire up the event channel after successfult create session
    logger.logInfo("Setting up event channel...");
    setupEventChannel({
      onEventChannelSetup: function () {        
        // Hooking up UI callbacks based on events
        logger.logInfo("Hooking up UI callbacks based on events");
        hookupUICallbacks({
          callbacks: options.callbacks,
          onUICallbacksHooked: function() {
            logger.logInfo('UI Call backs hooked to events successfully');
            options.onEventManagerCreated();
          },
          onError: handleError.bind(this, 'HookUICallbacks', options.onError)
        });
      },
      onError: handleError.bind(this, 'SetupEventChannel', options.onError)
    });
  }

  app.factories.createEventManager = createEventManager;
}(ATT || {}));
