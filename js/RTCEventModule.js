/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env:true, cmgmt:true, EventDispatcher:true*/

//Dependency: Env.resourceManager, utils.eventDispatcher (cyclic), utils.sdpParser, cmgmt.CallManager

/*
if (!ATT) {
  var ATT = {};
}
*/

(function (mainModule) {
  'use strict';

  var callManager = cmgmt.CallManager.getInstance(),
    logger = Env.resourceManager.getInstance().getLogger("RTCEventModule"),
    session = callManager.getSessionContext(),
    module = {},
    instance,
    RTCEvent,
    interceptEventChannelCallback,
    setupEventBasedCallbacks,
    eventRegistry,
    init = function () {
      return {
        setupEventBasedCallbacks: setupEventBasedCallbacks,
        createEvent: module.createEvent
      };
    };

  /**
  * Dispatch Event to Registry
  * @param {Object} event The event object
  *
  */
  function dispatchEventToHandler(event) {
    setTimeout(function () {
      var CODEC = [], media, sdp, idx;
      logger.logDebug('dispatching event: ' + event.state);

      if (event.sdp) {
        sdp = ATT.sdpParser.getInstance().parse(event.sdp);
        logger.logDebug("Parsed SDP " + sdp);
        for (idx = 0; idx < sdp.media.length; idx = idx + 1) {
          media = {
            rtp: sdp.media[idx].rtp,
            type: sdp.media[idx].type
          };
          CODEC.push(media);
        }
      }
      logger.logDebug("Codec from the event, " + CODEC);
      if (eventRegistry[event.state]) {
        logger.logDebug("Processing the registered event " + event.state);
        eventRegistry[event.state](ATT.RTCEvent.getInstance().createEvent({
          from: event.from ? event.from.split('@')[0].split(':')[1] : '',
          to: session && session.getCallObject() ? session.getCallObject().callee() : '',
          state: event.state,
          codec: CODEC,
          calltype: (CODEC.length > 0 && CODEC.length === 1) ? 'audio' : 'video',
          error: event.reason || ''
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
  interceptEventChannelCallback = function (event) {
    if (!event) {
      logger.logError("Not able to consume null event...");
      return;
    }

    logger.logDebug('Cosnume event from event channel', JSON.stringify(event));

    dispatchEventToHandler(event);

    // set current event on the session
    callManager.getSessionContext().setEventObject(event);
  };

  /**
    This function subscribes to all events 
    being published by the event channel.
    It hands off the event to interceptingEventChannelCallback()
  */
  setupEventBasedCallbacks = function () {
    // get current session context
    var sessionContext = callManager.getSessionContext(),
      sessionId = sessionContext.getSessionId();
    logger.logDebug("Creating event registry...");
    // setup events registry
    eventRegistry = mainModule.utils.createEventRegistry(sessionContext, module.getInstance());

    // unsubscribe first, to avoid double subscription from previous actions
    mainModule.event.unsubscribe(sessionId + '.responseEvent', interceptEventChannelCallback);
    logger.logDebug("Unsubscribe event " +  sessionId + '.responseEvent' + "successful");
    // subscribe to published events from event channel
    mainModule.event.subscribe(sessionId + '.responseEvent', interceptEventChannelCallback);
    logger.logDebug("Subscribed to event " +  sessionId + '.responseEvent');
  };

  //Event structure for RTCEvent
  /** Event Object structure for RTC Event
   * @memberof ATT.rtc.Phone
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

  module.createEvent = function (arg) {
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
    evt.error = arg.error;
    Object.freeze(evt);
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