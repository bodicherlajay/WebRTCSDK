/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Env:true, ATT: true*/

// Dependency:  utils, LogManager, ATT.errorDictionary(loaded by ATTMain.js) - Dependency att.utils.sdk-error-store


if (!Env) {
  var Env = {};
}
Env = (function (app) {
  "use strict";

  var
    loggers = [],
    newLogger = function (moduleName) {
      var logMgr = ATT.logManager.getInstance(), lgr;
      logMgr.configureLogger(moduleName, logMgr.loggerType.CONSOLE, logMgr.logLevel.INFO);
      lgr = logMgr.getLogger(moduleName);
      loggers[moduleName] = lgr;
      return loggers[moduleName];
    },
    getLogger = function getLogger(moduleName) {
      var lgr = loggers[moduleName];
      if (lgr === undefined) {
        return newLogger(moduleName);
      }
      return lgr;
    },
    logger = getLogger("resourceManagerModule"),
    module = {},
    instance,
    apiObject,  // the object that public methods are placed on
    restOperationsConfig = {},
    restOperationsObject,

    getAPIObject = function () {
      return apiObject;
    },

    getOperationsAPI = function () {
      return restOperationsObject;
    },

    configure,

    addPublicMethod;


  function updateLogLevel(moduleName, level) {
    var lgr = getLogger(moduleName);
    if (!lgr) {
      lgr.setLevel(level);
    }
  }

  function init() {
    logger.logTrace('initializing resource manager module');
    return {
      configure:          configure,
      getAPIObject:       getAPIObject,
      getOperationsAPI:   getOperationsAPI,
      addPublicMethod:    addPublicMethod,
      getOperation:       module.getOperation,
      doOperation:        module.doOperation,
      getLogger:          getLogger,
      updateLogLevel:     updateLogLevel
    };
  }
  // Configure REST operations object and public API object.

  configure = function (config) {
    logger.logInfo('configuring resource manager module');
    config = ((config && Object.keys(config).length > 0) && config) || app.APIConfigs;

    restOperationsConfig = config;

    // set the rest API object
    Env.rtc = {
      rest: {}
    };
    restOperationsObject = Env.rtc.rest;

    // set the public api namespace object.
    ATT.utils.createNamespace(app, 'rtc.Phone');

    apiObject = ATT.rtc.Phone;

    // configure publci apis
    app.configurePublicAPIs();
  };

  /**
   * Adds public SDK methods.
   * @param name
   * @param method
   */
  addPublicMethod = function (name, method) {
    logger.logTrace('adding public method', name);
    var apiObj = getAPIObject();

    apiObj[name] = method;
  };

  module.getInstance = function () {
    logger.logTrace('getInstance called');
    if (!instance) {
      logger.logDebug('initializing instance');
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

  /**
   * Method that will perform the actual operation call on the configured
   * rest operation.
   * @param operationName
   * @param config
   * @param cb
   */
  module.doOperation = function (operationName, config) {
    logger.logTrace('do operation', operationName);
    try {
      var operation = module.getOperation(operationName, config);

      operation(config.success, config.error, config.ontimeout);
    } catch (e) {
      logger.logError(e);
    }
  };

  /**
   * Method to return a configured rest operation configured in the
   * APIConfigs.js file.
   * @param operationName
   * @param config
   * @returns {Function}
   */
  module.getOperation = function (operationName, config) {

    if (!operationName) {
      logger.logError('no operation name provided');
      throw new Error('Must specify an operation name.');
    }

    config = config || {
      success: function () { logger.logWarning('Not implemented yet.'); },
      error:   function () { logger.logWarning('Not implemented yet.'); }
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

    logger.logDebug('Configure method begins. TODO: remove configure method');
    if (!operationConfig) {
      logger.logError('Operation config not provided!');
      throw new Error('Operation does not exist.');
    }

    // we have an operation config.
    restConfig = ATT.utils.extend({}, operationConfig);
    formatters = operationConfig.formatters || {};
    formattersLength = (formatters && Object.keys(formatters).length) || 0;

    if (formatters && formattersLength > 0) {
      if (!config.params || (Object.keys(config.params).length !== formattersLength)) {
        logger.logError('Params passed in much match number of formatters');
        throw new Error('Params passed in must match number of formatters.');
      }

      // check that formatters match up with passed in params.
      if (formatters.url) {
        if (!config.params.url) {

          logger.logError('Please provide a URL parameter for the URL formatter.');
          throw new Error('You pass url param to for the url formatter.');
        }
      }

      // check headers.  just check that lengths match for now.
      if (formatters.headers) {
        if (Object.keys(config.params.headers).length !== Object.keys(operationConfig.formatters.headers).length) {
          logger.logError('Header formatters in APIConfigs do not match header parameters provided.');
          throw new Error('Header formatters in APIConfigs do not match the header parameters being passed in.');
        }
      }

      // Override url parameter with url from url formatter.
      if (typeof formatters.url === 'function') {
        restConfig.url = operationConfig.formatters.url(config.params.url);
        logger.logTrace('updated restConfig url', restConfig.url);
      }

      // header formatting.
      // call formatters for each header (by key)
      // need to concat default headers with header data passing in.
      if (typeof formatters.headers === 'object') {
        if (Object.keys(formatters.headers).length > 0) {
          headersObjectForREST = {};

          for (headerType in config.params.headers) {
            if (config.params.headers.hasOwnProperty(headerType)) {
              headersObjectForREST[headerType] = operationConfig.formatters.headers[headerType](config.params.headers[headerType]);
              logger.logDebug('header: ' + headerType + ', ' + headersObjectForREST[headerType]);
            }
          }

          // add this to the restConfig.  These will be in addition to the default headers.
          restConfig.headers = ATT.utils.extend(restConfig.headers, headersObjectForREST);
        }
      }
    }

    // data
    if (config.data) {
      restConfig.data = config.data;
    }

    // create the configured rest operation and return.
    configuredRESTOperation = function (successCB, errorCB, onTimeout) {
      logger.logTrace('configuring REST operation');
      restConfig.success = successCB;
      restConfig.error = function (errResp) {
        if (errResp.getResponseStatus() === 0 && errResp.responseText === "") {
          errorCB.call(this, app.errorDictionary.getError("SDK-10000"));
        } else {
          errorCB.call(this, errResp);
        }
      };
      restConfig.ontimeout = onTimeout;

      restClient = new ATT.RESTClient(restConfig);

      // make request
      restClient.ajax();
    };

    configuredRESTOperation.restConfig = restConfig; // testability.
    return configuredRESTOperation;
  };

  module.configure = configure;

  return {
    resourceManager : module
  };
}(ATT || {}));
