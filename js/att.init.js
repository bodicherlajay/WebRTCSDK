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
  ErrorDictionaryModule.js
  ATTMain.js
  APIConfigs.js
  resourceManagerModule.js
  attEnum.js
  appConfigModule.js
  eventDispatcher.js
  RTCEventModule.js
  adapter.js
  userMediaService.js
  SDPFilterModule.js
  signalingService.js
  peerConnectionService.js
  CallManagementModule.js
  DHSModule.js
  webRTC.js
 */
