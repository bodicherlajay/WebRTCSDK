/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env */
/**
 *  The WebRTC SDK. 
 */

if (!ATT) {
  var ATT = {};
}

if (!Env) {
  var Env = {};
}

(function (app) {
  "use strict";

  var apiObject,
    utils,
    resourceManager = Env.resourceManager.getInstance();

  // configure the resource manager (add api methods to ATT namespace)
  resourceManager.configure();

  apiObject = resourceManager.getAPIObject();

  // Set the session id, access token, event channel name to subscribe to for events.
  function setWebRTCSessionData(data) {
    apiObject.Session = {
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
          event,

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
                event = {
                  type : 'READY'
                };

                event.data = data;
                successCallback(event);
              }

              if (sessionId) {
                // setting up event callbacks using RTC Events
                ATT.RTCEvent.getInstance().setupEventCallbacks(config);
                /**
                 * Call BF to create event channel
                 * @param {Boolean} true/false Use Long Polling?
                 * @returns Event Channel
                 **/
                apiObject.eventChannel(false);
              }
            },
            error: function () {
            }
          };

        // if no access token return user data to UI, without webrtc session id
        if (!accessToken) {
          event = {
            type : 'READY'
          };

          event.data = data;
          return successCallback(event);
        }

        // Call BF to create WebRTC Session.
        apiObject.createWebRTCSession(dataForCreateWebRTCSession);
      },
      error: function () {
      }
    };

    // Call DHS to authenticate, associate user to session.
    apiObject.authenticate(authenticateConfig);
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
    },

    deepExtend: function (destination, source) {
      var property;
      for (property in source) {
        // if the source has `property` as a `direct property`
        if (source.hasOwnProperty(property)) {
          // if that property is NOT an `Object`
          if (!(source[property] instanceof Object)) {
            // copy the value into the destination object
            destination[property] = source[property];
          } else {// `property` IS an `Object`
            // copy `property` recursively
            destination[property] = this.deepExtend(source[property]);
          }
        }
      }
      return destination;
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
  function dial(config) {

    // setting up event callbacks using RTC Events
    apiObject.RTCEvent.getInstance().setupEventCallbacks(config);

    ATT.UserMediaService.startCall(config);
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
          'Authorization': 'Bearer ' + apiObject.Session.accessToken,
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
    apiObject.endCall(config);
  }

  // sub-namespaces on ATT.
  app.utils = utils;
  app.RESTClient = RESTClient;

  // The SDK public API.
  // Authenticates and creates WebRTC session
  apiObject.login = loginAndCreateWebRTCSession;
  // Create call
  apiObject.dial = dial;
  // Hangup
  apiObject.hangup = hangup;
}(ATT || {}));