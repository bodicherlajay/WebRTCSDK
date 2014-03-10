var RestClient = (function () {
  
  function RestClient (config) {
    if (typeof config !== 'object') config = {};
    
    // default ajax configuration
  // config.type =         config.type || 'get';
  //  config.async =        config.async || true;
  //   config.headers =      config.headers || [];
  //   config.params =       config.params || [];
  //   config.contentType =  config.contentType || 'application/x-www-form-urlencoded; charset=UTF-8';
  //   config.dataType =     config.dataType || 'json';
  //   config.timeout =      config.timeout || 10000;
  //   config.success =      config.success || function () {};     
  //   config.error =        config.error || function () {};
  }
  
  // private methods

  function success (successCallback) {
    successCallback.call(this, JSON.parse(this.responseText));
  }

  function error (errorCallback) {
    errorCallback.call(this, JSON.parse(this.responseText));
  }
  
  // public methods
  RestClient.prototype.ajax = function (config) {
    var xhr =  new XMLHttpRequest(),
        data = config.data && JSON.stringify(config.data);

      // success callback
      xhr.onload = success.bind(xhr, config.success);

      // error callback
      xhr.onerror = error.bind(xhr, config.error);

      // open connection
      xhr.open(config.method, config.url, config.async);
 
      // optional headers from config
       if (Array.isArray(config.headers)) {
        config.headers.forEach(function (header) {
          var key = Object.keys(header)[0];
          xhr.setRequestHeader(key, header[key]);
        });
       }
      xhr.send(data);   
  };
    
  RestClient.prototype.get = function (config) {
    config.method = 'get';
    this.ajax(config);
  };

  RestClient.prototype.post = function (config) {
    config.method = 'post';
    if(!config.headers) {
      config.headers = [{'Content-Type': 'application/json'}];
    }
    this.ajax(config);
  };

  return RestClient;
})();