/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/


if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";

  var apiObject = Env.resourceManager.getInstance().getAPIObject(), config;
  
  function subscribeEvents () {
    apiObject.event.subscribe(apiObject.Session.Id + '.responseEvent', function(event) {
      if (event.state === apiObject.RTCEvents.SESSION_TERMINATED) {
        this.onSessionClose ({ type : apiObject.CallStatus.ENDED });
      }
    });
  }
  
  function setup (config) {
    this.config = apiObject.utils.deepExtend (config);
  }
  
  var module = {}, instance, init = function () {
    return {
      setupEventCallbacks : setup
    }; 
  };

  //todo setup event subscription for all RTC events
  function onSessionOpen(evt) {
    if (this.config.onSessionOpen) {
      this.config.onSessionOpen (evt);
    }
  }

  function onSessionClose(evt) {
    if (this.config.onSessionOpen) {
      this.config.onSessionOpen (evt);
    }
  }

  mainModule.RTCEvent = module;
  module.getInstance = function () {
    if (!instance) {
      instance = init();
      instance.subscribeEvents();
    }
    return instance;
  };
}(ATT || {}));
