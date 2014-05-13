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
    interceptEventChannelCallback,
    setupEventBasedCallbacks,
    eventRegistry,
    init = function () {
      return {
        setupEventBasedCallbacks: setupEventBasedCallbacks
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

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  mainModule.RTCEvent = module;
}(ATT || {}));