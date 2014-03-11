'use strict'
var ATT = {};

(function (ATT) {

	// api operations namespace: (ATT.WebRTCAPI)
	var apiNamespace = 'WebRTCAPI',
		apiObject = ATT[apiNamespace] = {};

	function init(config) {
		// Remove all API operations
		clearAPI();

		// add methods from config
		config && config.apiConfigs && addOperations(config.apiConfigs);
	}

	// Remove all API operations from ATT namespace.
	function clearAPI() {
		apiObject = ATT[apiNamespace] = {};
	}

	// Add all API operations from config.
	function addOperations(methodConfigs) {
		for (var methodName in methodConfigs) {
			var o = {};
			o[methodName] = methodConfigs[methodName];
			addOperation(o);
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
			return typeof (navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.getUserMedia) === 'function';
		}
	};

	// exposed methods/object
	ATT.utils = utils;
	ATT.RESTClient = RESTClient;
	ATT.init = init;
}(ATT || {}))