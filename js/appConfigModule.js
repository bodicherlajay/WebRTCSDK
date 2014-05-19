/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT, Env*/
/**
* Application configuration file.  This must be loaded first.
*
*/
//Exposes Namespace: ATT.appConfig, ATT.configure()
//Dependency: Env.resourceManager, ATT.logManager

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  // DHS endpoint
  var DHSConf = 'http://localhost:9000';

  if (DHSConf.indexOf(window.location.hostname) == -1) {
      DHSConf = window.location.href;
      if (DHSConf.lastIndexOf('/') == DHSConf.length - 1) {
          DHSConf = DHSConf.slice(0, DHSConf.lastIndexOf('/'));
      }
  }

  // API Platform Endpoints
  var EnvConf = {
      AMS: 'http://wdev.code-api-att.com:8080/RTC/v1',
      F6UAT: 'https://api-stage.mars.bf.sl.attcompute.com/RTC/v1',
      PROD: 'https://api.att.com/RTC/v1'
    },
  // Event Channel Config
    EventChannelConf = {
      WebSockets: {
        type: 'websocket',
        method: 'post',
        endpoint: '/websocket'
      },
      LongPolling: {
        type: 'longpolling',
        method: 'get',
        endpoint: '/events'
      }
    },
    appConfig = {
      RTCEndpoint: null,
      DHSEndpoint: null,
      EventChannelConfig: null
    },
    logMgr = ATT.logManager.getInstance(),
    logger;

  logger = logMgr.getLogger('appConfigModule');

  function configure(key, useWebSockets) { // useWebSockets is optional, default to long-polling
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
      appConfig.DHSEndpoint = DHSConf;
      appConfig.EventChannelConfig = EventChannelConf[(useWebSockets ? 'WebSockets' : 'LongPolling')];
      app.appConfig = appConfig;

      // configure rest APIs now
      app.configureAPIs(appConfig);
    } catch (e) {
      //logger.logError(app.errorDictionary.getError());
      logger.logError(e);
    }

    if (Env) {
      // configure resource manager to for SDK public APIs
      Env.resourceManager.configure();
    }
  }
  app.configure = configure;

}(ATT || {}));