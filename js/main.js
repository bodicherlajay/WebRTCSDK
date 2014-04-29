/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT: true, cmgmt*/
'use strict';

// Assumptions: defined variables
// * ATT
// * ATT.utils
// * ATT.utils.extend
// * ATT.utils.createErrorDictionary
// * ATT.utils.createEventChannel
// * ATT.resourceManager?????
// * ATT.WebRTC
// * ATT.WebRTC.Session

(function () {
  var callManager, sessionContext, eventChannelConfig;
  // By this point every dependency should be loaded.
  // So fail if ATT is not defined.
  if (undefined === window.ATT) {
    console.log('ATT is not defined.');
    return;
  }

  // Create an Error Dictionary
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