/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true*/
/**
 * Abstraction of the XMLHttpRequest used in the SDK and DHS.
 * Todo:  Add 'exports' handling so this can be used a node module (see underscore.js).
 */

var RESTClient = (function () {
  'use strict';

  function parse_headers(input){
    var result=[];
    var headers_list=input.split('\n');
    for(var index in headers_list){
      var line=headers_list[index], k, v;
      k = line.split(':')[0];
      v = line.split(':').slice(1).join(':').trim();
      if(k.length>0){
        result[k]=v;
      }
    }
    return result;
  }
  //print response details for success
  function show_response(r){
    console.log('---------Response--------------');
    console.log(r.getResponseStatus()+' '+ r.responseText);
    console.log('=========headers=======');
    console.log(r.headers);
    var ph = parse_headers(r.headers);
    if (ph['Location']) {
      console.log("Location: " + ph['Location']);
    }
    console.log('=========body==========');
    console.log(r.responseText);
  }

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
          headers: xhr.getAllResponseHeaders(),
          location: xhr.getResponseHeader('Location'),
          statusText: xhr.statusText,
          getResponseStatus: function () {
            return xhr.status;
          }
        },
        responseCopy = ATT.utils.extend({}, responseObject);
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
  //print request details
  function showRequest(method, url, headers, body) {
    var logMgr = ATT.logManager.getInstance(), logger, h = '', key, reqBody = JSON.stringify(body);
    //TODO this configuration need to move outside this function
    logMgr.configureLogger('RESTClient', logMgr.loggerType.CONSOLE, logMgr.logLevel.DEBUG);
    logger = logMgr.getLogger('RESTClient');
    logger.logDebug('---------Request---------------');
    logger.logDebug(method + ' ' + url + ' HTTP/1.1');

    for (key in headers) {
      if (headers.hasOwnProperty(key)) {
        h = h + key + ': ' + headers[key] + '\n';
      }
    }
    h = h.substring(0, h.length - 1);
    if (body === 'undefined') {
      logger.logDebug(h);
    }
    else {
      if (typeof reqBody === 'undefined') {
        reqBody = '';
      }
      logger.logDebug(h + '\n' + reqBody);
    }
  }

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
    showRequest(config.method, config.url, config.headers, data);
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