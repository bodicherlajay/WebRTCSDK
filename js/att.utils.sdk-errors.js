/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/

/** Exports an object to obtain the list of errors specific to the SDK. **/
(function () {
  'use strict';
  var sdkErrors = [
    {
      JSObject: "ATT.rtc",
      JSMethod: "*",
      ErrorCode: "0000",
      ErrorMessage: "Error Code is not defined in error dictionary",
      Cause: "Error Code is not defined in error dictionary",
      Resolution: "Add the error object in error dictionary"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "configure",
      ErrorCode: "0001",
      ErrorMessage: "Unable to configure the endpoint for SDK. Please ensure that correct config key is used to configure the endpoint",
      Cause: "Configuration key is not found",
      Resolution: "Please check appConfig module for correct config key"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "*",
      ErrorCode: "0002",
      ErrorMessage: "Unable to perform requested operation. Please ensure that the application is hosted on the provisioned domain.",
      Cause: "CORS configuration",
      Resolution: "Please ensure that the application is hosted on the provisioned domain"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "*",
      ErrorCode: "0003",
      ErrorMessage: "Request timed out",
      Cause: "Network failure",
      Resolution: "Please check the logs, check the network connectivity and try again"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "Phone",
      ErrorCode: "1000",
      ErrorMessage: "Missing input parameter",
      Cause: "One or more of the input parameters are empty",
      Resolution: "Please check the values for input parameters"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "Phone",
      ErrorCode: "1001",
      ErrorMessage: "Missing local video stream",
      Cause: "Input parameter localVideoElementID is missing",
      Resolution: "Please check the values for localVideoElementID"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "Phone",
      ErrorCode: "1002",
      ErrorMessage: "Missing remote video stream",
      Cause: "Input parameter remoteVideoElementID is missing",
      Resolution: "Please check the values for remoteVideoElementID"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "Phone",
      ErrorCode: "1003",
      ErrorMessage: "Invalid media type",
      Cause: "Invalid media constraints",
      Resolution: "Please provide use valid Media constraints attributes"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "Phone",
      ErrorCode: "1004",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "login",
      ErrorCode: "2000",
      ErrorMessage: "Invalid user type",
      Cause: "Unsupported user type",
      Resolution: "Supported user types are ICMN, VTN, NOTN"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "login",
      ErrorCode: "2001",
      ErrorMessage: "Missing input parameter",
      Cause: "Access token & E911 ID is required",
      Resolution: "User type, Access token, E911 ID are mandatory fields for ICMN & VTN user types"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "login",
      ErrorCode: "2002",
      ErrorMessage: "Mandatory fields can not be empty",
      Cause: "One of the Mandatory Parameters is empty",
      Resolution: "Please check the values for input parameters"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "login",
      ErrorCode: "2003",
      ErrorMessage: "Invalid input parameter",
      Cause: "Invalid parameter",
      Resolution: "For NOTN users E911 is not required"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "login",
      ErrorCode: "2004",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "login",
      ErrorCode: "2005",
      ErrorMessage: "User already logged in",
      Cause: "Duplicate operation",
      Resolution: "Login should be called only once per session"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "logout",
      ErrorCode: "3000",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "logout",
      ErrorCode: "3001",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid Logout operation",
      Resolution: "None"
    },
    {
      JSObject: "ATT.rtc",
      JSMethod: "logout",

      ErrorCode: "3002",
      ErrorMessage: "User already logged out",
      Cause: "Duplicate operation",
      Resolution: "Logout should be called only once per session"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4000",
      ErrorMessage: "Invalid input parameter",
      Cause: "Invalid phone number",
      Resolution: "Please provide valid 10 digit phone number"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4001",
      ErrorMessage: "Invalid input parameter",
      Cause: "Invalid SIP URI",
      Resolution: "Please provide valid SIP URI"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4002",
      ErrorMessage: "Invalid media type",
      Cause: "Invalid media constraints",
      Resolution: "Please provide use valid Media constraints attributes"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4003",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4004",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking dial"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4005",
      ErrorMessage: "Can not make second call. Please put the current call on hold before making second call.",
      Cause: "Invalid operation",
      Resolution: "Please ensure that current call is on hold before making second call"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4006",
      ErrorMessage: "parameter `localMedia` is not defined",
      Cause: "localMedia is not defined",
      Resolution: "Please include `localMedia` parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4007",
      ErrorMessage: "parameter `remoteMedia` is not defined",
      Cause: "remoteMedia is not defined",
      Resolution: "Please include `remoteMedia` parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4008",
      ErrorMessage: "parameter `destination` is not defined",
      Cause: "destination is not defined",
      Resolution: "Please include `destination` parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "dial",
      ErrorCode: "4009",
      ErrorMessage: "options are not defined",
      Cause: "options are not defined",
      Resolution: "Please include the required parameters"
    },
    {
        JSObject: "ATT.rtc.Phone",
        JSMethod: "dial",
        ErrorCode: "4010",
        ErrorMessage: "Cannot have more than 2 calls at same time",
        Cause: "Only one foreground call and one background call is supported",
        Resolution: "Please hangup current or background call before making another call"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "answer",
      ErrorCode: "5000",
      ErrorMessage: "Answer failed- No incoming call",
      Cause: "No incoming call",
      Resolution: "No incoming call"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "answer",
      ErrorCode: "5001",
      ErrorMessage: "Invalid media type",
      Cause: "Invalid media constraints",
      Resolution: "Please provide use valid Media constraints attributes"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "answer",
      ErrorCode: "5002",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "answer",
      ErrorCode: "5003",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking answer"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "answer",
      ErrorCode: "5004",
      ErrorMessage: "Mandatory fields can not be empty",
      Cause: "One of the Mandatory Parameters is empty",
      Resolution: "Please check the values for input parameters"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "answer",
      ErrorCode: "5005",
      ErrorMessage: "Invalid Action parameter",
      Cause: "Action can only be `hold` or `end`",
      Resolution: "Please provide a valid action (hold or end)"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "hangup",
      ErrorCode: "6000",
      ErrorMessage: "Hangup failed- Call is not in progress",
      Cause: "Can not hangup before the call is established",
      Resolution: "Please use cancel call, or allow call to be established before trying to hang-up."
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "hangup",
      ErrorCode: "6001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "hold",
      ErrorCode: "7000",
      ErrorMessage: "Hold failed- Call is not in progress",
      Cause: "Cannot hold. There is no active call in progress.",
      Resolution: "Please make a call first ensure an active call is in progress before trying to put the call on Hold."
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "hold",
      ErrorCode: "7001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "resume",
      ErrorCode: "8000",
      ErrorMessage: "Resume failed- Call is not in progress",
      Cause: "There is no active call in progress.",
      Resolution: "Please make a call first ensure an active call is in progress."
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "resume",
      ErrorCode: "8001",
      ErrorMessage: "Resume failed- Call is not in hold",
      Cause: "Invalid operation",
      Resolution: "Please confirm that an active call is on Hold before trying to Resume."
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "resume",
      ErrorCode: "8002",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "mute",
      ErrorCode: "9000",
      ErrorMessage: "Mute failed- Call is not in progress",
      Cause: "No media stream",
      Resolution: "Please confirm that an active call is in progress."
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "mute",
      ErrorCode: "9001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "mute",
      ErrorCode: "9002",
      ErrorMessage: "Mute failed- Already muted",
      Cause: "Duplicate operation",
      Resolution: ""
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "unmute",
      ErrorCode: "10000",
      ErrorMessage: "Unmute failed- No media stream",
      Cause: "No media stream",
      Resolution: "Please confirm that an active call is in progress."
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "unmute",
      ErrorCode: "10001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "unmute",
      ErrorCode: "10002",
      ErrorMessage: "Unmute failed- Already Unmuted",
      Cause: "Duplicate operation",
      Resolution: ""
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "cancel",
      ErrorCode: "11000",
      ErrorMessage: "Cancel failed-Call has not been initiated",
      Cause: "No call to cancel in progress",
      Resolution: "Please invoke dial before invoking cancel"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "cancel",
      ErrorCode: "11001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "reject",
      ErrorCode: "12000",
      ErrorMessage: "Reject failed-Call has not been initiated",
      Cause: "No call to reject",
      Resolution: "Reject can be performed only on incoming call"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "reject",
      ErrorCode: "12001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "13000",
      ErrorMessage: "Unable to send information about this party",
      Cause: "PeerConnection Create offer failed",
      Resolution: "Please check the logs on the console"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "13001",
      ErrorMessage: "Unable to acknowledge other party",
      Cause: "PeerConnection Create answer failed",
      Resolution: "Please check the logs on the console"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "13002",
      ErrorMessage: "Local media description not accepted by connection",
      Cause: "PeerConnection setLocalDescription failed",
      Resolution: "Please check the logs on the console"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "13003",
      ErrorMessage: "Other party media description not accepted by connection",
      Cause: "PeerConnection setRemoteDescription failed",
      Resolution: "Please check the logs on the console"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "13004",
      ErrorMessage: "Negotiation for connectivity failed",
      Cause: "PeerConnection addIceCandidate failed",
      Resolution: "Please check the logs on the console"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "13005",
      ErrorMessage: "onUserMediaError",
      Cause: "Failed to get the UserMedia",
      Resolution: "Please enable Media for the browser "
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "14000",
      ErrorMessage: "Permission denied to access audio/video",
      Cause: "User denied permission",
      Resolution: "User may intentionally have denied permission, please retry the requested operation"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "14001",
      ErrorMessage: "Unsupported browser-unable to get audio/video",
      Cause: "Unsupported browser",
      Resolution: "The browser does not support WebRTC, please use WebRTC supported browser"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "14002",
      ErrorMessage: "Invalid input for media request",
      Cause: "Invalid media constraints",
      Resolution: "Please check the media constraints"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "15000",
      ErrorMessage: "Cannot interpret other party's state",
      Cause: "Unable to Setup Event Interceptor. Please contact support.",
      Resolution: "Please contact support"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "15001",
      ErrorMessage: "Event Channel unable to shutdown gracefully",
      Cause: "Unable to shut down event channel. Please logout and login again.",
      Resolution: "Please login again"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "*",
      ErrorCode: "15002",
      ErrorMessage: "Event Channel got shutdown unexpectedly",
      Cause: "Event Channel stopped. Please logout and login again.",
      Resolution: "Please login again"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "updateE911Id",
      ErrorCode: "17000",
      ErrorMessage: "e911Id parameter missing",
      Cause: "Once or more required input parameter(s) are missing",
      Resolution: "Please pass E911Id as a parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "updateE911Id",
      ErrorCode: "17001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "updateE911Id",
      ErrorCode: "17002",
      ErrorMessage: "Could not update E911 Id, E911 Id could be updated only for ongoing session",
      Cause: "Precondition failed",
      Resolution: "E911 Id can be updated only for ongoing session, Please login and then update E911 Id if necessary"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "startConference",
      ErrorCode: "18000",
      ErrorMessage: "parameters missing",
      Cause: "no parameter passed ",
      Resolution: "Please pass parameters to startConference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "startConference",
      ErrorCode: "18001",
      ErrorMessage: "Invalid localMedia passed ",
      Cause: "localMedia parameter missing",
      Resolution: "Please pass localMedia as a parameter for start conference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "startConference",
      ErrorCode: "18002",
      ErrorMessage: "Invalid remoteMedia passed",
      Cause: "remoteMedia parameter missing",
      Resolution: "Please pass remoteMedia as a parameter for start conference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "startConference",
      ErrorCode: "18003",
      ErrorMessage: "Invalid mediatype passed ",
      Cause: "mediatype parameter missing",
      Resolution: "please pass mediatype as a parameter for start conference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "startConference",
      ErrorCode: "18004",
      ErrorMessage: "Internal error occurred",
      Cause: "onUserMediaError",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "startConference",
      ErrorCode: "18005",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "startConference",
      ErrorCode: "18006",
      ErrorMessage: "Cannot make second conference when first in progress",
      Cause: "conference already exists",
      Resolution: "Please End your current Conference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "startConference",
      ErrorCode: "18007",
      ErrorMessage: "User not login to make conference",
      Cause: "User not logged In",
      Resolution: "Please login before you make a conference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipant",
      ErrorCode: "19000",
      ErrorMessage: "participant parameter missing",
      Cause: "One or more required input parameter(s) are missing",
      Resolution: "Please provide participant parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipant",
      ErrorCode: "19001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "joinConference",
      ErrorCode: "20000",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "joinConference",
      ErrorCode: "20001",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking join conference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "joinConference",
      ErrorCode: "20002",
      ErrorMessage: "No conference invite",
      Cause: "Invalid operation",
      Resolution: "Cannot join conference before receiving an invite"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "rejectConference",
      ErrorCode: "22000",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "rejectConference",
      ErrorCode: "22001",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking reject conference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "rejectConference",
      ErrorCode: "22002",
      ErrorMessage: "No conference invite",
      Cause: "Invalid operation",
      Resolution: "Cannot reject conference before receiving an invite"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "getParticipants",
      ErrorCode: "21000",
      ErrorMessage: "Conference not initiated",
      Cause: "Invalid operation",
      Resolution: "Please invoke conference first before invoking getParticipants"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "getParticipants",
      ErrorCode: "21001",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "getParticipants",
      ErrorCode: "21002",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking getParticipants"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "endConference",
      ErrorCode: "23000",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "endConference",
      ErrorCode: "23001",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking endConference"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "endConference",
      ErrorCode: "23002",
      ErrorMessage: "endConference failed - Conference is not in progress",
      Cause: "Cannot end Conference before the conference is established",
      Resolution: "Allow conference to be established before trying to end"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipants",
      ErrorCode: "24000",
      ErrorMessage: "participants parameter missing",
      Cause: "One or more required input parameter(s) are missing",
      Resolution: "Please provide participants parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipants",
      ErrorCode: "24001",
      ErrorMessage: "User is not logged in",
      Cause: "One or more required input parameter(s) are not correct",
      Resolution: "Please provide participants parameter of type array"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipants",
      ErrorCode: "24002",
      ErrorMessage: "participants parameter incorrect",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking addParticipants"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipants",
      ErrorCode: "24003",
      ErrorMessage: "Conference not initiated",
      Cause: "Invalid operation",
      Resolution: "Please invoke conference first before invoking addParticipants"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipants",
      ErrorCode: "24004",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipants",
      ErrorCode: "24005",
      ErrorMessage: "Cannot invite existing participant",
      Cause: "Invalid operation",
      Resolution: "Please invite new user"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipants",
      ErrorCode: "24006",
      ErrorMessage: "Invalid input parameter",
      Cause: "Invalid phone number",
      Resolution: "Please provide valid 10 digit phone number"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addParticipants",
      ErrorCode: "24007",
      ErrorMessage: "Invalid input parameter",
      Cause: "Invalid SIP URI",
      Resolution: "Please provide valid SIP URI"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "removeParticipant",
      ErrorCode: "25000",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking removeParticipant"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "removeParticipant",
      ErrorCode: "25001",
      ErrorMessage: "removeParticipant failed - Conference is not in progress",
      Cause: "Cannot remove participant before the conference is established",
      Resolution: "Allow conference to be established before trying to remove participant"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "removeParticipant",
      ErrorCode: "25002",
      ErrorMessage: "participant parameter missing",
      Cause: "One or more required input parameter(s) are missing",
      Resolution: "Please provide participant parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "removeParticipant",
      ErrorCode: "25003",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "CleanNumber",
      ErrorCode: "26001",
      ErrorMessage: "Number Invalid",
      Cause: "Invalid PhoneNumber passed",
      Resolution: "Please check the logs and pass a valid phone number"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27000",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27001",
      ErrorMessage: "Invalid options provided",
      Cause: "Input options are not provided",
      Resolution: "Please include the required parameters"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27002",
      ErrorMessage: "parameter `localMedia` is not defined",
      Cause: "LocalMedia is not defined",
      Resolution: "Please include localMedia parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27003",
      ErrorMessage: "parameter `remoteMedia` is not defined",
      Cause: "remoteMedia is not defined",
      Resolution: "Please include remoteMedia parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27004",
      ErrorMessage: "parameter `destination` is not defined",
      Cause: "destination is not defined",
      Resolution: "Please include destination parameter"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27005",
      ErrorMessage: "Invalid input parameter",
      Cause: "Invalid phone number",
      Resolution: "Please provide valid phone number"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27006",
      ErrorMessage: "Invalid input parameter",
      Cause: "Invalid SIP URI",
      Resolution: "Please provide valid SIP URI"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27007",
      ErrorMessage: "Invalid media type",
      Cause: "Invalid media constraints",
      Resolution: "Please provide use valid Media constraints attributes"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27008",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking dial"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "addCall",
      ErrorCode: "27009",
      ErrorMessage: "Can not make second call. There is no first call in progress.",
      Cause: "Invalid operation",
      Resolution: "Please ensure that there is an existing call in progress before making second call"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "move",
      ErrorCode: "28000",
      ErrorMessage: "User is not logged in",
      Cause: "Invalid operation",
      Resolution: "Please login first before invoking move"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "move",
      ErrorCode: "28001",
      ErrorMessage: "Move failed - call is not in progress",
      Cause: "Cannot move. There is no active call in progress.",
      Resolution: "Please make a call first ensure an active call is in progress before trying to move the call"
    },
    {
      JSObject: "ATT.rtc.Phone",
      JSMethod: "move",
      ErrorCode: "28002",
      ErrorMessage: "Internal error occurred",
      Cause: "Uncaught error",
      Resolution: "Please check the logs and contact support if needed"
    }
  ];

  // freezes a list of objects
  function freezeErrors(list) {

    // errors are now frozen
    Object.freeze(list);

    return list;
  }

  // try to export the Error List
  // This will throw an error if ATT.utils is not defined
  if (window.ATT.utils === undefined) {
    throw new Error('Cannot export SDK Errors into ATT.utils.ErrorStore.SDKErrors, ATT.utils namespace is undefined...'
      + '\n ATT: ' + JSON.stringify(window.ATT));
  }

  window.ATT.utils['ErrorStore'] = {};
  window.ATT.utils.ErrorStore['SDKErrors'] = {
    getAllSDKErrors: function () {
      var idx, errors = {}, errorId;
      for (idx = 0; idx < sdkErrors.length; idx = idx + 1) {
        errorId = sdkErrors[idx].ErrorCode;
        errors[errorId] = sdkErrors[idx];
      }
      return freezeErrors(errors);
    }
  };

}());
