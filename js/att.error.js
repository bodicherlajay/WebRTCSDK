/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true*/

//Dependency: ATT.logManager, cmgmt.CallManager, ATT.errorDictionary, ATT.RTCEvent, ATT.CallStatus

(function (app) {
  'use strict';

  var module = {},
    init,
    create,
    publish,
    callManager,
    rtcEvent,
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
      error = ATT.errorDictionary.getDefaultError({
        moduleID: moduleId,
        operationName: operation,
        errorDescription: 'Operation ' + operation + ' failed',
        reasonText: err
      });
    } else if (err.isSdkErr) { // Previously thrown SDK Errors
      error = err;
    } else if (err.getJson) { // Errors from Network/API
      errObj = err.getJson();
      if (errObj.RequestError) {    // Known API errors
        if (errObj.RequestError.ServiceException) { // API Service Exceptions
          error = ATT.errorDictionary.getErrorByOpStatus(operation,
            err.getResponseStatus(), errObj.RequestError.ServiceException.MessageId);
        } else if (errObj.RequestError.PolicyException) { // API Policy Exceptions
          error = ATT.errorDictionary.getErrorByOpStatus(operation,
            err.getResponseStatus(), errObj.RequestError.PolicyException.MessageId);
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

    if (!callManager) {
      callManager = cmgmt.CallManager.getInstance();
    }

    if (!rtcEvent) {
      rtcEvent = ATT.RTCEvent.getInstance();
    }

    var session = callManager.getSessionContext(),
      sessionId,
      callbacks;

    if (session) {
      sessionId = session.getSessionId();
      if (sessionId) {
        logger.logTrace('Publishing the error as an event');
        // publish the UI callback event for call fail state
        return ATT.event.publish(sessionId + '.responseEvent', {
          state: ATT.CallStatus.ERROR,
          error: error
        });
      }
      callbacks = session.getUICallbacks();
      if (callbacks) {
        if (typeof callbacks.onError === 'function') {
          logger.logTrace('Publishing the error through on error UI callback');
          return callbacks.onError(rtcEvent.createEvent({
            state: ATT.CallState.ERROR,
            error: error
          }));
        }
        if (typeof callbacks.onCallError === 'function') {
          logger.logTrace('Publishing the error through on call error UI callback');
          return callbacks.onCallError(rtcEvent.createEvent({
            state: ATT.CallState.ERROR,
            error: error
          }));
        }
      }
    }
    logger.logWarning('Unable to publish error to UI');
  };

  init();
}(ATT || {}));