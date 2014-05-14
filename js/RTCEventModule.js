/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env:true, cmgmt:true, EventDispatcher:true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';

  var callManager = cmgmt.CallManager.getInstance(),
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
    from = event.from ? event.from.split('@')[0].split(':')[1] : '';
    to = callManager.getSessionContext().getCallObject() ? callManager.getSessionContext().getCallObject().callee() : '';
    state = event.state;
    error = event.reason || '';
    data.sdp = event.sdp || '';
    data.resource = event.resourceURL || '';
    data.modId = event.modId || '';

    if (eventRegistry[event.state]) {
      var fn = eventRegistry[event.state];
      uiEvent = ATT.RTCEvent.getInstance().createEvent(from, to, state, codec, error);
      fn(uiEvent, data);
    } else {
      console.log('No event handler defined for ' + event.state.NETWORK);
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
    var session = callManager.getSessionContext(),
      sessionId = session.getSessionId();

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
    from: '',
    to: '',
    timeStamp: '',
    state: '',
    codec: '',
    data: '',
    error: ''
  };

  module.createEvent = function (from, to, state, codec, error) {
    if (state.hasOwnProperty(ATT.CallStatus)) {
      throw new Error('State must be of type ATT.CallStatus');
    }
    var evt = Object.create(RTCEvent);
    evt.from = from;
    evt.to = to;
    evt.state = state;
    evt.error = error;
    evt.timestamp = new Date();
    evt.codec = codec;
    // need to discuss. placed to appease sample app.
    evt.data = '1234';
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