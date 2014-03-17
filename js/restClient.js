
var RESTClient = (function() {
    "use strict";

    function RESTClient(config) {
        this.config =  deepExtend({}, config);
        // default ajax configuration
        this.config.async = this.config.async || true;
        this.config.timeout = this.config.timeout || 10000;
        this.config.success = this.config.success || function() {};
        this.config.error = this.config.error || function() {};
        this.config.headers = this.config.headers || {};
        this.config.headers['Content-Type'] = this.config.headers['Content-Type'] || 'application/json';
    }

    // private methods
    function success(successCallback) {
        successCallback.call(this, JSON.parse(this.responseText));
    }

    function error(errorCallback) {
        errorCallback.call(this, this.responseText);
    }

    // public methods
    RESTClient.prototype.ajax = function(config) {
        var xhr = new XMLHttpRequest(),
            data = config.data && JSON.stringify(config.data);

        xhr.timeout = config.timeout;

        // success callback
        xhr.onload = success.bind(xhr, config.success);

        // error callback
        xhr.onerror = error.bind(xhr, config.error);

        // open connection
        xhr.open(config.method, config.url, config.async);

        // optional headers from config
        for (var key in config.headers) {
            if (config.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, config.headers[key]);
            }
        }

        xhr.send(data);
    };

    function addHttpMethodsToPrototype(methods) {
        methods.forEach(function (method) {
            RESTClient.prototype[method] = function(config) {
                config.method = method;
                config.headers = deepExtend(this.config.headers, config.headers);
                this.ajax(config);
            };
        });
    }

    addHttpMethodsToPrototype(['get', 'post', 'delete']);

    function deepExtend (destination, source) {
      for (var property in source) {
        if (source[property] && source[property].constructor &&
         source[property].constructor === Object) {
          destination[property] = destination[property] || {};
          deepExtend(destination[property], source[property]);
        } else {
          destination[property] = source[property];
        }
      }
      return destination;
    }

    RESTClient.prototype.getConfig = function() {
        return this.config;
    };
    return RESTClient;
})();