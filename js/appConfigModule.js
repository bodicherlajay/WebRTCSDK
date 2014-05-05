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

    appConfig = {
      RTCEndpoint: null,
      DHSEndpoint: null,
      eventChannelConfig: {
        // Websockets: '/websocket'
        // Long-Polling: '/events'
        endpoint: '/events',
        // Websockets: 'post'
        // Long-Polling: 'get'
        method: 'get'
      }
    };

  function configure(key) {
    if (!key) {
      key = 'AMS'; // default to AMS endpoints
    }
    appConfig.RTCEndpoint = EnvConf[key];
    appConfig.DHSEndpoint = DHSConf;

    app.appConfig = appConfig;

    // configure rest APIs now
    app.configueAPIs();

    if (Env) {
      // configure resource manager to for SDK public APIs
      Env.resourceManager.configure();
    }
  }
  app.configure = configure;

}(ATT || {}));