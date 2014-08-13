/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 250*/
/*global cmgmt:true, Logger:true, ATT:true*/

//Dependency: ATT.logManager, cmgmt.CallManager, ATT.errorDictionary, ATT.RTCEvent, ATT.CallStatus

(function (app) {
  'use strict';

  var module = {},
    init,
    parseAPIErrorResponse,
    createAPIErrorCode,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logger = logMgr.getLogger('ERROR', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);

  init = function () {
    logger.logDebug('Initializing error module');

    module.parseAPIErrorResponse = parseAPIErrorResponse;
    module.createAPIErrorCode = createAPIErrorCode;
    // add to the global namespace
    app.Error = module;
  };

  function parseAPIErrorResponse(response) {
    var errObj = response.getJson(), error = {}, apiError;
    if (!errObj.RequestError) {
      if (response.getResponseStatus() >= 500) {
        if (response.getJson() !== "") {
          apiError = JSON.stringify(response.getJson());
        } else {
          apiError = response.responseText;
        }
        error = ATT.errorDictionary.getAPIError("*", response.getResponseStatus(), "");
        error.APIError =  apiError;
        logger.logError("Service Unavailable");
        logger.logError(response);
        logger.logError(error);
      } else {
        error = {
          APIError: response.responseText
        };
        logger.logError(response);
        logger.logError(error);
      }
      error.ResourceMethod = response.getResourceURL();
      error.HttpStatusCode = response.getResponseStatus();
      return error;
    }
    if (errObj.RequestError.ServiceException) { // API Service Exceptions
      error = {
        APIError: errObj.RequestError.ServiceException.MessageId + ":" + errObj.RequestError.ServiceException.Text + ",Variables=" +
          errObj.RequestError.ServiceException.Variables,
        MessageId: errObj.RequestError.ServiceException.MessageId
      };
    } else if (errObj.RequestError.PolicyException) { // API Policy Exceptions
      error = {
        APIError: errObj.RequestError.PolicyException.MessageId + ":" + errObj.RequestError.PolicyException.Text + ",Variables=" + errObj.RequestError.PolicyException.Variables,
        MessageId: errObj.RequestError.PolicyException.MessageId
      };
    } else if (errObj.RequestError.Exception) { // API Exceptions
      error = {
        APIError: errObj.RequestError.Exception.MessageId || "" + ":" + errObj.RequestError.Exception.Text + ",Variables=" + errObj.RequestError.Exception.Variables || "",
        MessageId: errObj.RequestError.Exception.MessageId
      };
    }
    error.ResourceMethod = response.getResourceURL();
    error.HttpStatusCode = response.getResponseStatus();

    if (!error.APIError) {
      error.APIError = response.responseText;
      error.MessageId = "";
      logger.logError("Unable to parse API Error response is empty" + response + ":" + moduleId + ":" + methodName);
    }
    return error;
  }

  createAPIErrorCode = function (response, jsObject, methodName, moduleId) {
    logger.logTrace('raw error', response);

    var apiError, errorResponse;

    if (undefined !== response.HttpStatusCode) {
      errorResponse = response;
    } else if (undefined !== response.errorDetail.HttpStatusCode) {
      errorResponse = response.errorDetail;
    }
    methodName = methodName || 'GeneralOperation';
    moduleId = moduleId || 'RTC';

    if (errorResponse.HttpStatusCode !== 0) {
      apiError = ATT.errorDictionary.getAPIError(methodName,
        errorResponse.HttpStatusCode, errorResponse.MessageId);
      if (apiError !== undefined) {
        apiError.APIError = errorResponse.APIError;
        apiError.HttpStatusCode = errorResponse.HttpStatusCode;
        apiError.MessageId = errorResponse.MessageId;
        apiError.ResourceMethod = errorResponse.ResourceMethod;
      }
    } else {
      //Network connectivity related errors will not have valid http status code
      apiError = errorResponse;
    }

    if (!apiError) { // Unknown errors
      logger.logError("Error not found in Error dictionary ");
      logger.logError(response);
      apiError = ATT.errorDictionary.getDefaultError({
        JSObject: jsObject,
        ErrorCode: moduleId + "-UNKNOWN",
        JSMethod: methodName,
        HttpStatusCode: response.HttpStatusCode || 'Unknown',
        ErrorMessage: methodName + ' failed',
        APIError:  errorResponse.APIError || response.responseText,
        PossibleCauses: "Please look into APIError",
        PossibleResolution: "Please look into APIError",
        MessageId: errorResponse.MessageId || "",
        ResourceMethod: errorResponse.ResourceMethod || response.getResourceURL()
      });
      logger.logError("Generating Missing error response:" + apiError);
    }
    apiError.JSObject = jsObject;
    apiError.JSMethod = methodName;
    apiError.ModuleId = moduleId;
    apiError.ErrorMessage = methodName + " failed - " + apiError.ErrorMessage;
    return apiError;
  };

  init();
}(ATT || {}));
