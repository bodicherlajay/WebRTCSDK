/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/

/** Exports an object to obtain the list of errors specific to the SDK. **/
(function () {
  'use strict';
  var apiErrors = [
  {
    JSObject: "ATT.rtc",
    JSMethod: "*",
    ErrorCode: 2500,
    ErrorMessage: "System error occurred",
    PossibleCauses: "System error occurred",
    PossibleResolution: "Use the explanation to find the reason for failure.",
    APIError: "SVC0001: A service error has occurred. Error code is <error_explanation>",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 400,
    MessageId: "SVC0001"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "*",
    ErrorCode: 2501,
    ErrorMessage: "Mandatory paramter is missing in the Request.",
    PossibleCauses: "Mandatory parameter is missing in the request.",
    PossibleResolution: "The paramter name is suggested in the error text. …message part conatins the missing parameter name.",
    APIError: "SVC0002 - Invalid input value for message part <part_name>",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 400,
    MessageId: "SVC0002"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "*",
    ErrorCode: 2502,
    ErrorMessage: "Invalid values provided for a paramter in the Request.",
    PossibleCauses: "Invalid values are passed in the Request.",
    PossibleResolution: "Pass the valid values as suggested in the error response.",
    APIError: "SVC0003 - Invalid input value for message part <part_name>, valid values are <part_values>",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 400,
    MessageId: "SVC0003"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "login",
    ErrorCode: 2504,
    ErrorMessage: "E911 not supported for non-telephone users",
    PossibleCauses: "E911 Id is not required a parameter for this user type (NOTN)",
    PossibleResolution: "Please don’t pass E911 id to login for NOTN users",
    APIError: "SVC8510:E911 not supported for non-telephone users",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 400,
    MessageId: "SVC8510"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "login",
    ErrorCode: 2505,
    ErrorMessage: "Valid e911Id is mandatory for ICMN or VTN",
    PossibleCauses: "1. x-e911Id is missing in the reuqest.?2. x-e911Id is invalid.",
    PossibleResolution: "e911Id should be retreived using E911 API and appropriately passed in the Create Session Request.",
    APIError: "SVC8511:Valid e911Id is mandatory for <part_value>",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 400,
    MessageId: "SVC8511"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "login",
    ErrorCode: 2506,
    ErrorMessage: "Unassigned token Associate token to VTN or username",
    PossibleCauses: "Access token not assigned to VTN or username.",
    PossibleResolution: "Call Associate token operation before Create Session for VTN or no TN scenario.",
    APIError: "SVC8512:Unassigned token Associate token to VTN or username",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 400,
    MessageId: "SVC8512"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "login",
    ErrorCode: 2507,
    ErrorMessage: "Token in use.",
    PossibleCauses: "1. A session was already created with the AT",
    PossibleResolution: "In case user abruptly closed the application, refr…called to expire the token and receive new token.",
    APIError: "SVC8513:Token in use.",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 400,
    MessageId: "SVC8513"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "*",
    ErrorCode: 2508,
    ErrorMessage: "Access token is invalid.",
    PossibleCauses: "1. Access Token is incorrect or in valid.?2. Access token is not authorized for the WebRTC scope.",
    PossibleResolution: "Re-Authenticate and retreive the correct access token.",
    APIError: "POL0001:A policy error occurred. For example, rate…it error, authentication and authorization errors",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 401,
    MessageId: "POL0001"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "*",
    ErrorCode: 2509,
    ErrorMessage: "Invalid token",
    PossibleCauses: "Access Token is incorrect or in valid.",
    PossibleResolution: "Re-Authenticate and retreive the correct access token for webRTC",
    APIError: "POL0002:Privacy verification failed for address <address> request is refused",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 403,
    MessageId: "POL0002"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "*",
    ErrorCode: 2510,
    ErrorMessage: "Not implemented",
    PossibleCauses: "Reserved for future use",
    PossibleResolution: "Reserved for future use",
    APIError: "POL0003:Too many addresses specified in Message part",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 403,
    MessageId: "POL0003"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "*",
    ErrorCode: 2511,
    ErrorMessage: "User has not been provisioned for WEBRTC",
    PossibleCauses: "User has not been provisioned for webRTC service",
    PossibleResolution: "End user needs to provide consent to get provisioned.",
    APIError: "POL1009:User has not been provisioned for %1",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 403,
    MessageId: "POL1009"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "login",
    ErrorCode: 2512,
    ErrorMessage: "Number of Session exceeds the allowed limit.",
    PossibleCauses: "For VTN and noTN: Since VTN is assigned to a speci…Max number of sessions is defined by the network.",
    PossibleResolution: "For VTN and No TN Scenaro, contact Administrator. …not get this modified as this is network setting.",
    APIError: "POL1100:Max number of session exceeded allowed limit %1",
    ResourceMethod: "POST /RTC/v1/sessions",
    HttpStatusCode: 403,
    MessageId: "POL1100"
  },
  {
    JSObject: "ATT.rtc",
    JSMethod: "logout",
    ErrorCode: 3507,
    ErrorMessage: "Session Id is not associate with the Access Token passed in the request.",
    PossibleCauses: "Access Token that was passed in the Request is not mapped to the Session Id.",
    PossibleResolution: "Use the same Access Token that was initially passe…ne that is active in case refresh token was used.",
    APIError: "POL1102:Session Id not associated with the token",
    ResourceMethod: "DELETE /RTC/v1/sessions/{sessionid}",
    HttpStatusCode: 403,
    MessageId: "POL1102"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "answer",
    ErrorCode: 5504,
    ErrorMessage: "Call already exists",
    PossibleCauses: "A media modification is in progress for the callId.",
    PossibleResolution: "Complete the In-Progress Media modification before intiating another request.",
    APIError: "SVC8501: Call <callid> in progress",
    ResourceMethod: "PUT /RTC/v1/sessions/{sessionid}/calls/{callid}",
    HttpStatusCode: 409,
    MessageId: "SVC8501"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "hold",
    ErrorCode: 7508,
    ErrorMessage: "Duplicate Request",
    PossibleCauses: "A media modification is in progress for the callId.",
    PossibleResolution: "Complete the In-Progress Media modification before intiating another request.",
    APIError: "SVC8501: Call <callid> in progress",
    ResourceMethod: "PUT /RTC/v1/sessions/{sessionid}/calls/{callid}",
    HttpStatusCode: 409,
    MessageId: "SVC8501"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "resume",
    ErrorCode: 8508,
    ErrorMessage: "Duplicate request",
    PossibleCauses: "A media modification is in progress for the callId.",
    PossibleResolution: "Complete the In-Progress Media modification before intiating another request.",
    APIError: "SVC8501: Call <callid> in progress",
    ResourceMethod: "PUT /RTC/v1/sessions/{sessionid}/calls/{callid}",
    HttpStatusCode: 409,
    MessageId: "SVC8501"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "createE911Id",
    ErrorCode: 16503,
    ErrorMessage: "Address Provided by the End user is not geo codable.",
    PossibleCauses: "The address provided is unreachable.",
    PossibleResolution: "Correct the portion of address as per the Error text and retry.",
    APIError: "SVC0015: Address is not valid address for E911 routing.Reason",
    ResourceMethod: "POST emergencyServices/v1/e911Location",
    HttpStatusCode: 400,
    MessageId: "SVC0015"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "createE911Id",
    ErrorCode: 16504,
    ErrorMessage: "The address provided is not present in the System.",
    PossibleCauses: "The address provided is not present in the System.",
    PossibleResolution: "Confirm the address by setting isAddressConfirmed to true and retry.",
    APIError: "SVC0016: Address Confirmation Required ",
    ResourceMethod: "POST emergencyServices/v1/e911Location",
    HttpStatusCode: 400,
    MessageId: "SVC0016"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "createE911Id",
    ErrorCode: 16505,
    ErrorMessage: "System is unavailable to process the request.",
    PossibleCauses: "System is unavailable to process the request.",
    PossibleResolution: "Please try again later.",
    APIError: "SVC0017: NENA provider system is not?available.",
    ResourceMethod: "POST emergencyServices/v1/e911Location",
    HttpStatusCode: 400,
    MessageId: "SVC0017"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "createE911Id",
    ErrorCode: 16506,
    ErrorMessage: "System is available but could not process the request.",
    PossibleCauses: "System is available but could not process the request.",
    PossibleResolution: "Please contact system administrator.",
    APIError: "SVC0018: NENA provider system error",
    ResourceMethod: "POST emergencyServices/v1/e911Location",
    HttpStatusCode: 400,
    MessageId: "SVC0018"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "createE911Id",
    ErrorCode: 16507,
    ErrorMessage: "Access token is invalid.",
    PossibleCauses: "1. Access Token is incorrect or in valid.?2. Access token is not authorized for the WebRTC scope.",
    PossibleResolution: "Re-Authenticate and retreive the correct access token.",
    APIError: "POL0001:A policy error occurred. For example, rate…it error, authentication and authorization errors",
    ResourceMethod: "POST emergencyServices/v1/e911Location",
    HttpStatusCode: 401,
    MessageId: "POL0001"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "createE911Id",
    ErrorCode: 16508,
    ErrorMessage: "Invalid token",
    PossibleCauses: "Access Token is incorrect or in valid.",
    PossibleResolution: "Re-Authenticate and retreive the correct access token for webRTC",
    APIError: "POL0002:Privacy verification failed for address <address> request is refused",
    ResourceMethod: "POST emergencyServices/v1/e911Location",
    HttpStatusCode: 403,
    MessageId: "POL0002"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "createE911Id",
    ErrorCode: 16509,
    ErrorMessage: "Not implemented",
    PossibleCauses: "Reserved for future use",
    PossibleResolution: "Reserved for future use",
    APIError: "POL0003:Too many addresses specified in Message part",
    ResourceMethod: "POST emergencyServices/v1/e911Location",
    HttpStatusCode: 403,
    MessageId: "POL0003"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "createE911Id",
    ErrorCode: 16511,
    ErrorMessage: "System error occurred",
    PossibleCauses: "System error occurred",
    PossibleResolution: "Use the explanation to find the reason for failure.",
    APIError: "SVC0001: A service error has occurred. Error code is <error_explanation>",
    ResourceMethod: "POST emergencyServices/v1/e911Location",
    HttpStatusCode: 400,
    MessageId: "SVC0001"
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "*",
    ErrorCode: 500,
    ErrorMessage: "<method name> failed - Unable to complete requested operation",
    PossibleCauses: "System error occurred",
    PossibleResolution: "Use the explanation to find the reason for failure.",
    APIError: "Populated from API response if available",
    ResourceMethod: "METHOD: Resource URL",
    HttpStatusCode: 500,
    MessageId: ""
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "*",
    ErrorCode: 502,
    ErrorMessage: "<method name> failed - Unable to complete requested operation",
    PossibleCauses: "Please look into API Error",
    PossibleResolution: "Please look into API Error",
    APIError: "Populated from API response if available",
    ResourceMethod: "METHOD: Resource URL",
    HttpStatusCode: 502,
    MessageId: ""
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "*",
    ErrorCode: 503,
    ErrorMessage: "<method name> failed - Unable to complete requested operation",
    PossibleCauses: "Bad Gateway",
    PossibleResolution: "Please look into API Error",
    APIError: "Populated from API response if available",
    ResourceMethod: "METHOD: Resource URL",
    HttpStatusCode: 503,
    MessageId: ""
  },
  {
    JSObject: "ATT.rtc.Phone",
    JSMethod: "*",
    ErrorCode: 504,
    ErrorMessage: "<method name> failed - Unable to complete requested operation",
    PossibleCauses: "Service Unavailable",
    PossibleResolution: "Please look into API Error",
    APIError: "Populated from API response if available",
    ResourceMethod: "METHOD: Resource URL",
    HttpStatusCode: 504,
    MessageId: ""
  }
  ];
  // freezes a list of objects
  function freezeErrors(list) {
    var idx = 0, listCount = list.length;
    for (idx = 0; idx < listCount; idx = idx + 1) {
      // make all errors unmutable
        if (list[idx] !== undefined) {
          Object.getOwnPropertyDescriptor(list[idx], JSObject).writable = true;
          Object.getOwnPropertyDescriptor(list[idx], JSMethod).writable = true;
          Object.getOwnPropertyDescriptor(list[idx], APIError).writable = true;
          Object.getOwnPropertyDescriptor(list[idx], ResourceMethod).writable = true;
          Object.freeze(list[idx]);
        }
    }
    // errors are now frozen
    return list;
  }

  // try to export the Error List
  // This will throw an error if ATT.utils is not defined
  if (window.ATT.utils.ErrorStore === undefined) {
    throw new Error('Cannot export SDK Errors into ATT.utils.ErrorStore.APIErrors, ATT.utils.ErrorStore namespace is undefined...'
      + '\n ATT: ' + JSON.stringify(window.ATT));
  }

  window.ATT.utils.ErrorStore['APIErrors'] = {
    getAllAPIErrors: function () {
      return apiErrors;
    }
  };

}());
