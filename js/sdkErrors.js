/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT: true*/
//todo do we need to modularize this ?
'use strict';

var sdkErrorCollection = [
  //SDK-00000 range reserved for appConfigModule, APIConfigs, ErrorDictionary
  // This is the error thrown if the configured error is not found in the error dictionary
  {
    userErrorCode: 'SDK-00000',    //5 digit error code
    moduleID: 'ERROR_DICT',
    operationName: 'ErrorConfig',    //Name of the operation
    httpStatusCode: '',   //HTTP Status code
    messageId: '',        //SVC or POL Error
    errorDescription: 'Error not configured', //Error Description
    reasonText: 'The specified error code is not configured in the error disctionary',  //High level reason text, invalid input, forbidden
    helpText: 'Please configure the error in the error dictionary' //Help text which can be displayed on UI
  },
  // This is the default error, can be used for all purposes. Shouldn't use it since doesn't provide much information
  {
    userErrorCode: 'SDK-00001',    //5 digit error code
    moduleID: 'GENERAL',
    operationName: 'GeneralOperation',  //Name of the operation
    httpStatusCode: '',   //HTTP Status code
    messageId: '',        //SVC or POL Error
    errorDescription: 'Error performing the operation', //Error Description
    reasonText: 'There was an error performing the operation',   //High level reason text, invalid input, forbidden
    helpText: 'Please look at tracelog for further information' //Help text which can be displayed on UI
  },
  //SDK-10000 range reserved for RESOURCE_MGR module
  {
    userErrorCode: 'SDK-10000',   //5 digit error code
    moduleID: 'RESOURCE_MGR',
    operationName: 'doOperation', //Name of the REST operation
    httpStatusCode: '',           //HTTP Status code
    errorDescription: 'XHR request error', //Error Description
    reasonText: 'There was an error in sending the XHR request',//High level reason text, invalid input, forbidden
    helpText: 'Please check your network connectivity'         //Help text which can be displayed on UI
  },
  //SDK-20000 range reserved for webRTC module
  {
    userErrorCode: 'SDK-20000',    //5 digit error code
    helpText: 'Unable to complete login..text tobe filled in by marketing', //Help text which can be displayed on UI
    reasonText: 'configerror',       //High level reason text, invalid input, forbidden
    errorDescription: 'Fatal Error XHR Request failed', //Error Description
    moduleID: 'RTC'
  },
  {
    moduleID : 'RTC',
    userErrorCode : "SDK-20001",
    operationName : "Login",
    httpStatusCode : "<optional>",
    errorDescription : "[TODO: To be filled by Product/Marketing]",
    reasonText : ""
  },
  {
    moduleID : 'RTC',
    userErrorCode : "SDK-20002",
    operationName : "CreateSession",
    httpStatusCode : "400",
    errorDescription : "Unable to create Session",
    reasonText : "A service error has occurred. Error code is <error_explanation>"
  },
  {
    moduleID : 'RTC',
    userErrorCode : "SDK-20003",
    operationName : "CreateSession",
    httpStatusCode : "400",
    errorDescription : "Unable to create Session",
    reasonText : "Invalid input value for Message part <part_name>"
  },
  {
    moduleID : 'RTC',
    userErrorCode : "SDK-20004",
    operationName : "CreateSession",
    httpStatusCode : "400",
    errorDescription : "Unable to create Session",
    reasonText : "Invalid input value for Message part <part_name>, valid values are <part_values>"
  },
  {
    userErrorCode : "SDK-20005",
    moduleID : 'RTC',
    messageId : "SVC0004",
    operationName : "CreateSession",
    httpStatusCode : "400",
    errorDescription : "Unable to create Session",
    reasonText : "No valid addresses provided in the Message part <part_name>"
  },
  {
    userErrorCode : "SDK-20006",
    moduleID : 'RTC',
    messageId : "SVC8510",
    operationName : "CreateSession",
    httpStatusCode : "400",
    errorDescription : "Unable to create Session",
    reasonText : "E911 not supported for non-telephone users"
  },
  {
    userErrorCode : "SDK-20007",
    moduleID : 'RTC',
    messageId : "SVC8511",
    operationName : "CreateSession",
    httpStatusCode : "400",
    errorDescription : "Unable to create Session",
    reasonText : "Valid e911Id is mandatory for <part_value>"
  },
  {
    userErrorCode : "SDK-20008",
    moduleID : 'RTC',
    messageId : "SVC8512",
    operationName : "CreateSession",
    httpStatusCode : "400",
    errorDescription : "Unable to create Session",
    reasonText : "Unassigned token Associate token to VTN or username"
  },
  {
    userErrorCode : "SDK-20009",
    moduleID : 'RTC',
    messageId : "SVC8513",
    operationName : "CreateSession",
    httpStatusCode : "400",
    errorDescription : "Unable to create Session",
    reasonText : "Token in use."
  },
  {
    userErrorCode : "SDK-20010",
    moduleID : 'RTC',
    messageId : "POL0001",
    operationName : "CreateSession",
    httpStatusCode : "401/403",
    errorDescription : "Unable to create Session",
    reasonText : "A policy error occurred. For example, rate limit error, authentication and authorization errors"
  },
  {
    userErrorCode : "SDK-20011",
    moduleID : 'RTC',
    messageId : "POL0002",
    operationName : "CreateSession",
    httpStatusCode : "403",
    errorDescription : "Unable to create Session",
    reasonText : "Privacy verification failed for address <address> request is refused"
  },
  {
    userErrorCode : "SDK-20012",
    moduleID : 'RTC',
    messageId : "POL0003",
    operationName : "CreateSession",
    httpStatusCode : "403",
    errorDescription : "Unable to create Session",
    reasonText : "Too many addresses specified in Message part"
  },
  {
    userErrorCode : "SDK-20013",
    moduleID : 'RTC',
    messageId : "POL0009",
    operationName : "CreateSession",
    httpStatusCode : "403",
    errorDescription : "Unable to create Session",
    reasonText : "User has not been provisioned for %1"
  },
  {
    userErrorCode : "SDK-20014",
    moduleID : 'RTC',
    messageId : "POL1100",
    operationName : "CreateSession",
    httpStatusCode : "403",
    errorDescription : "Unable to create Session",
    reasonText : "Max number of session exceeded allowed limit %1"
  },
  {
    userErrorCode : "SDK-20015",
    moduleID : 'RTC',
    operationName: "RefreshSession",
    httpStatusCode: "<optional>",
    errorDescription: "Unable to Refresh Session",
    reasonText: ""
  },
  {
    moduleID: 'RTC',
    userErrorCode: "SDK-20016",
    operationName: "DeleteSession",
    messageId: "SVC0001",
    errorDescription: "Unable to Delete Session",
    reasonText: "A service error has occurred. Error code is <error_explanation>"
  },
  {
    userErrorCode: "SDK-20017",
    moduleID: 'RTC',
    operationName: "DeleteSession",
    messageId: "SVC0002",
    errorDescription: "Unable to Delete Session",
    reasonText: "Invalid input value for Message part <part_name>"
  },
  {
    moduleID: 'RTC',
    userErrorCode: "SDK-20018",
    operationName: "DeleteSession",
    messageId: "SVC0003",
    errorDescription: "Unable to Delete Session",
    reasonText: "Invalid input value for Message part <part_name>, valid values are <part_values>"
  },
  {
    userErrorCode: "SDK-20019",
    moduleID: 'RTC',
    operationName: "DeleteSession",
    messageId: "SVC0004",
    errorDescription: "Unable to Delete Session",
    reasonText: "No valid addresses provided in the Message part <part_name>"
  },
  {
    userErrorCode: "SDK-20020",
    moduleID: 'RTC',
    messageId: "POL0001",
    operationName: "DeleteSession",
    httpStatusCode: "401/403",
    errorDescription: "Unable to create Session",
    reasonText: "A policy error occurred. For example, rate limit error, authentication and authorization errors"
  },
  {
    userErrorCode: "SDK-20021",
    moduleID: 'RTC',
    messageId: "POL0002",
    operationName: "DeleteSession",
    httpStatusCode: "401/403",
    errorDescription: "Unable to create Session",
    reasonText: "Privacy verification failed for address <address>, request is refused"
  },
  {
    userErrorCode: "SDK-20022",
    moduleID: 'RTC',
    messageId: "POL0003",
    operationName: "DeleteSession",
    httpStatusCode: "403",
    errorDescription: "Unable to create Session",
    reasonText: "Too many addresses specified in Message part"
  },
  {
    userErrorCode: "SDK-20023",
    messageId: "POL1102",
    operationName: "DeleteSession",
    httpStatusCode: "403",
    errorDescription: "Unable to delete Session",
    reasonText: "Session Id not associated with the token",
    moduleID: 'RTC'
  },

  // range SDK-50000 is reserverd for SDK errors
  // SDK-50000 is reserverd for all error thrown within SDK (not API through DHS)
  {
    userErrorCode: "SDK-50000",
    moduleID: "DHS",
    messageId: "",
    operationName: "",
    httpStatusCode: "",
    errorDescription: "DHS Operation failed",
    reasonText: "",
    helpText: 'Please look at tracelog for further information' //Help text which can be displayed on UI
  },
  {
    userErrorCode: "SDK-51000",
    moduleID: "DHS",
    messageId : "SVC0016",
    operationName : "createE911Id",
    httpStatusCode : "400",
    errorDescription : "Unable to create E911 Id",
    reasonText : "Address could not be confirmed",
    helpText: 'Please make sure that the address is valid or confirmed' //Help text which can be displayed on UI
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
