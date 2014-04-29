/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT: true, cmgmt*/
'use strict';

/** This is going to be the main entry/assembly module for the SDK 
 * By the time this file is loaded, all other modules have already 
 * been loaded, so we can assume the following functions and objects
 * already exist:
 * - ATT
 * - ATT.utils
 * - ATT.utils.extend
 * - ATT.utils.createErrorDictionary
 * - ATT.utils.createEventChannel
 * - ATT.resourceManager?????: This file contains a lot of the initialization code.
 *   So we either have to merge it with this file (main.js) or extract any initialization
 *   logic so that there's only a Single Point of Entry for the SDK.
 * - ATT.WebRTC
 * - ATT.WebRTC.Session
*/

(function () {
  var callManager, sessionContext, eventChannelConfig;

  // Fail if ATT is not defined. Everything else depends on it.
  if (undefined === window.ATT) {
    console.log('ATT is not defined.');
    return;
  }

  // Create an Error Dictionary
  if (undefined === ATT.createErrorDictionary) {
    console.log('ATT doesn\'t have a method to create an error dictionary.');
    return;
  }
  ATT.errorDictionary = ATT.utils.createErrorDictionary({
    modules: {
      APP_COfNFIG: 'APP-CFG',
      DHS: 'DHS',
      EVENT_CHANNEL: 'EVT-CHL',
      PEER_CONNECTION: 'PCN-SRV',
      USER_MEDIA: 'USR-SRV',
      RESOURCE_MGR: 'RES-MGR',
      RTC_EVENT: 'RTC-EVT',
      SIGNALING: 'SIG-SRV',
      SDP_FILTER: 'SDP-FLT',
      CALL_MGR: 'CALL-MGR',
      RTC: 'RTC'
    }
  }, ATT.utils);

  // Aparently we need to initialize the Call Management Module before....
  // Create an event channel to keep processing events from BlackFlag
  if (undefined === window.cmgmt) {
    console.log('Call Management Module not loaded.');
    return;
  }

  // A session needs to be created before this code can be run
  callManager = cmgmt.CallManager.getInstance();
  sessionContext = callManager.getSessionContext();
  if (undefined === sessionContext) {
    console.log('No session context. You need to create a session first.');
    return;
  }
  eventChannelConfig = { // configuration for a long polling channel
    url: ATT.appConfig.BFEndpoint + '/sessions/' + sessionContext.getSessionId() + '/events',
    async: true,
    timeout: 30000,
    headers: {
      'Authorization': 'Bearer ' + sessionContext.getAccessToken(),
      'Content-type': 'application/json',
      'Accept' : 'application/json'
    },
    publicMethodName: 'getEventChannel'
  };
  // Create the actual eventChannel
  ATT.eventChannel = ATT.utils.createEventChannel(eventChannelConfig);
  // Create a Public Method and bind it to the method to start the eventChannel
  ATT.resourceManager.addPublicMethod(eventChannelConfig.publicMethodName,
    ATT.eventChannel.startListenning);

}());