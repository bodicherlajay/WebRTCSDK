/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT: true*/
'use strict';

(function () {
  if (undefined === window.ATT) {
    console.log('ATT is not defined.');
    return;
  }

  // Create an Error Dictionary for ATT
  // TODO: This should be called in our `main` entry point.
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

}());