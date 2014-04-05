/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";

  var apiObject = Env.resourceManager.getInstance().getAPIObject(),
    module = {},
    instance,
    setup,
    subscribeEvents,
    onRinging,
    onSessionClose,
    init = function () {
      return {
        setupEventCallbacks: setup
      };
    };

  subscribeEvents = function () {
    mainModule.event.subscribe(apiObject.Session.Id + '.responseEvent', function (event) {
      if (event.state === mainModule.RTCEvents.SESSION_TERMINATED) {
        onSessionClose({ type: mainModule.CallStatus.ENDED });
      }
      if (event.state === mainModule.RTCEvents.INVITATION_RECEIVED) {
        onRinging({ type: mainModule.CallStatus.RINGING });
      }
    });
  };

  setup = function(config) {
    config = mainModule.utils.deepExtend(config);
    apiObject.actionConfig = config;
  };

  onRinging = function(evt) {
    if (apiObject.actionConfig.onRinging) {
      apiObject.actionConfig.onRinging(evt.type);
    }
  };

  onSessionClose = function(evt) {
    if (apiObject.actionConfig.onSessionClose) {
      apiObject.actionConfig.onSessionClose(evt.type);
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
