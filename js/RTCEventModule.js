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
    onSessionOpen,
    onSessionClose,
    init = function () {
      return {
        setupEventCallbacks : setup
      };
    };

  subscribeEvents = function () {
    mainModule.event.subscribe(apiObject.Session.Id + '.responseEvent', function (event) {
      if (event.state === mainModule.RTCEvents.SESSION_OPEN) {
        onSessionOpen({ type: mainModule.CallStatus.INPROGRESS });
      }

      if (event.state === mainModule.RTCEvents.SESSION_TERMINATED) {
        onSessionClose({ type: mainModule.CallStatus.ENDED });
      }
    });
  };

  setup = function (config) {
    config = mainModule.utils.deepExtend(config);
  };

  onSessionOpen = function (evt) {
    if (config.onSessionOpen) {
      config.onSessionOpen(evt);
    }
  };

  onSessionClose = function (evt) {
    if (config.onSessionClose) {
      config.onSessionClose(evt);
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
