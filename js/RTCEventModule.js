/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env:true, cmgmt:true, EventDispatcher:true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';

  var callManager = cmgmt.CallManager.getInstance(),
    session = callManager.getSessionContext(),
    module = {},
    instance,
    RTCEvent,
    interceptEventChannelCallback,
    setupEventBasedCallbacks,
    eventRegistry,
    from = '',
    to = '',
    state = '',
    codec = '',
    error,
    data = {},
    uiEvent = {},
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
    console.log('dispatching event: ' + event.state);

    if (eventRegistry[event.state]) {
      eventRegistry[event.state](ATT.RTCEvent.getInstance().createEvent({
        from: event.from ? event.from.split('@')[0].split(':')[1] : '',
        to: session && session.getCallObject() ? session.getCallObject().callee() : '',
        state: event.state,
        error: event.reason || ''
      }), {
        sdp: event.sdp || '',
        resource: event.resourceURL || '',
        modId: event.modId || ''
      });
    } else {
      console.log('No event handler defined for ' + event.state);
    }
  }

  /*
  * Subscribes to all Event Channel announcements
  * and triggers UI callbacks
  * @param {Object} event The event object
  */
  interceptEventChannelCallback = function (event) {
    if (!event) {
      return;
    }

    console.log('New Event: ', JSON.stringify(event));

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
    var sessionId = session.getSessionId();

    // setup events registry
    eventRegistry = mainModule.utils.createEventRegistry(session);

    // unsubscribe first, to avoid double subscription from previous actions
    mainModule.event.unsubscribe(sessionId + '.responseEvent', interceptEventChannelCallback);
    // subscribe to published events from event channel
    mainModule.event.subscribe(sessionId + '.responseEvent', interceptEventChannelCallback);
    console.log('Subscribed to events');
  };

  //Event structure for RTCEvent
  /** Event Object structure for RTC Event
   * @memberof ATT.rtc.Phone
   * @param from Origination party
   * @param to  Destination party
   * @param state Call State
   * @param codec Audio/Video Codec
   * @param error Error Description
   * @type {{from: string, to: string, timeStamp: string, state: string, error: string}}
   */
  RTCEvent = {
    state: '',
    from: '',
    to: '',
    timeStamp: '',
    codec: '',
    data: null,
    error: null
  };

  module.createEvent = function (arg) {
    console.log(arg.state);
    if (arg.state.hasOwnProperty(ATT.CallStatus)) {
      throw new Error('State must be of type ATT.CallStatus');
    }
    var evt = Object.create(RTCEvent);
    evt.state = arg.state;
    evt.from = arg.from;
    evt.to = arg.to;
    evt.timestamp = new Date();
    evt.codec = arg.codec;
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