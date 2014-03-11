var RestClient = (function () {
  
  function RestClient (config) {
    if (typeof config !== 'object') config = {};
    
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
    //errorCallback.call(this, JSON.parse(this.responseText));
    errorCallback.call(this, this.responseText);
  }
  
  // public methods
  RestClient.prototype.ajax = function (config) {
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
    
  RestClient.prototype.get = function (config) {
    config.method = 'get';
    this.ajax(config);
  };

  RestClient.prototype.post = function (config) {
    config.method = 'post';
    var contentType = 'application/json;charset=utf-8';
    config.headers = config.headers || {};  
    config.headers['Content-Type'] = contentType;
    this.ajax(config);
  };
  return RestClient;
})();