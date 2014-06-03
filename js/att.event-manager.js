/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function () {
  'use strict';

  var init,
    logger = Env.resourceManager.getInstance().getLogger("EventManager");

  function createEventChannel() {
  }

  function handleUICallbacks() {
  }

  init = function () {
    logger.logDebug('RTC manager init');
    return {
      createEventChannel: createEventChannel,
      handleUICallbacks: handleUICallbacks
    };
  };

  return {
    createEventManager: init
  };
}());
