/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient */
/**
 *  The WebRTC SDK.
 *  API Method namespace is set on the apiNamespace variable.
 *  @namespace WebRTC
 */

if (!ATT) {
  var ATT = {};
}

(function (app) {
  "use strict";
  // api operations namespace:
  var apiNamespace = 'WebRTC',
    apiObject,
    utils;

  app[apiNamespace] = {};
  apiObject = app[apiNamespace];

  /**
   * Returns function that will call configured REST method.
   * @param {Object} apiMethodConfig API method config object.
   * @returns {Function}
   */
  function getConfiguredRESTMethod(apiMethodConfig) {

    var methodConfig = apiMethodConfig.methodDescription,
      methodName = apiMethodConfig.methodName;

    // runtime call
    return function (config) {

      var configKey,
        restClient;

      // override any ajax configuration with passed in config object
      // data, success, error
      for (configKey in config) {
        if (config.hasOwnProperty(configKey)) {
          methodConfig[configKey] = config[configKey];
        }
      }

      // url formatter.  urlParams should be set on method config so pass in.
      if (typeof methodConfig.urlFormatter === 'function') {
        methodConfig.url = methodConfig.urlFormatter(methodConfig.urlParams);
      }

      restClient = new RESTClient(methodConfig);

      // attach the restclient to the method (to expose actual rest client for unit testability).
      // probably a better way to do this..drawing a blank at the moment.
      apiObject[methodName].restClient = restClient;

      // make request
      restClient.ajax();
    };
  }

  /**
   * Add an API method to the ATT namespace
   * @param {Object} apiMethodConfig The config for each method
   */
  function addOperation(apiMethodConfig) {
    var methodName = Object.keys(apiMethodConfig)[0],
      methodDescription = apiMethodConfig[methodName];

    // Add API operation to the ATT namespace.
    apiObject[methodName] = getConfiguredRESTMethod({
      methodName: methodName,
      methodDescription: methodDescription
    });
  }

  /**
   * Add all API operations from config.
   * @param {Object} methodConfigs The config for each method
   */
  function addOperations(methodConfigs) {
    var methodName,
      o;
    for (methodName in methodConfigs) {
      if (methodConfigs.hasOwnProperty(methodName)) {
        o = {};
        o[methodName] = methodConfigs[methodName];
        addOperation(o);
      }
    }
  }

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

  // Set the session id, access token, event channel name to subscribe to for events.
  function setWebRTCSessionData(data) {
    ATT.WebRTC.Session = {
      Id: data.sessionId,
      accessToken: data.accessToken,
      webRTCChannel: data.sessionId + '.responseEvent' // This is what UI will be subscribing to.
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

  function loginAndCreateWebRTCSession(config) {

    var authenticateConfig = {
      data: config.data,
      success: function (responseObject) {
        // get access token, e911 id that is needed to create webrtc session
        var data = responseObject.getJson(),
          successCallback = config.success, // success callback for UI
          e911Id = data.e911,
          accessToken = data.accesstoken ? data.accesstoken.access_token : null,

          dataForCreateWebRTCSession = {
            data: {     // Todo: this needs to be configurable in SDK, not hardcoded.
              "session": {
                "mediaType": "dtls-srtp",
                "ice": "true",
                "services": [
                  "ip_voice_call",
                  "ip_video_call"
                ]
              }
            },
            headers: {
              "Authorization": "Bearer " + accessToken,
              "x-e911Id": e911Id
            },

            success: function (responseObject) {
              var sessionId = responseObject && responseObject.getResponseHeader('location') ?
                  responseObject.getResponseHeader('location').split('/')[4] : null;

              // Set WebRTC.Session data object that will be needed downstream.
              setWebRTCSessionData({
                sessionId: sessionId,
                accessToken: accessToken
              });

              data.webRtcSessionId = sessionId;

              if (successCallback) {
                var event = {
                  type : 'READY'
                };
              
                event.data = data;
                successCallback(event);
              }
              // ATT.event.subscribe (sessionId + '.responseEvent', function (event) {
                // if (successCallback) {
                  // event.data = data;
                  // successCallback(event);
                // }
              // });

              if (sessionId) {
                /**
                 * Call BF to create event channel
                 * @param {Boolean} true/false Use Long Polling?
                 * @returns Event Channel
                 **/
                ATT.WebRTC.eventChannel(false);
              }
            },
            error: function () {
            }
          };

        // if no access token return user data to UI, without webrtc session id
        if (!accessToken) {
          return successCallback(data);
        }

        // Call BF to create WebRTC Session.
        ATT[apiNamespace].createWebRTCSession(dataForCreateWebRTCSession);
      },
      error: function () {
      }
    };

    // Call DHS to authenticate, associate user to session.
    ATT[apiNamespace].authenticate(authenticateConfig);
  }

  utils = {

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

  /**
   *
   * @param {Object} config Dial configuration object.
   * @attribute {String} phoneNumber
   * @attribute {HTMLElement} localVideo
   * @attribute {HTMLElement} remoteVideo
   * @attribute {Object} mediaConstraints
   * @param success Success callback. Event object will be passed to this.
   */
  function dial(config, success) {
    ATT.UserMediaService.startCall(config);

    // Subscribe to event and call success callback.
    ATT.event.subscribe (ATT.WebRTC.Session.Id + '.responseEvent', function (event) {
      if (success) {
        success(event);
      }
    });
  }

  /**
  * Hangup the call
  * Calls ATT.WebRTC.endCall -> BF
  */
  function hangup() {
    var sessionId = '1234',
      callId = '1111',
      config = {
      urlParams: [sessionId, callId],
      headers: {
        'Authorization': 'Bearer ' + app.WebRTC.Session.accessToken,
        'x-delete-reason': 'terminate'
      },
      success: function (response) {
        if (response.getResponseStatus === 204) {
          ATT.PeerConnection.end();
          ATT.UserMediaService.endCall();
        } else {
          console.log('Call termination request failed.', response.responseText);
        }
      },
      error: function (e) {
        console.log('ERROR', e);
      }
    };
    ATT[apiNamespace].endCall(config);
  }

  // sub-namespaces on ATT.
  app.utils = utils;
  app.init = init;
  app.RESTClient = RESTClient;

  // The SDK public API.
  // Exposed methods.

  // Authenticates and creates WebRTC session
  apiObject.login = loginAndCreateWebRTCSession;
  // Create call
  apiObject.dial = dial;
  // Hangup
  apiObject.hangup = hangup;
}(ATT || {}));