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

  // BF Endpoints
    BFConf = {
      AMS: 'http://wdev.code-api-att.com:8080/RTC/v1',
      F6UAT: 'https://auth.api-stage.mars.bf.sl.attcompute.com/RTC/v1',
      PROD: 'https://api.att.com/RTC/v1'
    },

    appConfig = {
      BFEndpoint: null,
      DHSEndpoint: null,
      eventChannelConfig: {
        endpoint: '/events'
      }
    };

  function configure(key) {
    if (!key) {
      key = 'AMS'; // default to AMS endpoints
    }
    appConfig.BFEndpoint = BFConf[key];
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