/**
	The WebRTC SDK.
	API Method namespace is set on the apiNamespace variable.
	
*/

var ATT = ATT || {};

(function (app) {
    "use strict";
	// api operations namespace: (app.WebRTCAPI)
	var apiNamespace = 'WebRTCAPI',
		apiObject = app[apiNamespace] = {};

	function init(config) {
		var localConfig = config || {apiConfigs: app.APIConfigs};
		apiObject = app[apiNamespace] = {};

		// add methods from config
		if (Object.keys(localConfig.apiConfigs).length > 0) {
            addOperations(localConfig.apiConfigs);
        }
	}

	// Add all API operations from config.
	function addOperations(methodConfigs) {
		for (var methodName in methodConfigs) {
            if (methodConfigs.hasOwnProperty(methodName)) {
                var o = {};
                o[methodName] = methodConfigs[methodName];
                addOperation(o);
            }
		}	
	}

	// Add an API method to the ATT namespace
	function addOperation(apiMethodConfig) {
		var methodName = Object.keys(apiMethodConfig)[0],
			methodDescription = apiMethodConfig[methodName];

		// Add API operation to the ATT namespace.
		apiObject[methodName] = getConfiguredRESTMethod(methodDescription);
	}

	function getConfiguredRESTMethod(methodConfig) {

		return function (data, success, error) {
			methodConfig.success = success;
			methodConfig.error = error;
			methodConfig.data = data;
			var restClient = new RESTClient(methodConfig);

			// call the RESTClient
            return restClient[methodConfig.method](methodConfig);
		};
	}

	var utils = {
		/**
			Check if browser has WebRTC capability.
		*/

		hasWebRTC: function () {
			return typeof navigator.mozGetUserMedia === 'function' ||
                typeof navigator.webkitGetUserMedia === 'function' ||
                typeof navigator.getUserMedia === 'function';
		}
	};

	// exposed methods/object
	app.utils = utils;
	app.init = init;
	app.RESTClient = RESTClient;
}(ATT || {}));