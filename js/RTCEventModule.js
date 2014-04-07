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
    callbacks = cmgmt.CallManager.getInstance().getSessionContext(),
    InterceptingEventChannelCallback,
    subscribeEvents,
    onIncomingCall,
    onSessionOpen,
    onSessionClose,
    init = function () {
      return {
        setupEventCallbacks: subscribeEvents
      };
    };

  InterceptingEventChannelCallback = function (event) {
    //todo capture time, debugging info for sdk
    switch (event) {
    case mainModule.RTCEvents.SESSION_OPEN:
      onSessionOpen({ type: mainModule.CallStatus.INPROGRESS });
      break;
    case mainModule.RTCEvents.SESSION_TERMINATED:
      onSessionClose({ type: mainModule.CallStatus.ENDED });
      break;
    case mainModule.RTCEvents.INVITATION_RECEIVED:
      onIncomingCall({ type: mainModule.CallStatus.RINGING });
      break;
    }
  };

  subscribeEvents = function (event) {
    var sessionId = callManager.getSessionContext().getSessionId();
    mainModule.event.subscribe(sessionId + '.responseEvent', InterceptingEventChannelCallback.call(null, event));
  };

  onSessionOpen = function (evt) {
    if (callbacks.onSessionOpen) {
      callbacks.onSessionOpen(evt.type);
    }
  };

  onIncomingCall = function (evt) {
    if (callbacks.onIncomingCall) {
      callbacks.onIncomingCall(evt.type);
    }
  };

  onSessionOpen = function (evt) {
    if (callbacks.onIncomingCall) {
      callbacks.onIncomingCall(evt.type);
    }
  };

  onIncomingCall = function (evt) {
    if (callbacks.onIncomingCall) {
      callbacks.onIncomingCall(evt.type);
    }
  };

  onSessionClose = function (evt) {
    if (callbacks.onIncomingCall) {
      callbacks.onIncomingCall(evt.type);
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