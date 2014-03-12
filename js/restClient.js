var RESTClient = (function () {

  function RESTClient (config) {
    config = config || {};
    
    // default ajax configuration
    config.async =        config.async || true;
    config.timeout =      config.timeout || 10000;
    config.success =      config.success || function () {};     
    config.error =        config.error || function () {};
  }
  
  // private methods

  function success (successCallback) {
    successCallback.call(this, JSON.parse(this.responseText));
  }

  function error (errorCallback) {
    errorCallback.call(this, this.responseText);
  }
  
  // public methods
  RESTClient.prototype.ajax = function (config) {

    config.headers = config.headers || {};
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';

    var xhr =  new XMLHttpRequest(),
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
    
  RESTClient.prototype.get = function (config) {
    config.method = 'get';
    this.ajax(config);
  };

  RESTClient.prototype.post = function (config) {
    config.method = 'post';
    this.ajax(config);
  };

  RESTClient.prototype.delete = function (config) {
    config.method = 'delete';
    this.ajax(config);
  };

  return RESTClient;
})();