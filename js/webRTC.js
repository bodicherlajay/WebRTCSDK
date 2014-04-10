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
            headers: {
              "Authorization": "Bearer " + accessToken,
              "x-e911Id": e911Id
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
          apiObject.createWebRTCSession(dataForCreateWebRTCSession);
        }
      },
      error: function (e) {
        console.log('Create session error : ', e);
      }
    };

    // Call DHS to authenticate, associate user to session.
    apiObject.authenticateUser(authenticateConfig);
  }

  function logoutAndDeleteWebRTCSession(config) {
    var logoutConfig = {
      success: function (response) {
        var data = response.getJson(),
          session = callManager.getSessionContext(),
          dataForDeleteWebRTCSession;

        // dirty fix for missing cookie session
        if (!session) {
          data = {
            type : 'error',
            error : 'Unable to retrieve web rtc session'
          };
          if (typeof config.success === 'function') {
            return config.success(data);
          }
          return;
        }

        dataForDeleteWebRTCSession = {
          apiParameters: {
            url: [session.getSessionId()]
          },

          headers: {
            "Authorization": "Bearer " + session.getAccessToken(),
            "x-e911Id": session.getE911Id()
          },

          success: function (responseObject) {
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
        apiObject.deleteWebRTCSession(dataForDeleteWebRTCSession);
      },
      error: function (e) {
        console.log('Delete session error : ', e);
      }
    };

    // Call DHS to logout user by deleting browser session.
    apiObject.logoutUser(logoutConfig);
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
  * Hangup the call
  */
  function hangup() {
    if (app.PeerConnectionService.peerConnection && callManager.getSessionContext().getCurrentCallId()) {
      console.log('Hanging up...');
      app.SignalingService.endCall();
      app.PeerConnectionService.endCall();
      app.UserMediaService.endCall();
    }
  }

  // sub-namespaces on ATT.
  app.RESTClient = RESTClient;

  // The SDK public API.
  // Authenticates and creates WebRTC session
  apiObject.login = loginAndCreateWebRTCSession;
  // Authenticates and creates WebRTC session
  apiObject.logout = logoutAndDeleteWebRTCSession;
  // stop user media
  apiObject.stopUserMedia = stopUserMedia;
  // Create call
  apiObject.dial = dial;
  // Answer call
  apiObject.answer = answer;
  // Hangup
  apiObject.hangup = hangup;
}(ATT || {}));