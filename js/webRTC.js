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
        var data = responseObject.getJson(),
          successCallback = config.callbacks.onSessionReady, // success callback for UI
          e911Id = data.e911,
          accessToken = data.accesstoken ? data.accesstoken.access_token : null,
          event,
          eventObject,

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
                    responseObject.getResponseHeader('location').split('/')[4] : null,
                sessionConfig = {
                  accessToken : accessToken,
                  e911Id : e911Id,
                  sessionId : sessionId,
                  callbacks : config.callbacks
                };

              // Set WebRTC.Session data object that will be needed downstream.
              callManager.CreateSession(sessionConfig);

              if (successCallback) {
                // setting web rtc session id for displaying on UI only
                data.webRtcSessionId = sessionId;

                event = {
                  type : app.CallStatus.READY
                };

                event.data = data;
                successCallback(event);
              }

              if (sessionId) {
                // setting up event callbacks using RTC Events
                app.RTCEvent.getInstance().setupEventCallbacks(config);
                /**
                 * Call BF to create event channel
                 * @param {Boolean} true/false Use Long Polling?
                 */
                apiObject.eventChannel(true, sessionId);

                // mock incoming call event
                eventObject = {
                  "from" : "sip:14250000009@icmn.api.att.net",
                  "resourceURL" : "/RTC/v1/sessions/f54fe437-ce15-4b7d-a4db-c1057c9cd75f/calls/90e9c3e8-cc37-4327-8583-a0cf70480c44/mod/12345",
                  "state" : "invitation-received",
                  "reason" : "success",
                  "type" : "calls"
                };

                setTimeout(function () {
                  app.event.publish(cmgmt.CallManager.getInstance().getSessionContext().getSessionId() + '.responseEvent', eventObject);
                }, 5000);

              }
            },
            error: function (e) {
              console.log('CREATE SESSION ERROR', e);
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
      error: function (e) {
        console.log('CREATE SESSION ERROR', e);
      }
    };

    // Call DHS to authenticate, associate user to session.
    apiObject.authenticate(authenticateConfig);
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
   * @param success Success callback. Event object will be passed to this.
   */
  function dial(config) {
    cmgmt.CallManager.getInstance().CreateOutgoingCall(config);

    // setting up event callbacks using RTC Events
    app.RTCEvent.getInstance().setupEventCallbacks(config);
  }

  /**
  * Hangup the call
  */
  function hangup() {
    if (app.PeerConnectionService.peerConnection) {
      console.log('Hanging up...');
      app.PeerConnectionService.peerConnection.close();
      app.PeerConnectionService.peerConnection = null;
      if (app.UserMediaService.localStream) {
        app.UserMediaService.localStream.stop();
      }
      if (app.UserMediaService.remoteStream) {
        app.UserMediaService.remoteStream.stop();
      }
      //remotePeerConnection = null ?
      //remotePeerConnection.close() ?
      app.UserMediaService.remoteVideoElement.src = null;
      app.UserMediaService.localVideoElement.src = null;

      var config = {
        apiParameters: {
          url: [apiObject.Session.Id, apiObject.Calls.Id]
        },
        headers: {
          'Authorization': 'Bearer ' + cmgmt.CallManager.getInstance().getSessionContext().getAccessToken()
        },
        success: function (response) {
          if (response.getResponseStatus === 204) {
            console.log('Call termination request success.');
          } else {
            console.log();
          }
        },
        error: function () {
          console.log();
        },
        ontimeout: function () {
          console.log();
        }
      };
      // HTTP request to terminate call
      apiObject.endCall(config);
    }
  }

  // sub-namespaces on ATT.
  app.RESTClient = RESTClient;

  // The SDK public API.
  // Authenticates and creates WebRTC session
  apiObject.login = loginAndCreateWebRTCSession;
  // stop user media
  apiObject.stopUserMedia = stopUserMedia;
  // Create call
  apiObject.dial = dial;
  // Hangup
  apiObject.hangup = hangup;
}(ATT || {}));