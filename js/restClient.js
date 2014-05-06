/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

/**
 * Abstraction of the XMLHttpRequest used in the SDK and DHS.
 */

var RESTClient = (function (mainModule) {
  'use strict';
  var typeofWindow = typeof window,
    typeofModule = typeof module,
    logger = null,
    defaultErrorHandler,
    errorHandler,
    logMgr = ATT.logManager.getInstance(),
    //Inject logger
    setLogger = function (lgr) {
      logger = lgr;
    },
    RESTClient =  function (config) {
      this.config =  mainModule.utils.extend({}, config);
        // default ajax configuration
      this.config.async = this.config.async || true;
      this.config.timeout = this.config.timeout || 10000;
      this.config.success = this.config.success || function () { return; };
      this.config.error = this.config.error || defaultErrorHandler;
      this.config.ontimeout = this.config.ontimeout || function () { return; };
      this.config.headers = this.config.headers || {};
      this.config.headers['Content-Type'] = this.config.headers['Content-Type'] || 'application/json';
      this.config.headers.Accept = this.config.headers.Accept || 'application/json';

      // set default logger
      logMgr.configureLogger('RESTClient', logMgr.loggerType.CONSOLE, logMgr.logLevel.DEBUG);
      logger = logMgr.getLogger('RESTClient');
    },
    error = function (errorCallback) {
      errorCallback.call(this, this.responseText);
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
      reqLogger.logDebug('=========body==========');
      if (reqBody !== undefined) {
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
      resLogger.logDebug(response.getResponseStatus() + ' ' + response.responseText);
      resLogger.logDebug('=========headers=======');
      resLogger.logDebug(response.headers);
      ph = parse_headers(response.headers);
      if (ph.Location !== 'undefined') {
        resLogger.logDebug("Location: " + ph.Location);
      }
      resLogger.logDebug('=========body==========');
      resLogger.logDebug(response.responseText);
    },
    success = function (successCallback) {
      // private methods
      var xhr = this,
        responseObject = {
          getJson: function () {
            return JSON.parse(xhr.responseText);
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
          }
        },
        responseCopy = mainModule.utils.extend({}, responseObject);
      show_response(responseCopy);
      if (xhr.status >= 400 && xhr.status <= 599) {
        if (typeof errorHandler === 'function') {
          errorHandler.call(xhr, responseCopy);
        } else {
          defaultErrorHandler.call(xhr, responseCopy);
        }
      } else {
        successCallback.call(xhr, responseCopy);
      }
    };


  // public methods
  RESTClient.prototype.ajax = function () {
    var config = this.config,
      xhr = new XMLHttpRequest(),
      data = config.data && JSON.stringify(config.data),
      header;
    if (!logger) {
      console.log("Using console logger for debugging");
      setLogger(null);
    }
    // timeout
    xhr.timeout = config.timeout;

    // success callback
    xhr.onload = success.bind(xhr, config.success);

    // set up passed in error handler to be called if xhr status is in error.
    errorHandler = config.error;

    // error callback
    xhr.onerror = function () {
      if (config.error !== 'undefined') {
        error.call(this, config.error);
      } else {
        throw new Error('Network error occurred in REST client.');
      }
    };

    // on timeout callback
    xhr.ontimeout = config.ontimeout;

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
        config.headers = mainModule.utils.extend(this.config.headers, config.headers);
        this.ajax(config);
      };
    });
  }

  addHttpMethodsToPrototype(['get', 'post', 'delete']);

  RESTClient.prototype.getConfig = function () {
    return this.config;
  };

    //exports for nodejs
  typeofModule = typeof module;
  if (typeofModule !== 'undefined' && module.exports) {
    module.exports = RESTClient;
  }

  // export to the browser
  if ('undefined' !== typeofWindow && ATT) {
    ATT.RESTClient = RESTClient;
  }
  return RESTClient;
}(ATT));