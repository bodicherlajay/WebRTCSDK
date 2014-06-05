/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function (app) {
  'use strict';

  var callbacks = {},
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

    var session = this.getSession(),
      // Set event channel configuration
      // All parameters are required
      // Also, see appConfigModule
      channelConfig = {
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
      callbacks = app.utils.extend(callbacks, options.callbacks); // add to existing callbacks
      rtcEvent.setupEventBasedCallbacks({
        session: this.getSession(),
        callbacks: callbacks
      });
      options.onUICallbacksHooked();
    } catch (err) {
      handleError.call(this, 'HookUICallbacks', options.onError);
    }
  }

  function shutDown(options) {
    try {
      shutdownEventChannel();
      options.onShutDown();
    } catch (err) {
      handleError.call(this, 'ShutDown', options.onError);
    }
  }

  function createRTCEvent(options) {
    return rtcEvent.createEvent(options);
  }

  function publishRTCEvent(options) {
    ATT.event.publish(this.getSession().getSessionId() + '.responseEvent', this.createRTCEvent(options));
  }

  function eventManager(options) {
    var session = options.session;
    return {
      getSession: function () {
        return session;
      },
      setupEventChannel: setupEventChannel,
      hookupUICallbacks: hookupUICallbacks,
      shutDown: shutDown,
      createRTCEvent: createRTCEvent,
      publishRTCEvent: publishRTCEvent
    };
  }

  function createEventManager(options) {
    rtcEvent = options.rtcEvent;
    resourceManager = options.resourceManager;
    errMgr = options.errorManager;
    logger = resourceManager.getLogger("EventManager");

    logger.logDebug('createEventManager');

    var evtMgr = eventManager({
      session: options.session
    });

    // fire up the event channel after successfult create session
    logger.logInfo("Setting up event channel...");
    evtMgr.setupEventChannel({
      onEventChannelSetup: function () {
        // Hooking up UI callbacks based on events
        logger.logInfo("Hooking up UI callbacks based on events");
        evtMgr.hookupUICallbacks({
          callbacks: options.callbacks,
          onUICallbacksHooked: function () {
            logger.logInfo('UI Call backs hooked to events successfully');
            options.onEventManagerCreated(evtMgr);
          },
          onError: handleError.bind(this, 'HookUICallbacks', options.onError)
        });
      },
      onError: handleError.bind(this, 'SetupEventChannel', options.onError)
    });
  }

  app.factories.createEventManager = createEventManager;
}(ATT || {}));
