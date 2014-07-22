/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true*/

//Dependency: ATT.logManager, cmgmt.CallManager, ATT.errorDictionary, ATT.RTCEvent, ATT.CallStatus

(function (app) {
  'use strict';

  var module = {},
    init,
    create,
    publish,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logger = logMgr.getLogger('ERROR', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);

  init = function () {
    logger.logDebug('Initializing error module');

    module.create = create;
    module.publish = publish;

    // add to the global namespace
    app.Error = module;
  };

  create = function (err, operation, moduleId) {
    logger.logDebug('error.create');
    logger.logTrace('raw error', err);

    var error,
      errObj;

    operation = operation || 'GeneralOperation';
    moduleId = moduleId || 'RTC';

    if (typeof err === 'string') { // String Errors
      if (err.indexOf("SDK-") === 0) {
        error = ATT.errorDictionary.getError(err); // if err is the errorCode, get it from error dictionary
      } else {
        error = ATT.errorDictionary.getDefaultError({
          moduleID: moduleId,
          operationName: operation,
          errorDescription: 'Operation ' + operation + ' failed',
          reasonText: err
        });
      }
    } else if (err.isSdkErr) { // Previously thrown SDK Errors
      error = err;
    } else if (err.getJson) { // Errors from Network/API
      errObj = err.getJson();
      if (errObj.RequestError) {    // Known API errors
        if (errObj.RequestError.ServiceException) { // API Service Exceptions
          error = ATT.errorDictionary.getErrorByOpStatus(operation,
            err.getResponseStatus(), errObj.RequestError.ServiceException.MessageId);
          if (error === undefined) {
            logger.logError("Error code not found in dictionary for key:" + operation + err.getResponseStatus() +
              errObj.RequestError.ServiceException.MessageId);
          } else {
            error.reasonText = errObj.RequestError.ServiceException.Text + ",Variables=" +
              errObj.RequestError.ServiceException.Variables;
          }
        } else if (errObj.RequestError.PolicyException) { // API Policy Exceptions
          error = ATT.errorDictionary.getErrorByOpStatus(operation,
            err.getResponseStatus(), errObj.RequestError.PolicyException.MessageId);
          if (error === undefined) {
            logger.logError("Error code not found in dictionary for key:" + operation +
              err.getResponseStatus(), errObj.RequestError.PolicyException.MessageId);
          } else {
            error.reasonText = errObj.RequestError.PolicyException.Text + ",Variables=" + errObj.RequestError.PolicyException.Variables;
          }
        } else if (errObj.RequestError.Exception) { // API Exceptions
          error = ATT.errorDictionary.getDefaultError({
            moduleID: moduleId,
            operationName: operation,
            httpStatusCode: err.getResponseStatus(),
            errorDescription: 'Operation ' + operation + ' failed',
            reasonText: errObj.RequestError.Exception.Text
          });
        }
      } else {
        if (moduleId === 'DHS') {
          error = ATT.errorDictionary.getDHSError({ // DHS thrown errors
            operationName: operation,
            httpStatusCode: err.getResponseStatus(),
            reasonText: errObj.error || ''
          });
        } else {
          error = ATT.errorDictionary.getDefaultError({ // Unknown API network errors
            moduleID: moduleId,
            operationName: operation,
            httpStatusCode: err.getResponseStatus(),
            errorDescription: 'Operation ' + operation + ' failed',
            reasonText: errObj.reason || 'WebRTC operation ' + operation + ' failed due to unknown reason'
          });
        }
      }
    }
    if (!error) { // Unknown errors
      error = ATT.errorDictionary.getMissingError();
    }
    return error;
  };

  publish = function (error, operation, handler) {
    logger.logDebug('error.publish');

    if (!error.isSdkErr) {
      error = create(error, operation);
    }

    logger.logError(error.formatError());
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
