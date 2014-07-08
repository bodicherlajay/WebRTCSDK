/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT, Env*/
/**
* Application configuration file.  This must be loaded first.
*
*/
//Exposes Namespace: ATT.appConfig, ATT.configure()
//Dependency: ATT.logManager

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  // keep alive default duration, change
  var KeepAliveDuration = 0, // ms, set to 0 for using duration from API server

  // DHS endpoint
    DHSConf = {
      HTTP: 'http://localhost:9000',
      HTTPS: 'https://localhost:9001'
    },
  // API Platform Endpoints
    environments = {
      AMS: 'http://wdev.code-api-att.com:8080/RTC/v1',
      F6UAT: 'https://api-stage.mars.bf.sl.attcompute.com/RTC/v1',
      F3UAT: 'https://api-uat.mars.bf.sl.attcompute.com/RTC/v1',
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
    currentConfig = {
      KeepAlive: 0,
      RTCEndpoint: null,
      environment: 'PROD',
      DHSEndpoint: null,
      useWebSockets: false,
      EventChannelConfig: null
    },
    protocol = (window.location.protocol).replace(':', '').toUpperCase(),

    logMgr = ATT.logManager.getInstance(),

    logger = logMgr.getLogger('appConfigModule');

  function configure(key, useWebSockets) { // useWebSockets is optional, default to long-polling
    var apiConfigs;

    try {
      if (!key) {
        key = 'AMS'; // default to AMS endpoints
        logger.logTrace('Default ENVIRNOMENT set by SDK : ' + key);
        logger.logTrace('url: ' + environments[key]);
      } else {
        logger.logTrace('User Configured ENVIRNOMENT: ' + key);
        logger.logTrace('url: ' + environments[key]);
      }
      currentConfig.KeepAlive = KeepAliveDuration;
      currentConfig.RTCEndpoint = environments[key] || environments.PROD;
      currentConfig.environment = (undefined === key) ? 'PROD' : key;
      currentConfig.DHSEndpoint = DHSConf[protocol] || DHSConf.HTTP;
      currentConfig.useWebSockets = (undefined === useWebSockets) ? false : useWebSockets;
      if (currentConfig.useWebSockets) {
        currentConfig.EventChannelConfig = EventChannelConf.WebSockets;
      } else {
        currentConfig.EventChannelConfig = EventChannelConf.LongPolling;
      }
      app.appConfig = currentConfig;

      // configure rest APIs now
      apiConfigs = app.configureAPIs(currentConfig);
    } catch (e) {
      //logger.logError(app.errorDictionary.getError());
      logger.logError(e);
    }

    return apiConfigs;
  }
  app.configure = configure;
  
  ATT.private.config.app.environments = environments;
  ATT.private.config.app.current = currentConfig;

}(ATT || {}));