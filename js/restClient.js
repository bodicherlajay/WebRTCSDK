/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */

var RESTClient = (function () {
  "use strict";

  /**
   * Extends an existing object using deep copy.
   * Note: It will only deep-copy instances of Object. 
   * Todo: Move this to a util submodule once we figure out where this type of functionality should live.
   * @param destination
   * @param source
   * @returns {*} destination
   */
  function deepExtend(destination, source) {
    var property;
    for (property in source) {
      // if the source has `property` as a `direct property`
      if (source.hasOwnProperty(property)) {
        // if that property is NOT an `Object`
        if (!(source[property] instanceof Object)) {
          // copy the value into the destination object
          destination[property] = source[property];
        } else { // `property` IS an `Object`
          // copy `property` recursively
          destination[property] = deepExtend(source[property]);
        }
      }
    }
    return destination;
  }

  function RESTClient(config) {
    this.config =  deepExtend({}, config);
      // default ajax configuration
    this.config.async = this.config.async || true;
    this.config.timeout = this.config.timeout || 10000;
    this.config.success = this.config.success || function () { return; };
    this.config.error = this.config.error || function () { return; };
    this.config.headers = this.config.headers || {};
    this.config.headers['Content-Type'] = this.config.headers['Content-Type'] || 'application/json';
  }

  // private methods
  function success(successCallback) {
    /*jshint validthis:true */
    var xhr = this,
      responseObject = {
        getJson: function () {
          return JSON.parse(xhr.responseText);
        },
        getResponseHeader: function (key) {
          return xhr.getResponseHeader(key);
        },
        responseText: xhr.responseText
      },
      responseCopy = deepExtend({}, responseObject);
    successCallback.call(xhr, responseCopy);
  }

  function error(errorCallback) {
    /*jshint validthis:true */
    errorCallback.call(this, this.responseText);
  }

  // public methods
  RESTClient.prototype.ajax = function (config) {
    var xhr = new XMLHttpRequest(),
      data = config.data && JSON.stringify(config.data),
      header;

    xhr.timeout = config.timeout;

    // success callback
    xhr.onload = success.bind(xhr, config.success);

    // error callback
    xhr.onerror = error.bind(xhr, config.error);

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

  function addHttpMethodsToPrototype(methods) {
    methods.forEach(function (method) {
      RESTClient.prototype[method] = function (config) {
        config.method = method;
        config.headers = deepExtend(this.config.headers, config.headers);
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