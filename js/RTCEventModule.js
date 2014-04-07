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
    setup,
    InterceptingEventChannelCallback,
    subscribeEvents,
    onIncomingCall,
    onSessionOpen,
    onSessionClose,
    init = function () {
      return {
        setupEventCallbacks: setup
      };
    };

  InterceptingEventChannelCallback = function (event) {
    //todo capture time, debugging info for sdk
    switch (event.state) {
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

  setup = function (config) {
    config = mainModule.utils.deepExtend(config);
  };

  onSessionOpen = function (evt) {
    console.log(evt);
  };

  onIncomingCall = function (evt) {
    console.log(evt);
  };

  onSessionClose = function (evt) {
    console.log(evt);
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