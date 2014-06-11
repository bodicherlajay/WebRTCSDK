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


  function mapEventNameToCallback(callEvent) {
    switch(callEvent) {
    case app.CallStatus.SESSION_READY:  return  'onSessionReady';
    case app.CallStatus.SESSION_DELETED:return  'onLogout';
    case app.CallStatus.SESSION_ERROR:  return  'onError';
    case app.CallStatus.CONNECTING:     return  'onConnecting';
    case app.CallStatus.CALLING:        return  'onCalling';
    case app.CallStatus.RINGING:        return  'onIncomingCall';
    case app.CallStatus.ESTABLISHED:    return  'onCallEstablished';
    case app.CallStatus.INPROGRESS:     return  'onCallInProgress';
    case app.CallStatus.HOLD:           return  'onCallHold';
    case app.CallStatus.RESUMED:        return  'onCallResume';
    case app.CallStatus.TRANSITION:     return  'onSessionReady';
    case app.CallStatus.WAITING:        return  'onCallWaiting';
    case app.CallStatus.ENDED:          return  'onCallEnded';
    case app.CallStatus.ERROR:          return  'onCallError';
    default:                            return  null;
    }
  }

  function processCurrentEvent () {
    var currentEvent = this.getCurrentEvent(),
      state = currentEvent.state;

    switch(state) {
    case app.SessionEvents.RTC_SESSION_CREATED:
      this.onEvent(rtcEvent.createRTCEvent({
        state: app.CallStatus.SESSION_READY,
        data: {
          sessionId: this.getSession().getSessionId()
        }
      }));
      break;
    case app.RTCCallEvents.CALL_CONNECTING:
      this.onEvent(rtcEvent.createRTCEvent({
        state: app.CallStatus.CONNECTING,
        to: currentEvent.to
      }));
      break;
    case app.RTCCallEvents.CALL_RINGING:
      this.onEvent(rtcEvent.createRTCEvent({
        state: app.CallStatus.CALLING,
        to: currentEvent.to
      }));
      break;
    case app.RTCCallEvents.INVITATION_RECEIVED:
      // Added a getCodec method to the util to get access the codec
      var CODEC =  ATT.sdpFilter.getInstance().getCodecfromSDP(currentEvent.sdp),
        mediaType = (CODEC.length === 1) ? 'audio' : 'video';

      this.onEvent(rtcEvent.createRTCEvent({
        state: app.CallStatus.RINGING,
        from: currentEvent.from
      }), {
        id: currentEvent.resourceURL.split('/')[6],
        from: currentEvent.from,
        mediaType: mediaType,
        remoteSdp: currentEvent.sdp
      });
      break;
    case app.RTCCallEvents.MODIFICATION_RECEIVED:
      this.onEvent(null, {
        action: 'accept-mods',
        sdp: currentEvent.sdp,
        modId: currentEvent.modId
      });
      break;
    case app.RTCCallEvents.MODIFICATION_TERMINATED:
      this.onEvent(null, {
        action: 'term-mods',
        sdp: currentEvent.sdp,
        modId: currentEvent.modId
      });
      break;
    case app.RTCCallEvents.SESSION_OPEN:
      this.onEvent(rtcEvent.createRTCEvent({
        state: app.CallStatus.ESTABLISHED,
        from: currentEvent.from
      }), {
        sdp: currentEvent.sdp
      });
      break;
    case app.RTCCallEvents.CALL_IN_PROGRESS:
      this.onEvent(rtcEvent.createRTCEvent({
        state: app.CallStatus.INPROGRESS
      }));
      break;
    case app.RTCCallEvents.SESSION_TERMINATED:
      if (currentEvent.reason) {
        this.onEvent(rtcEvent.createRTCEvent({
          state: app.CallStatus.ERROR,
          error: errMgr.create(currentEvent.reason)
        }));
      } else {
        this.onEvent(rtcEvent.createRTCEvent({
          state: app.CallStatus.ENDED
        }));
      }
      break;
    default:
      logger.logError('Event with state ' + currentEvent.state + ' not handled');
    }
  }

  /*
  * Subscribes to all Event Channel announcements
  * and triggers UI callbacks
  * @param {Object} event The event object
  */
  function interceptEventChannelEvent(event) {
    if (!event) {
      logger.logError('Not able to consume null event...');
      return;
    }

    logger.logDebug('Consume event from event channel', JSON.stringify(event));

    // set current event
    this.setCurrentEvent(event);

    this.processCurrentEvent();
  }

  /**
    This function subscribes to all events 
    being published by the event channel.
    It hands off the event to interceptingEventChannelCallback()
  */
  function setupEventInterceptor(options) {
    try {
      logger.logDebug("setupEventInterceptor");
  
      var sessionId = this.getSession().getSessionId();
 
      // unsubscribe first, to avoid double subscription from previous actions
      app.event.unsubscribe(sessionId + '.responseEvent', interceptEventChannelEvent);
      logger.logInfo('Unsubscribe event ' +  sessionId + '.responseEvent' + 'successful');
  
      // subscribe to published events from event channel
      app.event.subscribe(sessionId + '.responseEvent', interceptEventChannelEvent, this);
      logger.logInfo('Subscribed to event ' +  sessionId + '.responseEvent');

      options.onEventInterceptorSetup();
    } catch (err) {
      handleError.call(this, 'SetupEventInterceptor', options.onError, err);
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

  function publishEvent(event) {
    ATT.event.publish(this.getSession().getSessionId() + '.responseEvent', event);
  }

  function eventManager(options) {
    var session = options.session,
      callbacks = options.callbacks,
      currentEvent = null;
    return {
      getSession: function () {
        return session;
      },
      getCurrentEvent: function () {
        return currentEvent;
      },
      setCurrentEvent: function (evt) {
        currentEvent = evt;
      },
      setupEventChannel: setupEventChannel,
      setupEventInterceptor: setupEventInterceptor,
      processCurrentEvent: processCurrentEvent,
      createRTCEvent: createRTCEvent,
      publishEvent: publishEvent,
      shutDown: shutDown
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

    logger.logInfo("Setting up event channel...");
    evtMgr.setupEventChannel({
      onEventChannelSetup: function () {
        logger.logInfo("Setting up events interceptor");
        evtMgr.setupEventInterceptor({
          onEventInterceptorSetup: function () {
            logger.logInfo('Events interceptor setup successfully');
            options.onEventManagerCreated(evtMgr);
          },
          onError: handleError.bind(this, 'SetupEventInterceptor', options.onError)
        });
      },
      onError: handleError.bind(this, 'SetupEventChannel', options.onError)
    });

    // event handler for callbacks
    evtMgr.onEvent = function(event, data) {
      var callback = event ? mapEventNameToCallback(event.state) : null;
      if (typeof evtMgr.onSessionEventCallback === 'function') {
        evtMgr.onSessionEventCallback(callback, event, data);
      }
      if (typeof evtMgr.onCallEventCallback === 'function') {
        evtMgr.onCallEventCallback(callback, event, data);
      }
    }
  }

  app.factories.createEventManager = createEventManager;
}(ATT || {}));
