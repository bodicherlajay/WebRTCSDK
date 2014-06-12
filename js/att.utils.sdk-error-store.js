/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/

/** Exports an object to obtain the list of errors specific to the SDK. **/
(function () {
  'use strict';
  var errorType = {
    SDK:'SDK',
    API:'API',
    BROWSER: 'BROWSER'
  },
  allErrors = [
    //SDK-00000 range reserved for appConfigModule, APIConfigs, ErrorDictionary
    // This is the error thrown if the configured error is not found in the error dictionary
    {
      userErrorCode: 'SDK-00000',    //5 digit error code
      type: errorType.SDK,
      moduleID: 'ERROR_DICT',
      operationName: 'ErrorConfig',    //Name of the operation
      httpStatusCode: '',   //HTTP Status code
      messageId: '',        //SVC or POL Error
      errorDescription: 'Error not configured', //Error Description
      reasonText: 'The specified error code is not configured in the error dictionary' //High level reason text, invalid input, forbidden
    },
    // This is the default error, can be used for all purposes. Shouldn't use it since doesn't provide much information
    {
      userErrorCode: 'SDK-00001',    //5 digit error code
      type: errorType.SDK,
      moduleID: 'GENERAL',
      operationName: 'GeneralOperation',  //Name of the operation
      httpStatusCode: '',   //HTTP Status code
      messageId: '',        //SVC or POL Error
      errorDescription: 'Error performing the operation', //Error Description
      reasonText: 'There was an error performing the operation'   //High level reason text, invalid input, forbidden
    },
    //SDK-10000 range reserved for RESOURCE_MGR module
    {
      userErrorCode: 'SDK-10000',   //5 digit error code
      type: errorType.SDK,
      moduleID: 'RESOURCE_MGR',
      operationName: 'doOperation', //Name of the REST operation
      httpStatusCode: '',           //HTTP Status code
      errorDescription: 'XHR request error', //Error Description
      reasonText: 'There was an error in sending the XHR request'//High level reason text, invalid input, forbidden
    },
    //SDK-20000 range reserved for webRTC module
    {
      userErrorCode: 'SDK-20000',    //5 digit error code
      type: errorType.SDK,
      reasonText: 'configerror',       //High level reason text, invalid input, forbidden
      errorDescription: 'Fatal Error XHR Request failed', //Error Description
      moduleID: 'RTC'
    },
    {
      moduleID : 'RTC',
      type: errorType.SDK,
      userErrorCode : 'SDK-20001',
      operationName : 'Login',
      httpStatusCode : '<optional>',
      errorDescription : '[TODO: To be filled by Product/Marketing]',
      reasonText : ''
    },
    {
      moduleID : 'RTC',
      userErrorCode : 'SDK-20002',
      type: errorType.API,
      operationName : 'CreateSession',
      httpStatusCode : '400',
      errorDescription : 'Unable to create Session',
      reasonText : 'A service error has occurred. Error code is <error_explanation>'
    },
    {
      moduleID : 'RTC',
      userErrorCode : 'SDK-20003',
      type: errorType.API,
      operationName : 'CreateSession',
      httpStatusCode : '400',
      errorDescription : 'Unable to create Session',
      reasonText : 'Invalid input value for Message part <part_name>'
    },
    {
      moduleID : 'RTC',
      userErrorCode : 'SDK-20004',
      type: errorType.API,
      operationName : 'CreateSession',
      httpStatusCode : '400',
      errorDescription : 'Unable to create Session',
      reasonText : 'Invalid input value for Message part <part_name>, valid values are <part_values>'
    },
    {
      userErrorCode : 'SDK-20005',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'SVC0004',
      operationName : 'CreateSession',
      httpStatusCode : '400',
      errorDescription : 'Unable to create Session',
      reasonText : 'No valid addresses provided in the Message part <part_name>'
    },
    {
      userErrorCode : 'SDK-20006',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'SVC8510',
      operationName : 'CreateSession',
      httpStatusCode : '400',
      errorDescription : 'Unable to create Session',
      reasonText : 'E911 not supported for non-telephone users'
    },
    {
      userErrorCode : 'SDK-20007',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'SVC8511',
      operationName : 'CreateSession',
      httpStatusCode : '400',
      errorDescription : 'Unable to create Session',
      reasonText : 'Valid e911Id is mandatory for <part_value>'
    },
    {
      userErrorCode : 'SDK-20008',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'SVC8512',
      operationName : 'CreateSession',
      httpStatusCode : '400',
      errorDescription : 'Unable to create Session',
      reasonText : 'Unassigned token Associate token to VTN or username'
    },
    {
      userErrorCode : 'SDK-20009',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'SVC8513',
      operationName : 'CreateSession',
      httpStatusCode : '400',
      errorDescription : 'Unable to create Session',
      reasonText : 'Token in use.'
    },
    {
      userErrorCode : 'SDK-20010',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'POL0001',
      operationName : 'CreateSession',
      httpStatusCode : '401/403',
      errorDescription : 'Unable to create Session',
      reasonText : 'A policy error occurred. For example, rate limit error, authentication and authorization errors'
    },
    {
      userErrorCode : 'SDK-20011',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'POL0002',
      operationName : 'CreateSession',
      httpStatusCode : '403',
      errorDescription : 'Unable to create Session',
      reasonText : 'Privacy verification failed for address <address> request is refused'
    },
    {
      userErrorCode : 'SDK-20012',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'POL0003',
      operationName : 'CreateSession',
      httpStatusCode : '403',
      errorDescription : 'Unable to create Session',
      reasonText : 'Too many addresses specified in Message part'
    },
    {
      userErrorCode : 'SDK-20013',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'POL0009',
      operationName : 'CreateSession',
      httpStatusCode : '403',
      errorDescription : 'Unable to create Session',
      reasonText : 'User has not been provisioned for %1'
    },
    {
      userErrorCode : 'SDK-20014',
      type: errorType.API,
      moduleID : 'RTC',
      messageId : 'POL1100',
      operationName : 'CreateSession',
      httpStatusCode : '403',
      errorDescription : 'Unable to create Session',
      reasonText : 'Max number of session exceeded allowed limit %1'
    },
    {
      userErrorCode : 'SDK-20015',
      type: errorType.API,
      moduleID : 'RTC',
      operationName: 'RefreshSession',
      httpStatusCode: '<optional>',
      errorDescription: 'Unable to Refresh Session',
      reasonText: ''
    },
    {
      moduleID: 'RTC',
      type: errorType.API,
      userErrorCode: 'SDK-20016',
      operationName: 'DeleteSession',
      messageId: 'SVC0001',
      errorDescription: 'Unable to Delete Session',
      reasonText: 'A service error has occurred. Error code is <error_explanation>'
    },
    {
      userErrorCode: 'SDK-20017',
      type: errorType.API,
      moduleID: 'RTC',
      operationName: 'DeleteSession',
      messageId: 'SVC0002',
      httpStatusCode: '400',
      errorDescription: 'Unable to Delete Session',
      reasonText: 'Invalid input value for Message part <part_name>'
    },
    {
      moduleID: 'RTC',
      userErrorCode: 'SDK-20018',
      type: errorType.API,
      operationName: 'DeleteSession',
      messageId: 'SVC0003',
      errorDescription: 'Unable to Delete Session',
      reasonText: 'Invalid input value for Message part <part_name>, valid values are <part_values>'
    },
    {
      userErrorCode: 'SDK-20019',
      type: errorType.API,
      moduleID: 'RTC',
      operationName: 'DeleteSession',
      messageId: 'SVC0004',
      errorDescription: 'Unable to Delete Session',
      reasonText: 'No valid addresses provided in the Message part <part_name>'
    },
    {
      userErrorCode: 'SDK-20020',
      type: errorType.API,
      moduleID: 'RTC',
      messageId: 'POL0001',
      operationName: 'DeleteSession',
      httpStatusCode: '401/403',
      errorDescription: 'Unable to create Session',
      reasonText: 'A policy error occurred. For example, rate limit error, authentication and authorization errors'
    },
    {
      userErrorCode: 'SDK-20021',
      type: errorType.API,
      moduleID: 'RTC',
      messageId: 'POL0002',
      operationName: 'DeleteSession',
      httpStatusCode: '401/403',
      errorDescription: 'Unable to create Session',
      reasonText: 'Privacy verification failed for address <address>, request is refused'
    },
    {
      userErrorCode: 'SDK-20022',
      type: errorType.API,
      moduleID: 'RTC',
      messageId: 'POL0003',
      operationName: 'DeleteSession',
      httpStatusCode: '403',
      errorDescription: 'Unable to create Session',
      reasonText: 'Too many addresses specified in Message part'
    },
    {
      userErrorCode: 'SDK-20023',
      type: errorType.API,
      messageId: 'POL1102',
      operationName: 'DeleteSession',
      httpStatusCode: '403',
      errorDescription: 'Unable to delete Session',
      reasonText: 'Session Id not associated with the token',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20024',
      type: errorType.SDK,
      operationName: 'HangUp failed',
      errorDescription: 'Unable to hangup',
      reasonText: 'Cannot hangup before establishing a call',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20025',
      type: errorType.API,
      operationName: 'AnswerCall',
      httpStatusCode: '403',
      errorDescription: 'Unable to AnswerCall',
      reasonText: 'Please Login before accessing this public method',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20026',
      type: errorType.SDK,
      operationName: 'HangUp failed',
      errorDescription: 'Unable to hangup',
      reasonText: 'Hangup request network error',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20027',
      type: errorType.SDK,
      operationName: 'Call Failed',
      errorDescription: 'Invalid phone number',
      reasonText: 'The provided phone number is not valid.',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20028',
      type: errorType.SDK,
      operationName: 'Mute Failed',
      errorDescription: 'Cannot mute call',
      reasonText: 'The local audio stream is not currently established',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20029',
      type: errorType.SDK,
      operationName: 'Unmute Failed',
      errorDescription: 'Cannot unmute call',
      reasonText: 'The local audio stream is not currently established',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20030',
      type: errorType.SDK,
      operationName: 'Hold failed',
      errorDescription: 'Cannot hold call',
      reasonText: 'No call object',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20031',
      type: errorType.SDK,
      operationName: 'Resume failed',
      errorDescription: 'Cannot resume call',
      reasonText: 'No call object',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20032',
      type: errorType.SDK,
      operationName: 'Hold failed',
      errorDescription: 'Unable to hold',
      reasonText: 'Hold request network error',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20033',
      type: errorType.SDK,
      operationName: 'Resume failed',
      errorDescription: 'Unable to resume',
      reasonText: 'Resume request network error',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20034',
      type: errorType.SDK,
      operationName: 'Cancel failed',
      errorDescription: 'Unable to cancel',
      reasonText: 'Cancel request network error',
      helpText: 'Please look at tracelog for further information',
      moduleID: 'RTC'
    },
    {
      userErrorCode: 'SDK-20035',
      type: errorType.SDK,
      operationName: 'Reject failed',
      errorDescription: 'Unable to reject',
      reasonText: 'Unable to reject a web rtc call. There is no valid RTC manager to perform this operation',
      helpText: 'Please look at tracelog for further information',
      moduleID: 'RTC'
    },
    // range SDK-50000 is reserverd for DHS errors
    // SDK-50000 is reserverd for all DHS errors thrown within SDK (not API through DHS)
    {
      userErrorCode: 'SDK-50000',
      type: errorType.SDK,
      moduleID: 'DHS',
      messageId: '',
      operationName: '',
      httpStatusCode: '',
      errorDescription: 'DHS Operation failed',
      reasonText: ''
    },
    {
      userErrorCode: 'SDK-51000',
      type: errorType.SDK,
      moduleID: 'DHS',
      messageId : 'SVC0016',
      operationName : 'createE911Id',
      httpStatusCode : '400',
      errorDescription : 'Unable to create E911 Id',
      reasonText : 'Address could not be confirmed'
    }];

  // freezes a list of objects
  function freezeErrors(list) {
    var idx = 0;
    for (idx = 0; idx < list.length; idx = idx + 1) {
      Object.getOwnPropertyDescriptor(list[idx], "reasonText").writable = true;
      // make all errors unmutable
      Object.freeze(list[idx]);
    }
    // errors are now frozen
    return list;
  }

  // try to export the Error List
  // This will throw an error if ATT.utils is not defined
  try {
    window.ATT.utils.SDKErrorStore = {
      getAllErrors: function () {
        return freezeErrors(allErrors);
      },
      getErrorType: errorType
    };
  } catch (e) {
    throw new Error('Cannot export ATT.utils.SDKErrorStore.'
      + '\n ATT: ' + JSON.stringify(window.ATT));
  }
}());
