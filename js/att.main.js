/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT: true, Env: true, cmgmt,sdkErrorCollection:true */

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
    apiErrors,
    idx;

  logger = logMgr.getLogger('ATTMain');
  // Fail if ATT is not defined. Everything else depends on it.
  if (undefined === window.ATT) {
    logger.logTrace('ATT is not defined.');
    return;
  }

  // Create an Error Dictionary
  if (undefined === ATT.utils.createErrorDictionary) {
    logger.logTrace('ATT doesn\'t have a method to create an error dictionary.');
    return;
  }
  ATT.errorDictionary = ATT.utils.createErrorDictionary(ATT.utils.ErrorStore.SDKErrors.getAllSDKErrors(),ATT.utils.ErrorStore.APIErrors.getAllAPIErrors());

  if (undefined !== ATT.errorDictionary) {
    logger.logTrace("Error Dictionary created.");
  }

  logger.logTrace("SDK Errors loaded into the Dictionary.");

}());
