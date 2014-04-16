/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */
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
    resourceManager = Env.resourceManager.getInstance(),
    callManager = cmgmt.CallManager.getInstance();

  apiObject = resourceManager.getAPIObject();

  function registerUserOnDhs(config) {
    var registerConfig = {
      data: config.data,
      success: function (response) {
        if (typeof config.success === 'function') {
          config.success(response);
        }
      }
    };

    // Call DHS to check for a browser session.
    resourceManager.doOperation('registerUser', registerConfig);
  }

  /**
   * This method will be hit by the login button on the sample app.
   * Hits authenticate, then createWebRTCSession.
   *
   * Todo:  Handle error conditions
   * @memberof WebRTC
   * @param {Object} data The required login form data from the UI.
   */

  function loginAndCreateWebRTCSession(config) {

    var authenticateConfig = {
      data: config.data,
      success: function (responseObject) {
        // get access token, e911 id that is needed to create webrtc session
        var authenticateResponseData = responseObject.getJson(),
          accessToken = authenticateResponseData.accesstoken ? authenticateResponseData.accesstoken.access_token : null,
          e911Id = authenticateResponseData.e911,

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

            params: {
              headers: {
                'Authorization': accessToken,
                'x-e911Id': e911Id
              }
            },

            success: function (responseObject) {
              var sessionId = responseObject && responseObject.getResponseHeader('location') ?
                    responseObject.getResponseHeader('location').split('/')[4] : null;

              if (sessionId) {

                // Set WebRTC.Session data object that will be needed downstream.
                // Also setup UI callbacks
                callManager.CreateSession({
                  token : accessToken,
                  e911Id : e911Id,
                  sessionId : sessionId,
                  success : config.success
                });

                // setting up event callbacks using RTC Events
                app.RTCEvent.getInstance().hookupEventsToUICallbacks();

                /**
                 * Call BF to create event channel
                 * @param {Boolean} true/false Use Long Polling?
                 * todo: publish session ready event after event channel is created
                 * todo: move the login callback code to the publish
                 */
                apiObject.eventChannel(false, sessionId, function () {
                  // setting web rtc session id for displaying on UI only
                  authenticateResponseData.webRtcSessionId = sessionId;

                  // publish the UI callback for ready state
                  app.event.publish(sessionId + '.responseEvent', {
                    state : app.SessionEvents.RTC_SESSION_CREATED,
                    data : authenticateResponseData
                  });
                });
              } else { // if no session id, call the UI error callback
                if (typeof config.error === 'function') {
                  config.error(authenticateResponseData);
                }
              }
            },
            error: function (e) {
              console.log('CREATE SESSION ERROR', e);
            }
          };

        // if no access token return user data to UI, without webrtc session id
        if (!accessToken) {
          if (typeof config.error === 'function') {
            config.error(authenticateResponseData);
          }
        } else {
          // Call BF to create WebRTC Session.
          resourceManager.doOperation('createWebRTCSession', dataForCreateWebRTCSession);
        }
      },
      error: function (e) {
        console.log('Create session error : ', e);
      }
    };

    // Call DHS to authenticate, associate user to session.
    resourceManager.doOperation('authenticateUser', authenticateConfig);
  }

  function deleteWebRTCSession(config) {

    var session = callManager.getSessionContext(),
      dataForDeleteWebRTCSession = {
        params: {
          url: [session.getSessionId()],
          headers: {
            "Authorization": session.getAccessToken(),
            "x-e911Id": session.getE911Id()
          }
        },

        success: function (responseObject) {
          var data;
          if (responseObject.getResponseStatus() !== 200) {
            data = {
              type : 'error',
              error : 'Failed to delete the web rtc session on blackflag'
            };
          }

          if (typeof config.success === 'function') {
            config.success(data);
          }
        }
      };

    // Call BF to delete WebRTC Session.
    resourceManager.doOperation('deleteWebRTCSession', dataForDeleteWebRTCSession);
  }

  // Stop user media
  function stopUserMedia() {
    if (app.UserMediaService.localStream) {
      app.UserMediaService.localStream.stop();
      app.UserMediaService.localVideoElement.src = null;
    }
  }

  /**
   *
   * @param {Object} config Dial configuration object.
   * @attribute {String} phoneNumber
   * @attribute {HTMLElement} localVideo
   * @attribute {HTMLElement} remoteVideo
   * @attribute {Object} mediaConstraints
   * @attribute {Object} callbacks UI callbacks. Event object will be passed to these callbacks.
   */
  function dial(config) {
    callManager.CreateOutgoingCall(config);

    // setting up event callbacks using RTC Events
    app.RTCEvent.getInstance().hookupEventsToUICallbacks();
  }

  /**
   *
   * @param {Object} config answer configuration object.
   */
  function answer(config) {
    callManager.CreateIncomingCall(config);

    // setting up event callbacks using RTC Events
    app.RTCEvent.getInstance().hookupEventsToUICallbacks();
  }

  /**
  * Hold existing call
  */
  function hold() {
    callManager.getSessionContext().getCallObject().hold();
  }

  /**
  * Resume existing call
  */
  function resume() {
    callManager.getSessionContext().getCallObject().resume();
  }

  /**
  * Hangup existing call
  */
  function hangup() {
    callManager.getSessionContext().getCallObject().end();
  }

  // sub-namespaces on ATT.
  app.RESTClient = RESTClient;

  // The SDK public API.
  resourceManager.addPublicMethod('register', registerUserOnDhs);
  resourceManager.addPublicMethod('login', loginAndCreateWebRTCSession);
  resourceManager.addPublicMethod('logout', deleteWebRTCSession);
  resourceManager.addPublicMethod('stopUserMedia', stopUserMedia);
  resourceManager.addPublicMethod('dial', dial);
  resourceManager.addPublicMethod('answer', answer);
  resourceManager.addPublicMethod('hold', hold);
  resourceManager.addPublicMethod('resume', resume);
  resourceManager.addPublicMethod('hangup', hangup);
}(ATT || {}));