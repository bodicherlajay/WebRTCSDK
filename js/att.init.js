/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

// Define the Global ATT namespace

(function () {
  'use strict';

  // export global ATT namespace
  window.ATT = {
    //shared utilities
    utils: {
    },
    factories: {
    },
    logManager: {
    },
    RESTClient: {
    },
    event: {
    }
  };

}());

/** Load order

  att.utils.sdk-error-store.js
  att.utils.error-dictionary.js
  att.main.js
  att.config.api.js
  att.resource-manager.js
  att.enum.js
  att.config.app.js
  eventDispatcher.js
  att.rtc.event.js
  adapter.js
  userMediaService.js
  att.utils.sdp-filter.js
  signalingService.js
  peerConnectionService.js
  att.call-manager.js
  DHSModule.js
  att.rtc.phone.js
 */
