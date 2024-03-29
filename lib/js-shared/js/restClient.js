/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

/**
 * Abstraction of the XMLHttpRequest used in the SDK and DHS.
 */
//required for nodejs
if (!ATT) {
  var ATT = {};
}
var attUtils = null;
if (typeof module === "object" && module && typeof module.exports === "object") {
  attUtils = {
    utils : require('./att.utils'),
    LogManagerModule : require('./../js/LogManagerModule')
  };
  module.exports = attUtils;
}

var RESTClient = (function (mainModule) {
  'use strict';

  var typeofWindow = typeof window,
    typeofModule = typeof module === "object" && module && typeof module.exports === "object",
    logger = null,
    defaultErrorHandler,
    errorHandler,
    getUtils = function (app) {
      if (typeofModule) {
        return attUtils.utils.utils;
      }
      return app.utils;
    },
    //Inject logger
    setLogger = function (lgr) {
      logger = lgr;
    },
    getLogger = function (app) {
      if (typeofModule) {
        return attUtils.LogManagerModule.getInstance();
      }
      return app.logManager.getInstance();
    },
    logMgr = getLogger(mainModule),
    RESTClient =  function (config) {
      // set default logger
      logMgr.configureLogger('RESTClient', logMgr.loggerType.CONSOLE, logMgr.logLevel.DEBUG);
      logger = logMgr.getLogger('RESTClient');

      this.config =  getUtils(mainModule).extend({}, config);
        // default ajax configuration
      this.config.async = this.config.async || true;
      this.config.timeout = this.config.timeout || 30000;
      this.config.success = this.config.success || function () { return; };
      this.config.error = this.config.error || defaultErrorHandler;
      this.config.ontimeout = this.config.ontimeout || function (xhr) {
        logger.logDebug(xhr);
        logger.logError("Request timed out");
        return;
      };
      this.config.headers = this.config.headers || {};
      this.config.headers['Content-Type'] = this.config.headers['Content-Type'] || 'application/json';
      this.config.headers.Accept = this.config.headers.Accept || 'application/json';

    },
    parse_headers =  function (input) {
      var result = [], headers_list = input.split('\n'), index, line, key, value;
      for (index in headers_list)
        {
          if (headers_list.hasOwnProperty(index)) {
            line = headers_list[index];
            key = line.split(':')[0];
            value = line.split(':').slice(1).join(':').trim();
            if (key.length > 0) {
              result[key] = value;
            }
          }
        }
      return result;
    },
    //print request details
    showRequest =  function (method, url, headers, body) {
      var reqLogger, key, reqBody = JSON.stringify(body);
      try {
        reqLogger = logMgr.getLogger('RESTClient');
      } catch (e) {
        console.log("Unable to configure request logger" + e);
      }
      reqLogger.logDebug('---------Request---------------');
      reqLogger.logDebug(method + ' ' + url + ' HTTP/1.1');
      reqLogger.logDebug('=========headers=======');
      for (key in headers) {
        if (headers.hasOwnProperty(key)) {
          reqLogger.logDebug(key + ': ' + headers[key]);
        }
      }
      if (reqBody !== undefined) {
        reqLogger.logDebug('=========body==========');
        reqLogger.logDebug(reqBody);
      }
    },
    //print response details for success
    show_response =  function (response) {
      var resLogger, ph;
      try {
        resLogger = logMgr.getLogger('RESTClient');
      } catch (e) {
        console.log("Unable to configure default logger" + e);
      }

      resLogger.logDebug('---------Response--------------');
      resLogger.logDebug(response.getResponseStatus());
      resLogger.logDebug('=========headers=======');
      resLogger.logDebug(response.headers);
      ph = parse_headers(response.headers);
      if (ph.Location !== undefined) {
        resLogger.logDebug("Location: " + ph.Location);
      }
      resLogger.logDebug('=========body==========');
      resLogger.logDebug(response.responseText);
    },
    parseJSON = function (xhr) {
      var contType = xhr.getResponseHeader("Content-Type"),
        json;
      if (contType && contType.indexOf("application/json") === 0) {
        json = JSON.parse(xhr.responseText);
        return typeof json === 'object' ? json : JSON.parse(json); // double parse some JSON responses
      }
      return "";
    },
    buildResponse = function(xhr, config) {
      var responseObject = {
        getJson: function () {
          return parseJSON(xhr);
        },
        getResponseHeader: function (key) {
          return xhr.getResponseHeader(key);
        },
        responseText: xhr.responseText,
        headers: xhr.getAllResponseHeaders(),
        location: xhr.getResponseHeader('Location'),
        statusText: xhr.statusText,
        getResponseStatus: function () {
          return xhr.status;
        },
        getResourceURL: function () {
          return config.method.toUpperCase() + " " + config.url;
        }
      }
      return responseObject;
    },
    success = function (config) {
      // private methods
      var xhr = this,
        responseObject = buildResponse(xhr,config),
        responseCopy = getUtils(mainModule).extend({}, responseObject);
      show_response(responseCopy);
      if (xhr.status >= 400 && xhr.status <= 599) {
        if (typeof errorHandler === 'function') {
          errorHandler.call(xhr, responseCopy);
        } else {
          defaultErrorHandler.call(xhr, responseCopy);
        }
      } else {
        config.success.call(xhr, responseCopy);
      }
    },
    error = function (config) {
      var xhr = this,
        responseObject = buildResponse(xhr,config),
        responseCopy = getUtils(mainModule).extend({}, responseObject);
      show_response(responseCopy);
      //call the error callback
      config.error.call(this, responseCopy);
    },
    timeout = function (config) {
      var xhr = this,
        responseObject = buildResponse(xhr,config),
        responseCopy = getUtils(mainModule).extend({}, responseObject);
      show_response(responseCopy);
      //call the timeout callback
      logger.logError("Request timeout");
      config.ontimeout.call(this, responseCopy);
    }
    ;
  // public methods
  RESTClient.prototype.ajax = function () {
    var config = this.config,  xhr = new XMLHttpRequest(), data = null, header = null, errLogger = null;
    try {
      data = config.data && JSON.stringify(config.data);
      if (!logger) {
        console.log("Using console logger for debugging");
        setLogger(null);
      }
      // timeout
      xhr.timeout = config.timeout;

      // success callback
      xhr.onload = success.bind(xhr, config);

      // set up passed in error handler to be called if xhr status is in error.
      errorHandler = config.error;

      // error callback
      xhr.onerror = function () {
        if (config.error !== 'undefined') {
          error.call(this, config);
        } else {
          throw new Error('Network error occurred in REST client.');
        }
      };
      // This should address request cancel events for CORS or any other issues
      xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 0 && this.statusText === "") {
          //if there is no timeout handler configured then call the error handler
          if (config.ontimeout === undefined) {
            logger.logError("Failed to complete request for resource:" + config.url);
            error.call(this, config);
          }
        }
      };

      xhr.onabort = error.bind(xhr, config);

      // on timeout callback
      xhr.ontimeout = timeout.bind(xhr,config); //config.ontimeout;

      // open connection
      xhr.open(config.method, config.url, config.async);

      // optional headers from config
      for (header in config.headers) {
        if (config.headers.hasOwnProperty(header)) {
          xhr.setRequestHeader(header, config.headers[header]);
        }
      }
      showRequest(config.method, config.url, config.headers, data);
      xhr.send(data);

    } catch (ex) {
      errLogger = logMgr.getLogger('RESTClient');
      errLogger.logError("XHR request failed, " + ex);
      if (typeof errorHandler === 'function') {
        errorHandler.call(xhr, ex);
      } else {
        defaultErrorHandler.call(xhr, ex);
      }
    }
  };

  /**
   * Default ajax error handler.
   */
  defaultErrorHandler = function (obj) {
    throw new Error('RESTClient error handler triggered!' + obj);
  };

  function addHttpMethodsToPrototype(methods) {
    methods.forEach(function (method) {
      RESTClient.prototype[method] = function (config) {
        config.method = method;
        config.headers = getUtils(mainModule).extend(this.config.headers, config.headers);
        this.ajax(config);
      };
    });
  }

  addHttpMethodsToPrototype(['get', 'post', 'delete']);

  RESTClient.prototype.getConfig = function () {
    return this.config;
  };

  // export to the browser
  if ('undefined' !== typeofWindow && ATT) {
    ATT.RESTClient = RESTClient;
  }
  return RESTClient;
}(ATT));

if (typeof module === "object" && module && typeof module.exports === "object") {
  module.exports = RESTClient;
}
