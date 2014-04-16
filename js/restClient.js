/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true*/
/**
 * Abstraction of the XMLHttpRequest used in the SDK and DHS.
 * Todo:  Add 'exports' handling so this can be used a node module (see underscore.js).
 */

var RESTClient = (function () {
  "use strict";
  var defaultErrorHandler,
    errorHandler,
    RESTClient =  function (config) {
      this.config =  ATT.utils.extend({}, config);
        // default ajax configuration
      this.config.async = this.config.async || true;
      this.config.timeout = this.config.timeout || 10000;
      this.config.success = this.config.success || function () {};
      this.config.error = this.config.error || defaultErrorHandler;
      this.config.ontimeout = this.config.ontimeout || function () {};
      this.config.headers = this.config.headers || {};
      this.config.headers['Content-Type'] = this.config.headers['Content-Type'] || 'application/json';
      this.config.headers.Accept = this.config.headers.Accept || 'application/json';
    },
    error = function (errorCallback) {
      errorCallback.call(this, this.responseText);
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
          getResponseStatus: function () {
            return xhr.status;
          }
        },
        responseCopy = ATT.utils.extend({}, responseObject);

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

    // timeout
    xhr.timeout = config.timeout;

    // success callback
    xhr.onload = success.bind(xhr, config.success);

    // set up passed in error handler to be called if xhr status is in error.
    errorHandler = config.error;

    // error callback
    xhr.onerror = function () {
      throw new Error('Network error occurred in REST client.');
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

    xhr.send(data);
  };

  /**
   * Default ajax error handler.
   */
  defaultErrorHandler = function (obj) {
    console.log(obj);
    //throw new Error('RESTClient error handler triggered!');
  };

  function addHttpMethodsToPrototype(methods) {
    methods.forEach(function (method) {
      RESTClient.prototype[method] = function (config) {
        config.method = method;
        config.headers = ATT.utils.extend(this.config.headers, config.headers);
        this.ajax(config);
      };
    });
  }

  addHttpMethodsToPrototype(['get', 'post', 'delete']);

  RESTClient.prototype.getConfig = function () {
    return this.config;
  };
  return RESTClient;
}());
