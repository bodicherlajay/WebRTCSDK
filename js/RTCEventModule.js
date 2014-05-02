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
    interceptingEventChannelCallback,
    subscribeEvents,
    eventRegistry,
    init = function () {
      eventRegistry = mainModule.utils.createEventRegistry(callManager.getSessionContext());
      return {
        hookupEventsToUICallbacks: subscribeEvents
      };
    };

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
  * Subscribes to all Event Channel announcemets
  * and triggers UI callbacks
  * @param {Object} event The event object
  */
  interceptingEventChannelCallback = function (event) {
    if (!event) {
      return;
    }

    console.log('New Event: ', JSON.stringify(event));

    console.log('dispatching event: ' + event.state);
    dispatchEventToHandler(event);

    // set current event on the session
    callManager.getSessionContext().setEventObject(event);
  };

  subscribeEvents = function () {
    var sessionId = callManager.getSessionContext().getSessionId();

    // unsubscribe first, to avoid double subscription from previous actions
    mainModule.event.unsubscribe(sessionId + '.responseEvent', interceptingEventChannelCallback);
    // subscribe to hook up callbacks to events
    mainModule.event.subscribe(sessionId + '.responseEvent', interceptingEventChannelCallback);
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