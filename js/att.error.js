/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true*/

//Dependency: ATT.logManager, cmgmt.CallManager, ATT.errorDictionary, ATT.RTCEvent, ATT.CallStatus

(function (app) {
  'use strict';

  var module = {},
    init,
    create,
    publish,
    createAPIErrorCode,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logger = logMgr.getLogger('ERROR', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);

  init = function () {
    logger.logDebug('Initializing error module');

    module.create = create;
    module.publish = publish;
    module.createAPIErrorCode = createAPIErrorCode;
    // add to the global namespace
    app.Error = module;
  };

  function parseAPIErrorResponse(err, moduleId, methodName) {
    var errObj = err.getJson(), error, apiError;
    if (!errObj.RequestError) {
      if (err.getResponseStatus() >= 500) {
        if (err.getJson() !== "") {
          apiError = JSON.stringify(err.getJson());
        } else {
          apiError = err.responseText;
        }
        error = ATT.errorDictionary.getAPIError("*", err.getResponseStatus(), "");
        error.APIError =  apiError;
        error.ResourceMethod = err.getResourceURL();
        if (moduleId == "DHS") error.ErrorCode ="DHS-0001";
        logger.logError("Service Unavailable");
        logger.logError(err);
        logger.logError(error);
      }
      return error;
    }
    if (errObj.RequestError.ServiceException) { // API Service Exceptions
      error = ATT.errorDictionary.getAPIError(methodName,
        err.getResponseStatus(), errObj.RequestError.ServiceException.MessageId);
      if (error === undefined) {
        logger.logError("Error code not found in dictionary for key:" + methodName + err.getResponseStatus() +
          errObj.RequestError.ServiceException.MessageId);
      } else {
        error.APIError = errObj.RequestError.ServiceException.MessageId + ":" + errObj.RequestError.ServiceException.Text + ",Variables=" +
          errObj.RequestError.ServiceException.Variables;
      }
    } else if (errObj.RequestError.PolicyException) { // API Policy Exceptions
      error = ATT.errorDictionary.getAPIError(methodName,
        err.getResponseStatus(), errObj.RequestError.PolicyException.MessageId);
      if (error === undefined) {
        logger.logError("Error code not found in dictionary for key:" + methodName +
          err.getResponseStatus(), errObj.RequestError.PolicyException.MessageId);
      } else {
        error.APIError = errObj.RequestError.PolicyException.MessageId + ":" + errObj.RequestError.PolicyException.Text + ",Variables=" + errObj.RequestError.PolicyException.Variables;
      }
    } else if (errObj.RequestError.Exception) { // API Exceptions
      error = {
        JSObject:moduleId,        //JS Object
        JSMethod:methodName,       //JS Method
        ErrorCode: err.getResponseStatus(),         //Error code
        ErrorMessage: 'Error occurred',         //Error Message
        PossibleCauses: 'Please look into APIError message',       //Possible Causes
        PossibleResolution: 'Please look into APIError message',   //Possible Resolution
        APIError: errObj.RequestError.Exception.Text,          //API Error response
        ResourceMethod: err.getResourceURL(),       //Resource URI
        HttpStatusCode:err.getResponseStatus(),     //HTTP Status Code
        MessageId:''           //Message ID
      }
      error = ATT.errorDictionary.getAPIExceptionError(error);
    }

    if (!error) {
      logger.logError("Unable to parse API Error response is empty or not found in error dictionary," + err + ":" + moduleId + ":" + methodName);
    } else {
      error.ResourceMethod = err.getResourceURL();
    }
    return error;
  }

  createAPIErrorCode = function(err, jsObject, methodName, moduleId) {
    logger.logTrace('raw error', err);

    var apiError;
    methodName = methodName || 'GeneralOperation';
    moduleId = moduleId || 'RTC';

    if (err.errorDetail.HttpStatusCode !== 0) {
      apiError = ATT.errorDictionary.getAPIError(methodName,
        err.errorDetail.HttpStatusCode, err.errorDetail.MessageId);
    } else
    {
      //Network connectivity related errors will not have valid http status code
      apiError = err.errorDetail;
    }

    if (!apiError.ErrorCode) { // Unknown errors
      logger.logError("Error not found in Error dictionary ");
      logger.logError(err);
      apiError = ATT.errorDictionary.getDefaultError({
        JSObject: jsObject,
        ErrorCode: moduleId + "-00001",
        JSMethod: methodName,
        HttpStatusCode: err.getResponseStatus(),
        ErrorMessage: 'Operation ' + methodName + ' failed',
        APIError:  err.responseText,
        PossibleCauses:"Please look into APIError",
        PossibleResolution:"Please look into APIError",
        MessageId:"",
        ResourceMethod: err.getResourceURL()
      });
      logger.logError("Generating Missing error response:" + apiError);
    }
    apiError.JSObject = jsObject;
    apiError.JSMethod = methodName;
    apiError.ModuleId = moduleId;
    return apiError;
  }

  create = function (err, methodName, moduleId ) {
    logger.logDebug('error.create');
    logger.logTrace('raw error', err);

    var error, errorResponse = " failed due to unknown reason, Please look into Console for details";
    methodName = methodName || 'GeneralOperation';
    moduleId = moduleId || 'RTC';

    if (err.getJson) { // Errors from Network/API
      if (moduleId !== 'DHS') {
        error = parseAPIErrorResponse(err,moduleId,methodName);
      } else if (moduleId === 'DHS') {
        if (err.getJson() != "") {
          error = parseAPIErrorResponse(err,moduleId,methodName);
          error.ErrorCode= "DHS-0001";
        } else {
          error = ATT.errorDictionary.getDHSError({ // DHS thrown errors
            JSObject: moduleId,
            ErrorCode: "DHS-0001",
            JSMethod: methodName,
            HttpStatusCode: err.getResponseStatus(),
            ErorMessage:"DHS error occurred",
            PossibleCauses: "",
            PossibleResolution: "",
            APIError: err.responseText,
            ResourceMethod: err.getResourceURL()
          });
        }
      } else {
          error = ATT.errorDictionary.getDefaultError({ // Unknown API network errors
            JSObject: moduleId,
            ErrorCode: "UNKNOWN-0000",
            JSMethod: methodName,
            HttpStatusCode: err.getResponseStatus(),
            ErrorMessage: 'Operation ' + methodName + ' failed',
            APIError: methodName + err.getJson() ||errorResponse,
            PossibleCauses:"",
            PossibleResolution:"",
            ResourceMethod: err.getResourceURL()
          });
        if (moduleId == "DHS") error.ErrorCode ="DHS-0001";
      }
    }
    if (!error.ErrorCode) { // Unknown errors
      error = ATT.errorDictionary.getMissingError({
        JSObject: "ATT.RTC",
        ErrorCode: "UNKNOWN-00001",
        JSMethod: methodName,
        HttpStatusCode: err.getResponseStatus(),
        ErrorMessage: 'Operation ' + methodName + ' failed',
        APIError:  methodName + err.getJson() ||errorResponse,
        PossibleCauses:"",
        PossibleResolution:"",
        MessageId:"",
        ResourceMethod: err.getResourceURL()
      });
      if (moduleId == "DHS") error.ErrorCode ="DHS-0001";
      logger.logError("Generating Missing error response:" + error);
    }
    return error;
  };
  //todo remove this method - used by DHS only
  publish = function (error, operation, handler) {
    logger.logDebug('error.publish');

    logger.logTrace('The error object is: ', error);

    if (typeof handler === 'function') {
      return handler(error);
    }

    // var session = ATT.RTCManager.getSession(),
    //   sessionId = session.getSessionId();

    // logger.logTrace('Publishing the error as an event');

    // // publish the UI callback event for call fail state
    // ATT.event.publish(sessionId + '.responseEvent', {
    //   state: ATT.CallStatus.ERROR,
    //   error: error
    // });

    logger.logWarning('Unable to publish error to UI');
  };

  init();
}(ATT || {}));
