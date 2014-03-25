/**
  *  The WebRTC SDK.
  *  API Method namespace is set on the apiNamespace variable.
  *  @namespace WebRTC
  */

var ATT = ATT || {};

(function (app) {
    "use strict";
    // api operations namespace: (app.WebRTCAPI)
    var apiNamespace = 'WebRTC',
        apiObject = app[apiNamespace] = {};

    /**
     * Method to initialize the ATT namespace with API methods defined in APIConfigs.js.
     * @memberof WebRTC
     * @param config
     */
    function init(config) {
        var localConfig = config || {apiConfigs: app.APIConfigs};

        // add methods from config
        if (Object.keys(localConfig.apiConfigs).length > 0) {
            addOperations(localConfig.apiConfigs);
        }
    }

    /**
    * Add all API operations from config.
    * @param {Object} methodConfigs The config for each method
    */
    function addOperations(methodConfigs) {
        for (var methodName in methodConfigs) {
            if (methodConfigs.hasOwnProperty(methodName)) {
                var o = {};
                o[methodName] = methodConfigs[methodName];
                addOperation(o);
            }
        }
    }

    /**
    * Add an API method to the ATT namespace
    * @param {Object} apiMethodConfig The config for each method
    */
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
        
        // runtime call
        return function (config) {
            
            // override any ajax configuration with passed in config object
            // data, success, error
            var configKey;
            for (configKey in config) {
                if (config.hasOwnProperty(configKey)) {
                    methodConfig[configKey] = config[configKey];
                }
            }
            
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
     * @memberof WebRTC
     * @param {Object} data The required login form data from the UI.
     */
    function loginAndCreateWebRTCSession (data) {
        
        var authenticateConfig = {
            data: data,
            success: function (responseObject) {
                // get access token, e911 id that is needed to create webrtc session
                var data = responseObject.getJson(),
                    e911Id = "f81d4fae-7dec-11d0-a765-00a0c91e6bf", // comes from authenticate?

                    dataForCreateWebRTCSession = {
                        data: {     // Todo: this needs to be configurable in SDK, not hardcoded.
                            "session": {
                                "mediaType": "rtp",
                                "services": [
                                    "ip_voice_call",
                                    "ip_video_call"
                                ]
                            }
                        },
                        headers: {
                            "Authorization": "Bearer " + data.access_token.access_token, 
                            "x-e911Id": e911Id
                        },
                        success: function (responseObject) {
                            var sessionId = responseObject.getResponseHeader('location').split('/')[4];     
                            ATT.WebRTC.Session = {
                                Id: sessionId,
                                accessToken: data.access_token.access_token
                            }
                            // call BF to create event channel
                        },
                        error: function () {}
                    };

                // Call BF to create WebRTC Session.
                ATT[apiNamespace].createWebRTCSession(dataForCreateWebRTCSession);
            },
            error: function () {}
        };
        
        // Call DHS to authenticate, associate user to session.
        ATT[apiNamespace].authenticate(authenticateConfig);
    }

    var utils = {
        
        /**
        * Check if browser has WebRTC capability.
        * @return {Boolean} 
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