/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";

  var callManager = cmgmt.CallManager.getInstance(),
    module = {},
    instance,
    callbacks,
    interceptingEventChannelCallback,
    subscribeEvents,
    onIncomingCall,
    onSessionOpen,
    onSessionClose,
    init = function () {
      return {
        setupEventCallbacks: subscribeEvents
      };
    };

  interceptingEventChannelCallback = function (event) {
    if (!event) {
      return;
    }

    // set current event on the session
    callManager.getSessionContext().setEventObject (event);

    //todo capture time, debugging info for sdk
    switch (event.state) {
    case mainModule.RTCEvents.SESSION_OPEN:
      onSessionOpen({ type: mainModule.CallStatus.INPROGRESS });
      break;
    case mainModule.RTCEvents.SESSION_TERMINATED:
      onSessionClose({ type: mainModule.CallStatus.ENDED });
      break;
    case mainModule.RTCEvents.INVITATION_RECEIVED:
      onIncomingCall({ type: mainModule.CallStatus.RINGING, from: event.from });
      break;
    }
  };

  subscribeEvents = function () {
    // set callbacks after session is created and we are ready to subscribe to events
    callbacks = callManager.getSessionContext().getUICallbacks();

    // subscribe to events
    var sessionId = callManager.getSessionContext().getSessionId();
    mainModule.event.subscribe(sessionId + '.responseEvent', interceptingEventChannelCallback);
  };

  onSessionOpen = function (evt) {
    if (callbacks.onSessionOpen) {
      callbacks.onSessionOpen(evt);
    }
  };

  onIncomingCall = function (evt) {
    if (callbacks.onIncomingCall) {
      callbacks.onIncomingCall(evt);
    }
  };

  onSessionClose = function (evt) {
    if (callbacks.onSessionClose) {
      callbacks.onSessionClose(evt);
    }
  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
      subscribeEvents();
    }
    return instance;
  };

  mainModule.RTCEvent = module;
}(ATT || {}));