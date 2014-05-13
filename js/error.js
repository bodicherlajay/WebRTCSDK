/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true*/

(function (app) {
  'use strict';

  var errorNamespace = {},
    init,
    publish,
    callManager,
    logMgr = ATT.logManager.getInstance(),
    logger;

  logMgr.configureLogger('ERROR', logMgr.loggerType.CONSOLE, logMgr.logLevel.DEBUG);
  logger = logMgr.getLogger('ERROR');

  init = function () {
    logger.logDebug('Error module init');

    // create namespace.
    errorNamespace = ATT.utils.createNamespace(app, 'rtc.error');
    errorNamespace.publish = publish;
  };

  publish = function (error) {
    logger.logDebug('error.publish');
    logger.logError(error);

    if (!callManager) {
      callManager = cmgmt.CallManager.getInstance();
    }

    var session = callManager.getSessionContext(),
      sessionId,
      callbacks;

    if (session) {
      sessionId = session.getSessionId();
      if (sessionId) {
        // publish the UI callback event for call fail state
        return ATT.event.publish(sessionId + '.responseEvent', {
          state:  ATT.CallStatus.ERROR,
          data: error
        });
      }
      callbacks = session.getUICallbacks();
      if (callbacks) {
        if (typeof callbacks.onError === 'function') {
          return callbacks.onError({
            state: ATT.CallState.ERROR,
            data: error
          });
        }
        if (typeof callbacks.onCallError === 'function') {
          return callbacks.onCallError({
            state: ATT.CallState.ERROR,
            data: error
          });
        }
      }
    }
    logger.logWarning('Unable to publish error to UI');
  };

  init();
}(ATT || {}));