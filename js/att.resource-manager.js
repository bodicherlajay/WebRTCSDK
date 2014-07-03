/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Env:true, ATT: true*/

// Dependency:  utils, LogManager, ATT.errorDictionary(loaded by att.main.js) - Dependency att.utils.sdk-error-store



(function () {
  "use strict";

  var errorDictionary = ATT.errorDictionary,
    utils = ATT.utils;

  function createResourceManager(apiConfig) {

    var restOperationsConfig,
      loggers = [],
      logger;

    if (undefined === apiConfig
        || 0 === Object.keys(apiConfig).length) {
      throw new Error('No API configuration passed');
    }

    function createRESTConfiguration(operationConfig, options) {

      var restConfig,
        formatters,
        formattersLength,
        headerType,
        headersObjectForREST;

      // we have an operation config.
      restConfig = ATT.utils.extend({}, operationConfig);
      formatters = operationConfig.formatters || {};
      formattersLength = Object.keys(formatters).length;

      if (formatters && formattersLength > 0) {
        if (undefined === options.params
            || formattersLength !== Object.keys(options.params).length) {
          logger.logError('Params passed in much match number of formatters');

          logger.logTrace('formatters: ' + JSON.stringify(formatters));
          logger.logTrace('params: ' + JSON.stringify(options.params));

          throw new Error('Params passed in must match number of formatters.');
        }

        // check that formatters match up with passed in params.
        if (formatters.url) {
          if (!options.params.url) {

            logger.logError('Please provide a URL parameter for the URL formatter.');
            throw new Error('You pass url param to for the url formatter.');
          }
        }

        // check headers.  just check that lengths match for now.
        if (formatters.headers) {
          if (Object.keys(options.params.headers).length !== Object.keys(operationConfig.formatters.headers).length) {
            logger.logError('Header formatters in APIConfigs do not match header parameters provided.');
            throw new Error('Header formatters in APIConfigs do not match the header parameters being passed in.');
          }
        }

        // Override url parameter with url from url formatter.
        if (typeof formatters.url === 'function') {
          restConfig.url = operationConfig.formatters.url(options.params.url);
          logger.logTrace('updated restConfig url', restConfig.url);
        }

        // header formatting.
        // call formatters for each header (by key)
        // need to concat default headers with header data passing in.
        if (typeof formatters.headers === 'object') {
          if (Object.keys(formatters.headers).length > 0) {
            headersObjectForREST = {};

            for (headerType in options.params.headers) {
              if (options.params.headers.hasOwnProperty(headerType)) {
                headersObjectForREST[headerType] = operationConfig.formatters.headers[headerType](options.params.headers[headerType]);
                logger.logDebug('header: ' + headerType + ', ' + headersObjectForREST[headerType]);
              }
            }

            // add this to the restConfig.  These will be in addition to the default headers.
            restConfig.headers = ATT.utils.extend({}, restConfig.headers);
            restConfig.headers = ATT.utils.extend(restConfig.headers, headersObjectForREST);
          }
        }
      }

      // data
      if (options.data) {
        restConfig.data = options.data;
      }

      return restConfig;
    }

    function createRESTOperation(restConfig) {

      logger.logTrace('configuring REST operation');

      function restOperation(successCB, errorCB, onTimeout) {

        var restClient;

        restConfig.success = successCB;
        restConfig.error = function (errResp) {
          if (errResp.getResponseStatus() === 0 && errResp.responseText === "") {
            errorCB.call(this, errorDictionary.getError("SDK-10000"));
          } else {
            errorCB.call(this, errResp);
          }
        };
        restConfig.ontimeout = onTimeout;

        restClient = new ATT.RESTClient(restConfig);

        // make request
        restClient.ajax();
      }

      return restOperation;
    }
    /**
     * Method to return a configured rest operation configured in the
     * att.config.api.js file.
     * @param operationName
     * @param options
     * @returns {Function}
     */
    function getOperation(operationName, options) {
      var operationConfig,
        restConfig,
        configuredRESTOperation;

      if (undefined === operationName
          || operationName.length === 0) {
        logger.logError('no operation name provided');
        throw new Error('Must specify an operation name.');
      }

      operationConfig = restOperationsConfig[operationName];

      if (undefined === operationConfig) {
        throw new Error('Operation not found.');
      }

      restConfig = createRESTConfiguration(operationConfig, options);
      configuredRESTOperation = createRESTOperation(restConfig);

      return configuredRESTOperation;
    }

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
    function doOperation(operationName, config) {
      logger.logTrace('do operation', operationName);
      try {
        var operation = module.getOperation(operationName, config);

        operation(config.success, config.error, config.ontimeout);
      } catch (e) {
        logger.logError(e);
      }
    }

    function newLogger(moduleName) {
      var logMgr = ATT.logManager.getInstance(), lgr;
      logMgr.configureLogger(moduleName, logMgr.loggerType.CONSOLE, logMgr.logLevel.INFO);
      lgr = logMgr.getLogger(moduleName);
      loggers[moduleName] = lgr;
      return loggers[moduleName];
    }

    function getLogger(moduleName) {
      var lgr = loggers[moduleName];
      if (lgr === undefined) {
        return newLogger(moduleName);
      }
      return lgr;
    }

    function getRestOperationsConfig() {
      return restOperationsConfig;
    }

    function updateLogLevel(moduleName, level) {
      var lgr = getLogger(moduleName);
      if (!lgr) {
        lgr.setLevel(level);
      }
    }


    logger = getLogger("resourceManagerModule");
    logger.logInfo('configuring resource manager module');
    restOperationsConfig = apiConfig;

    return {
      getOperation: getOperation,
      doOperation : doOperation,
      getRestOperationsConfig : getRestOperationsConfig,
      getLogger : getLogger,
      updateLogLevel : updateLogLevel
    };
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createResourceManager`');
  }
  ATT.private.factories.createResourceManager = createResourceManager;

}());
