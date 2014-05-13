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
    interceptingEventChannelCallback,
    subscribeToEvents,
    eventRegistry,
    init = function () {
      eventRegistry = mainModule.utils.createEventRegistry(callManager.getSessionContext());
      return {
        hookupEventsToUICallbacks: subscribeToEvents,
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
      var fn = eventRegistry[event.state];
      fn(event);
    } else {
      console.log("No event handler defined for " + event.event);
    }
  }

  /*
  * Subscribes to all Event Channel announcements
  * and triggers UI callbacks
  * @param {Object} event The event object
  */
  interceptingEventChannelCallback = function (event) {
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
  subscribeToEvents = function () {
    var sessionId = callManager.getSessionContext().getSessionId();

    // unsubscribe first, to avoid double subscription from previous actions
    mainModule.event.unsubscribe(sessionId + '.responseEvent', interceptingEventChannelCallback);
    // subscribe to published events from event channel
    mainModule.event.subscribe(sessionId + '.responseEvent', interceptingEventChannelCallback);
    console.log('Subscribed to events');
  };

  //Event structure for RTCEvent
  /** Event Object structure for RTC Event
   * @memberof ATT.rtc.Phone
   * @param from Origination party
   * @param to  Destination party
   * @param state Call State
   * @param error Error Description
   * @type {{from: string, to: string, timeStamp: string, state: string, error: string}}
   */
  RTCEvent = {
    from: "",
    to: "",
    timeStamp: "",
    state: "",
    error: ""
  };

  module.createEvent = function (from, to, state, error) {
    if (state.hasOwnProperty(ATT.CallStatus)) {
      throw new Error("State must be of type ATT.CallStatus");
    }
    var evt = Object.create(RTCEvent);
    evt.from = from;
    evt.to = to;
    evt.state = state;
    evt.error = error;
    evt.timestamp = new Date();
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