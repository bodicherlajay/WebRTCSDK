/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env:true, cmgmt:true, EventDispatcher:true*/

//Dependency: Env.resourceManager, utils.eventDispatcher (cyclic), utils.sdpParser, cmgmt.CallManager

(function (mainModule) {
  'use strict';

  var callManager = cmgmt.CallManager.getInstance(),
    logger = Env.resourceManager.getInstance().getLogger("RTCEventModule"),
    session,
    module = {},
    instance,
    createEvent,
    RTCEvent,
    setupEventBasedCallbacks,
    eventRegistry,
    init = function () {
      return {
        setupEventBasedCallbacks: setupEventBasedCallbacks,
        createEvent: createEvent
      };
    };

   /* Mapping the event state to the UI event object
    * maps the values from att.enum.js
    * @param {Object} event object
    * @returns {Number} event state
    */
  function setUIEventState(event) {
    if (event.state) {
      if (event.state === mainModule.RTCCallEvents.SESSION_TERMINATED) {
        if (event.reason) {
          return mainModule.CallStatus.ERROR;
        }
        return mainModule.CallStatus.ENDED;
      }
      if (mainModule.EventsMapping[event.state]) {
        return mainModule.EventsMapping[event.state];
      }
    }
    return event.state;
  }

  /**
  * Dispatch Event to Registry
  * @param {Object} event The event object
  * @param {Object} callManager Instance of Call Manager
  */
  function dispatchEventToHandler(event) {
    session = callManager.getSessionContext();

    setTimeout(function () {
      var CODEC = [], media, sdp, idx, calltype = '';

      logger.logDebug('dispatching event: ' + event.state);

      if (event.sdp) {
        sdp = ATT.sdpParser.getInstance().parse(event.sdp);
        logger.logDebug('Parsed SDP ' + sdp);
        for (idx = 0; idx < sdp.media.length; idx = idx + 1) {
          media = {
            rtp: sdp.media[idx].rtp,
            type: sdp.media[idx].type
          };
          CODEC.push(media);
        }
        calltype = (CODEC.length === 1) ? 'audio' : 'video';
        session.setCallType(calltype);
      }
      logger.logDebug('Codec from the event, ' + CODEC);
      if (eventRegistry[event.state]) {
        logger.logDebug("Processing the registered event " + event.state);
        eventRegistry[event.state](createEvent({
          from: event.from ? event.from.split('@')[0].split(':')[1] : '',
          to: session && session.getCallObject() ? session.getCallObject().callee() : '',
          state: setUIEventState(event),
          codec: CODEC,
          calltype: calltype,
          data: event.data,
          error: event.error || event.reason || ''
        }), {
          sdp: event.sdp || '',
          resource: event.resourceURL || '',
          modId: event.modId || ''
        });
      } else {
        logger.logError('No event handler defined for ' + event.state);
      }
    }, 0);
  }
  /*
  * Subscribes to all Event Channel announcements
  * and triggers UI callbacks
  * @param {Object} event The event object
  */
  function interceptEventChannelCallback(event) {
    if (!event) {
      logger.logError('Not able to consume null event...');
      return;
    }

    logger.logDebug('Consume event from event channel', JSON.stringify(event));

    // set current event on the session
    callManager.getSessionContext().setEventObject(event);

    dispatchEventToHandler(event, callManager);
  }

  /**
    This function subscribes to all events 
    being published by the event channel.
    It hands off the event to interceptingEventChannelCallback()
  */
  setupEventBasedCallbacks = function () {
    logger.logDebug("setupEventBasedCallbacks");

    // get current session context
    session = callManager.getSessionContext();

    var sessionId = session.getSessionId();

    logger.logInfo("Creating event registry...");

    // setup events registry
    eventRegistry = mainModule.utils.createEventRegistry(session);

    // unsubscribe first, to avoid double subscription from previous actions
    mainModule.event.unsubscribe(sessionId + '.responseEvent', interceptEventChannelCallback);
    logger.logInfo('Unsubscribe event ' +  sessionId + '.responseEvent' + 'successful');

    // subscribe to published events from event channel
    mainModule.event.subscribe(sessionId + '.responseEvent', interceptEventChannelCallback);
    logger.logInfo('Subscribed to event ' +  sessionId + '.responseEvent');
  };

  //Event structure for RTCEvent
  /** Event Object structure for RTC Event
   * @param from Origination party
   * @param to  Destination party
   * @param state Call State
   * @param codec Audio/Video Codec
   * @param error Error Description
   * @type {{from: string, to: string, timeStamp: string, state: string, codec: array, error: string}}
   */
  RTCEvent = {
    from: '',
    to: '',
    timeStamp: '',
    state: '',
    codec: [],
    calltype: '',
    data: null,
    error: null
  };

  createEvent = function (arg) {
    logger.logDebug("Creating event " + arg.state);

    if (arg.state.hasOwnProperty(ATT.CallStatus)) {
      throw new Error('State must be of type ATT.CallStatus');
    }

    var evt = Object.create(RTCEvent);
    evt.state = arg.state;
    evt.from = arg.from;
    evt.to = arg.to;
    evt.timestamp = new Date();
    evt.codec = arg.codec;
    evt.calltype = arg.calltype;
    evt.data = arg.data;
    evt.error = mainModule.Error.create(arg.error);
    Object.freeze(evt);

    logger.logTrace('Created event object', evt);
    return evt;
  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  mainModule.RTCEvent = module;
}(ATT || {}));