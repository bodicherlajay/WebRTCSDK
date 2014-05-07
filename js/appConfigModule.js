/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT, Env*/
/**
* Application configuration file.  This must be loaded first.
*
*/

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  // DHS endpoint
  var DHSConf = 'http://localhost:9000',

  // API Platform Endpoints
    EnvConf = {
      AMS: 'http://wdev.code-api-att.com:8080/RTC/v1',
      F6UAT: 'https://api-stage.mars.bf.sl.attcompute.com/RTC/v1',
      PROD: 'https://api.att.com/RTC/v1'
    },
    logMgr = ATT.logManager.getInstance(),
    logger,
    appConfig = {
      RTCEndpoint: null,
      DHSEndpoint: null,
      eventChannelConfig: {
        // For Websockets: '/websocket'
        // For Long-Polling: '/events'
        endpoint: '/events',
        // For Websockets: 'post'
        // For Long-Polling: 'get'
        method: 'get'
      }
    };
  logMgr.configureLogger('appConfigModule', logMgr.loggerType.CONSOLE, logMgr.logLevel.TRACE);
  logger = logMgr.getLogger('appConfigModule');

  function configure(key) {
    try {
      if (!key) {
        key = 'AMS'; // default to AMS endpoints
        logger.logTrace('Default ENVIRNOMENT set by SDK : ' + key);
        logger.logTrace('url: ' + EnvConf[key]);
      } else {
        logger.logTrace('User Configured ENVIRNOMENT: ' + key);
        logger.logTrace('url: ' + EnvConf[key]);
      }
      appConfig.RTCEndpoint = EnvConf[key];
      if (!key) {
        key = 'AMS'; // default to AMS endpoints
        logger.logInfo('Default ENVIRNOMENT set by SDK : ' + key);
        logger.logInfo('url: ' + EnvConf[key]);
      } else {
        logger.logInfo('User Configured ENVIRNOMENT: ' + key);
        logger.logInfo('url: ' + EnvConf[key]);
      }
      appConfig.RTCEndpoint = EnvConf[key];
      appConfig.DHSEndpoint = DHSConf;
      app.appConfig = appConfig;

      // configure rest APIs now
      app.configueAPIs();
    } catch (e) {
      //logger.logError(app.errorDictionary.getError());
    }

    if (Env) {
      // configure resource manager to for SDK public APIs
      Env.resourceManager.configure();
    }
  }
  app.configure = configure;

}(ATT || {}));