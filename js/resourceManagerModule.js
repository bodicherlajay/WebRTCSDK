/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Env:true, ATT: true*/

// Dependency:  need to load ATT apiconfig module first before this can run.

if (!Env) {
  var Env = {};
}

Env = (function (app) {
  "use strict";

  var module = {},
    apiNamespaceName = 'rtc.Phone',
    instance,
    initOperations,
    addOperations,
    addOperation,
    getConfiguredRESTMethod,
    apiObject,
    restOperationsConfig = {},
    restOperationsObject,

    //getOperation,

    getAPIObject = function () {
      return apiObject;
    },

    getOperationsAPI = function () {
      return restOperationsObject;
    },

    configure,

    addPublicMethod,

    init = function () {
      return {
        configure:          configure,
        getAPIObject:       getAPIObject,
        getOperationsAPI:   getOperationsAPI,
        addPublicMethod:    addPublicMethod
      };
    };

  // Configure REST operations object and public API object.

  configure = function (config) {

    config = ((config && Object.keys(config).length > 0) && config) || app.APIConfigs;

    restOperationsConfig = config;

    // set the rest API object
    Env.rtc = {
      rest: {}
    };
    restOperationsObject = Env.rtc.rest;

    // set the public api namespace object.
    if (!ATT.rtc) {
      ATT.rtc = {
        Phone: {}
      };
    }
    apiObject = ATT.rtc.Phone;

    // add operations to ATT
    //initOperations(config);
  };

  addPublicMethod = function (name, method) {
    var apiObj = getAPIObject();

    apiObj[name] = method;
  };

  module.getInstance = function () {

    if (!instance) {
      instance = init();
    }
    return instance;
  };


  /**
    This will return a configured rest operation call.
    config = {
      data: {data},
      params: {
        url: [urldata1, urldata2],
        headers: {    // key corresponds to the header name.
          'Accept': 'abc',
          'Authorization': 'xyz'
        }
      }
    }

    // method 1
      var startCallOperation = resourceManager.getOperation('startCall', params);
      startCallOperation(success, error);

      // method 2
      resourceManager.doOperation('startCall', params, function (response) {

        // handle success and error

      });

  */
  module.doOperation = function (operationName, config, cb) {
    cb = cb || function () {};

    try {
      var operation = module.getOperation(operationName, config);
      operation(function (obj) {
        cb(obj);  //success
      }, function (obj) {
        cb(obj);  // error (this doesn't need to be passed in.)
      });
    } catch (e) {
      console.log(e);
    }
  };

  module.getOperation = function (operationName, config) {

    if (!operationName) {
      throw new Error('Must specify an operation name.');
    }

    config = config || {
      success: function () {},
      error:   function () {}
    };

    // todo:  remove the configure method.
    // remove the .apiConfig key on restOperationsConfig.
    var operationConfig = restOperationsConfig[operationName],
      restClient,
      restConfig,
      headerType,
      headersObjectForREST = {},
      formatters,
      formattersLength,
      configuredRESTOperation;

    if (!operationConfig) {
      throw new Error('Operation does not exist.');
    }

    // we have an operation config.
    restConfig = ATT.utils.extend({}, operationConfig);
    formatters = operationConfig.formatters || {};
    formattersLength = (formatters && Object.keys(formatters).length) || 0;

    if (formatters && formattersLength > 0) {
      if (!config.params || (Object.keys(config.params).length !== formattersLength)) {
        throw new Error('Params passed in must match number of formatters.');
      }

      // check that formatters match up with passed in params.
      if (formatters.url) {
        if (!config.params.url) {
          throw new Error('You pass url param to for the url formatter.');
        }
      }

      // check headers.  just check that lengths match for now.
      if (formatters.headers) {
        if (Object.keys(config.params.headers).length !== Object.keys(operationConfig.formatters.headers).length) {
          throw new Error('Header formatters in APIConfigs do not match the header parameters being passed in.');
        }
      }

      // Override url parameter with url from url formatter.
      if (typeof formatters.url === 'function') {
        restConfig.url = operationConfig.formatters.url(config.params.url);
      }

      // header formatting.
      // call formatters for each header (by key)
      // need to concat default headers with header data passing in.
      if (Object.keys(formatters.headers).length > 0) {
        headersObjectForREST = {};

        for (headerType in config.params.headers) {
          if (config.params.headers.hasOwnProperty(headerType)) {
            headersObjectForREST[headerType] = operationConfig.formatters.headers[headerType](config.params.headers[headerType]);
          }
        }

        // add this to the restConfig.  These will be in addition to the default headers.
        restConfig.headers = ATT.utils.extend(restConfig.headers, headersObjectForREST);
      }
    }

    // data
    if (config.data) {
      restConfig.data = config.data;
    }

    // create the configured rest operation and return.
    configuredRESTOperation = function (successCB, errorCB) {
      restConfig.success = successCB;
      restConfig.error = errorCB;

      restClient = new ATT.RESTClient(restConfig);

      // make request
      restClient.ajax();
    };

    configuredRESTOperation.restConfig = restConfig; // testability.
    return configuredRESTOperation;
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
        restClient,
        key;

      // override (or extend if headers) ajax configuration with passed in config object
      for (configKey in config) {
        if (config.hasOwnProperty(configKey)) {

          // if header, extend, otherwise overwrite.
          if (configKey === 'headers') {
            if (methodConfig[configKey]) {
              methodConfig[configKey] = ATT.utils.extend(methodConfig[configKey], config[configKey]);
            }
          } else {
            methodConfig[configKey] = config[configKey];
          }
        }
      }

      // create restclient parameters from the formatter functions.
      if (methodConfig && methodConfig.formatters) {
        if (Object.keys(methodConfig.formatters).length > 0) {
          for (key in methodConfig.formatters) {
            if (methodConfig.formatters.hasOwnProperty(key)) {
              methodConfig[key] = methodConfig.formatters[key](methodConfig.apiParameters[key]);
            }
          }
        }
      }

      restClient = new ATT.RESTClient(methodConfig);

      // attach the restclient to the method (to expose actual rest client for unit testability).
      // probably a better way to do this..drawing a blank at the moment.
      apiObject[methodName].restClient = restClient;

      // make request
      restClient.ajax();
    };
  };

  configure();


  return {
    resourceManager : module
  };

  /**
   * Add operations to ATT namespace.
   */
//  initOperations = function (config) {
//    var apiConfig = config || {
//      apiConfigs: app.APIConfigs
//    };
//
//    if (Object.keys(apiConfig).length > 0) {
//      addOperations(apiConfig);
//    }
//  };
//
//  /**
//   * Add all API operations from config.
//   * @param {Object} methodConfigs The config for each method
//   */
//  addOperations = function (methodConfigs) {
//    var methodName,
//      o;
//    for (methodName in methodConfigs) {
//      if (methodConfigs.hasOwnProperty(methodName)) {
//        o = {};
//        o[methodName] = methodConfigs[methodName];
//        addOperation(o);
//      }
//    }
//  };
//
//  /**
//   * Add an API method to the ATT namespace
//   * @param {Object} apiMethodConfig The config for each method
//   */
//  addOperation = function (apiMethodConfig) {
//    var methodName = Object.keys(apiMethodConfig)[0],
//      methodDescription = apiMethodConfig[methodName];
//
//    // Add API operation to the ATT namespace.
//    restOperationsObject[methodName] = getConfiguredRESTMethod({
//      methodName: methodName,
//      methodDescription: methodDescription
//    });
//  };


}(ATT || {}));
