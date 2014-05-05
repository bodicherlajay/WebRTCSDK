/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT: true, cmgmt*/

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
  'use strict';
  var logMgr = ATT.logManager.getInstance(),
    logger;

  logMgr.configureLogger('ATTMain', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);
  logger = logMgr.getLogger('ATTMain');
  // Fail if ATT is not defined. Everything else depends on it.
  if (undefined === window.ATT) {
    logger.logTrace('ATT is not defined.');
    return;
  }
  if (!ATT.configure) {
    logger.logTrace('ATT doesn\'t have a configure method defined.');
    return;
  }
  ATT.configure();

  // Create an Error Dictionary
  if (undefined === ATT.utils.createErrorDictionary) {
    logger.logTrace('ATT doesn\'t have a method to create an error dictionary.');
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
}());