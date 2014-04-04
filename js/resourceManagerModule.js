/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Env:true, ATT: true*/

// Dependency:  need to load ATT apiconfig module first before this can run.

if (!Env) {
  var Env = {};
}

Env = (function (app) {
  "use strict";


  var module = {},
    instance,
    initOperations,
    addOperations,
    addOperation,
    getConfiguredRESTMethod,
    apiObject,
    configure = function (config) {
      config = (config && config.apiConfigs) || app.APIConfigs;

      app[app.apiNamespaceName] = {};
      apiObject = app[app.apiNamespaceName];

      initOperations(config); // add operations to ATT.rtc namespace.
    },
    getAPIObject = function () {
      return app[app.apiNamespaceName];
    },

    init = function () {
      return {
        configure: configure,
        getAPIObject: getAPIObject
      };
    };

  apiObject = app[app.apiNamespaceName];
  if (apiObject === undefined) {
    apiObject = {};
  }

  module.getInstance = function () {

    if (!instance) {
      instance = init();
    }
    return instance;
  };

  /**
   * Add operations to ATT namespace.
   */
  initOperations = function (config) {
    var apiConfig = config || {
      apiConfigs: app.APIConfigs
    };

    if (Object.keys(apiConfig).length > 0) {
      addOperations(apiConfig);
    }
  };

  /**
   * Add all API operations from config.
   * @param {Object} methodConfigs The config for each method
   */
  addOperations = function (methodConfigs) {
    var methodName,
      o;
    for (methodName in methodConfigs) {
      if (methodConfigs.hasOwnProperty(methodName)) {
        o = {};
        o[methodName] = methodConfigs[methodName];
        addOperation(o);
      }
    }
  };

  /**
   * Add an API method to the ATT namespace
   * @param {Object} apiMethodConfig The config for each method
   */
  addOperation = function (apiMethodConfig) {
    var methodName = Object.keys(apiMethodConfig)[0],
      methodDescription = apiMethodConfig[methodName];

    // Add API operation to the ATT namespace.
    apiObject[methodName] = getConfiguredRESTMethod({
      methodName: methodName,
      methodDescription: methodDescription
    });
  };

  /**
   * Returns function that will call configured REST method.
   * @param {Object} apiMethodConfig API method config object.
   * @returns {Function}
   */
  getConfiguredRESTMethod = function (apiMethodConfig) {
    var methodConfig = apiMethodConfig.methodDescription,
      methodName = apiMethodConfig.methodName;

    // runtime call
    return function (config) {

      var configKey,
        restClient;

      // override any ajax configuration with passed in config object
      // data, success, error
      for (configKey in config) {
        if (config.hasOwnProperty(configKey)) {
          methodConfig[configKey] = config[configKey];
        }
      }

      // url formatter.  urlParams should be set on method config so pass in.
      if (typeof methodConfig.urlFormatter === 'function') {
        methodConfig.url = methodConfig.urlFormatter(methodConfig.urlParams);
      }

      restClient = new ATT.RESTClient(methodConfig);

      // attach the restclient to the method (to expose actual rest client for unit testability).
      // probably a better way to do this..drawing a blank at the moment.
      apiObject[methodName].restClient = restClient;

      // make request
      restClient.ajax();
    };
  };

  return {
    resourceManager : module
  };

}(ATT || {}));
