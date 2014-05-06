/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT: true*/
//todo do we need to modularize this ?
'use strict';

var sdkErrorCollection = [
  {
    //SDK-00000 range reserved for appConfigModule
    userErrorCode: 'SDK-00000',    //5 digit error code
    operationName: '',    //Name of the REST operation
    httpStatusCode: 'N/A',   //HTTP Status code
    messageId: 'N/A',        //SVC or POL Error
    helpText: '',         //Help text which can be displayed on UI
    reasonText: 'configerror',       //High level reason text, invalid input, forbidden
    errorDescription: 'Failed to configure API Configuration', //Error Description
    moduleID: 'APP_CONFIG'
  },
  //SDK-10000 range reserved for webRTC module
  {
    userErrorCode: 'SDK-10000',    //5 digit error code
    helpText: 'Unable to complete login, please contact support',         //Help text which can be displayed on UI
    reasonText: 'configerror',       //High level reason text, invalid input, forbidden
    errorDescription: 'Fatal Error XHR Request failed', //Error Description
    moduleID: 'RTC'
  }
];

//load SDK Errors
(function loadSDKErrors() {
  if (sdkErrorCollection.length > 0) {
    var errCount = sdkErrorCollection.length, idx;
    for (idx = 0; idx < errCount; idx = idx + 1) {
      ATT.errorDictionary.createError(sdkErrorCollection[idx]);
    }
  }
}());
