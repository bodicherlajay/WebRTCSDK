/**
	The WebRTC SDK.
	API Method namespace is set on the apiNamespace variable.

*/

var ATT = ATT || {};

(function (app) {
    "use strict";
	// api operations namespace: (app.WebRTCAPI)
	var apiNamespace = 'WebRTC',
		apiObject = app[apiNamespace] = {};

    /**
     * Method to initialize the ATT namespace with API methods defined in APIConfigs.js.
     * @param config
     */
	function init(config) {
		var localConfig = config || {apiConfigs: app.APIConfigs};

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

    /**
     * Returns function that will call configured REST method.
     * @param {Object} methodConfig XHR configuration object, e.g. object at APIConfigs['login'].
     * @returns {Function}
     */
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
    
    /**
     * This method will be hit by the login button on the sample app.
     * Hits authenticate, then createWebRTCSession.  Simply logs the location header
     * if successfully creates a webrtc session.
     * 
     * Todo:  Handle error conditions!
     * 
     * @param {Object} data The required login form data from the UI.
     */
    function loginAndCreateWebRTCSession (data) {
        
        // Call DHS to authenticate, associate user to session.
        ATT[apiNamespace].authenticate(data, function (responseObject){
            
            // get access token, e911 id that is needed to create webrtc session
            var data = responseObject.getJson(),
                e911Id = "f81d4fae-7dec-11d0-a765-00a0c91e6bf", // comes from authenticate?
                
                dataForCreateWebRTCSession = {
                    data: {     // Todo: this needs to be configurable in SDK, not hardcoded.
                        "session" : {
                            "mediaType":"rtp",
                            "services": [
                                "ip_voice_call",
                                "ip_video_call"
                            ]
                        }
                    },
                    headers: {
                        "Authorization": "Bearer " + data.access_token.access_token,    // check this.
                        "x-e911Id": e911Id
                    }
                };
            
            // Call BF to create WebRTC Session.
            ATT[apiNamespace].createWebRTCSession(dataForCreateWebRTCSession, function (responseObject) {
                console.log(responseObject.getResponseHeader('location'));
            }, function () {});
            
        }, function (){});
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
    apiObject.loginAndCreateWebRTCSession = loginAndCreateWebRTCSession;
}(ATT || {}));