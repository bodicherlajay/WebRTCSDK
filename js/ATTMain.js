/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT: true, cmgmt,sdkErrorCollection:true */

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
//todo fixme - this file needs to be renamed to something else ? errorDictionaryloader or delete this
(function () {
  'use strict';
  var logMgr = ATT.logManager.getInstance(),
    logger,
    sdkErrors,
    idx;

  logger = logMgr.getLogger('ATTMain');
  // Fail if ATT is not defined. Everything else depends on it.
  if (undefined === window.ATT) {
    logger.logTrace('ATT is not defined.');
    return;
  }
/*
  if (!ATT.configure) {
    logger.logTrace('ATT doesn\'t have a configure method defined.');
    return;
  }
  ATT.configure();
*/

  // Create an Error Dictionary
  if (undefined === ATT.utils.createErrorDictionary) {
    logger.logTrace('ATT doesn\'t have a method to create an error dictionary.');
    return;
  }
  ATT.errorDictionary = ATT.utils.createErrorDictionary({
    modules: {
      APP_CONFIG: 'APP_CONFIG',
      ERROR_DICT: 'ERROR_DICT',
      DHS: 'DHS',
      EVENT_CHANNEL: 'EVENT_CHANNEL',
      PEER_CONNECTION: 'PEER_CONNECTION',
      USER_MEDIA: 'USER_MEDIA',
      RESOURCE_MGR: 'RESOURCE_MGR',
      RTC_EVENT: 'RTC_EVENT',
      SIGNALING: 'SIGNALING',
      SDP_FILTER: 'SDP_FILTER',
      CALL_MGR: 'CALL_MGR',
      RTC: 'RTC',
      GENERAL: 'GENERAL'
    }
  }, ATT.utils);
  logger.logTrace("created dictionary");

  // Load all SDK errors in the dictionary
  sdkErrors = ATT.utils.SDKErrorStore.getAllErrors();
  // adds all the errors in the list to the Dictionary
  for (idx = 0; idx < sdkErrors.length; idx = idx + 1) {
    ATT.errorDictionary.createError(sdkErrors[idx]);
  }

  // Load all SKD errors in the dictionary
}());
console.log("Loading complete ATTMain.js, ATT.errorDictionary available");
