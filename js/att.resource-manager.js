/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Env:true, ATT: true*/

// Dependency:  utils, LogManager, ATT.errorDictionary(loaded by att.main.js) - Dependency att.utils.sdk-error-store



(function () {
  "use strict";

  var errorDictionary,
    utils = ATT.utils,
    logManager = ATT.logManager.getInstance();

  function createResourceManager(apiConfig) {

    var apiConfigs,
      logger = logManager.addLoggerForModule('ResourceManager');

    if (undefined === apiConfig
        || 0 === Object.keys(apiConfig).length) {
      throw new Error('No API configuration passed');
    }

    if (undefined === apiConfig.getConfiguration) {
      throw new Error('No `getConfiguration` method found.');
    }

    function createRESTConfiguration(operationConfig, options) {

      var restConfig,
        formatters,
        formattersLength,
        headerType,
        headerObj,
        optionKey,
        headersObjectForREST;

      // we have an operation config.
      restConfig = utils.extend({}, operationConfig);
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
                if ('options' === headerType && 'object' === typeof operationConfig.formatters.headers[headerType]) {
                  if (Object.keys(options.params.headers[headerType]).length === 0) {
                    throw new Error('Options for header not passed in. Cannot construct request');
                  }
                  optionKey = Object.keys(options.params.headers[headerType])[0];
                  headerObj = operationConfig.formatters.headers[headerType][optionKey];
                  headerType = optionKey;
                } else {
                  headerObj = operationConfig.formatters.headers[headerType];
                }
                headersObjectForREST[headerType] = headerObj(options.params.headers[headerType]);
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
        errorDictionary = ATT.errorDictionary;

        restConfig.success = successCB;
        restConfig.error = function (errResp) {
          if (errResp.getResponseStatus() === 0 && errResp.responseText === "") {
            errResp.errorDetail = errorDictionary.getSDKError('0003');
            errResp.errorDetail.HttpStatusCode = errResp.getResponseStatus();
            errResp.errorDetail.ResourceMethod = errResp.getResourceURL();
            errorCB.call(this, errResp.errorDetail);
          } else {
            errResp.errorDetail = ATT.Error.parseAPIErrorResponse(errResp);
            errorCB.call(this, errResp.errorDetail);
          }
        };
        restConfig.ontimeout = function (errResp) {
          var error = {errorDetail: ""};
          error.errorDetail = errorDictionary.getSDKError('0003');
          error.errorDetail.HttpStatusCode = 0;
          error.errorDetail.ResourceMethod = restConfig.url;
          if (!onTimeout) {
            errorCB.call(this, error.errorDetail);
          } else {
            onTimeout.call(this, error.errorDetail);
          }
        }

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
        configuredRESTOperation,
        currentConfiguration;

      currentConfiguration = apiConfigs.getConfiguration();
      operationConfig = currentConfiguration[operationName];

      if (undefined === operationConfig) {
        throw new Error('Operation not found.');
      }

      if (undefined === options) {
        throw new Error('No options found.');
      }

      logger.logTrace('do operation', operationName);



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

     Example:
     resourceManager.doOperation('startCall', params, function (response) {

        // handle success and error

      });

     */

    /**
     * Method that will perform the actual operation call on the configured
     * rest operation.
     * @param operationName
     * @param config
     */
    function doOperation(operationName, config) {

      if (undefined === operationName
          || operationName.length === 0) {
        logger.logError('no operation name provided');
        throw new Error('Must specify an operation name.');
      }

      if (undefined === config
           || Object.keys(config).length === 0) {
        throw new Error('No options found.');
      }

      if (undefined === config.success) {
        throw new Error('No `success` callback passed.');
      }

      if (typeof config.success !== 'function') {
        throw new Error('`success` callback has to be a function.');
      }

      if (undefined === config.error) {
        throw new Error('No `error` callback passed.');
      }

      if (typeof config.error !== 'function') {
        throw new Error('`error` callback has to be a function.');
      }

      try {
        var operation = getOperation(operationName, config);

        operation(config.success, config.error, config.ontimeout);
      } catch (e) {
        logger.logError(e);
        throw e;
      }
    }



    function getRestOperationsConfig() {
      return apiConfigs.getConfiguration();
    }


    logger.logInfo('configuring resource manager module');
    apiConfigs = apiConfig;

    return {
      doOperation : doOperation,
      getRestOperationsConfig : getRestOperationsConfig
    };
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createResourceManager`');
  }
  ATT.private.factories.createResourceManager = createResourceManager;

}());
