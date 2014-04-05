/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";

  var apiObject = Env.resourceManager.getInstance().getAPIObject(),
    config = {},
    module = {},
    instance,
    setup,
    subscribeEvents,
    onSessionClose,
    //onSessionOpen,
    init = function () {
      return {
        setupEventCallbacks : setup
      };
    };

  subscribeEvents = function () {
    mainModule.event.subscribe(apiObject.Session.Id + '.responseEvent', function (event) {
      if (event.state === apiObject.RTCEvents.SESSION_TERMINATED) {
        onSessionClose({
          type : apiObject.CallStatus.ENDED
        });
      }
    });
  };

  setup = function (config) {
    config = mainModule.utils.deepExtend(config);
  };

  //todo setup event subscription for all RTC events
//  function onSessionOpen(evt) {
//    if (config.onSessionOpen) {
//      config.onSessionOpen(evt);
//    }
//  }

  onSessionClose = function (evt) {
    if (config.onSessionOpen) {
      config.onSessionOpen(evt);
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
