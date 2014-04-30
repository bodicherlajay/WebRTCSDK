/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env:true, cmgmt:true, EventDispatcher:true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule, PeerConnectionService) {
  'use strict';

  var callManager = cmgmt.CallManager.getInstance(),
    module = {},
    instance,
    callbacks,
    interceptingEventChannelCallback,
    subscribeEvents,
    eventRegistry,
    init = function () {
      eventRegistry = new EventDispatcher({
        // mainModule: mainModule,
        // callbacks: callbacks,
        // peerConnectionSvc: PeerConnectionService,
        // callManager: callManager
      });
      return {
        hookupEventsToUICallbacks: subscribeEvents
      };
    };

  function dispatchEventToHandler(event) {
    console.log('dispatching event: ' + event.type);
    if (eventRegistry[event.type]) {
      var fn = eventRegistry[event.type];
      fn(event.payload);
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
    dispatchEventToHandler(event.state);
  };

  subscribeEvents = function () {
    // set callbacks after session is created and we are ready to subscribe to events
    callbacks = callManager.getSessionContext().getUICallbacks();

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
}(ATT || {}, ATT.PeerConnectionService));