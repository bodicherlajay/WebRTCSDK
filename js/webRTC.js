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

  var resourceManager = Env.resourceManager.getInstance(),
    apiObject = resourceManager.getAPIObject(),
    callManager = cmgmt.CallManager.getInstance(),
    initSession,
    createWebRTCSessionSuccess,
    createWebRTCSessionError;

  /**
   * Initialize the SDK with Oauth accessToken and e911Id
   * @param {String} accessToken
   * @param {String} e911Id
   */
  initSession = function (accessToken, e911Id, successCb) {
    // Set the access Token in the callManager.
    callManager.CreateSession({
      token: accessToken,
      e911Id: e911Id
    });

    if (typeof successCb === 'function') {
      successCb();
    }
  };

  function checkBrowserSession(config) {
    var sessionConfig = {
      success: function (response) {
        var data = response.getJson(),
          session = callManager.getSessionContext();

        if (session) {
          data.webRtcSessionId = session.getSessionId();
        }

        if (typeof config.success === 'function') {
          config.success(data);
        }
      }
    };

    // Call DHS to check for a browser session.
    resourceManager.doOperation('checkDhsSession', sessionConfig);
  }

  /**
   * SDK login will just create the webRTC session.  It requires
   * both the e911id and the oauth access token set in the call manager.
   * @memberof WebRTC
   * @param {Object} data The required login form data from the UI.
   */
  function login() {
    var accessToken = callManager.getContext().getAccessToken(),
      e911id = callManager.getContext().getE911Id();

    if (!accessToken || !e911id) {
      throw new Error('Access token and e911id are required.');
    }

    // Call BF to create WebRTC Session.
    resourceManager.doOperation('createWebRTCSession', {
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
          'x-e911Id': e911id
        }
      },
      success: createWebRTCSessionSuccess,
      error: createWebRTCSessionError
    });
  }

  createWebRTCSessionSuccess = function (responseObject) {
    var sessionId = responseObject && responseObject.getResponseHeader('location') ?
        responseObject.getResponseHeader('location').split('/')[4] : null;

    if (sessionId) {

      // Set WebRTC.Session data object that will be needed downstream.
      // Also setup UI callbacks
      callManager.getContext().setSessionId(sessionId);

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
        //authenticateResponseData.webRtcSessionId = sessionId;

        // publish the UI callback for ready state
        app.event.publish(sessionId + '.responseEvent', {
          state:  app.SessionEvents.RTC_SESSION_CREATED,
          //data:   authenticateResponseData
          data:   {
            webRtcSessionId: sessionId
          }
        });
      });
    } else { // if no session id, call the UI error callback
      throw new Error('No session id');
//      if (typeof config.error === 'function') {
//        config.error(authenticateResponseData);
//      }
    }
  };

  createWebRTCSessionError = function () {
    console.log('createWebRTCSessionError');
  };


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
          params: {
            url: [session.getSessionId()],
            headers: {
              "Authorization": session.getAccessToken(),
              "x-e911Id": session.getE911Id()
            }
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
        resourceManager.doOperation('deleteWebRTCSession', dataForDeleteWebRTCSession);
      },
      error: function (e) {
        console.log('Delete session error : ', e);
      }
    };

    // Call DHS to logout user by deleting browser session.
    resourceManager.doOperation('logoutUser', logoutConfig);
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
  resourceManager.addPublicMethod('session', checkBrowserSession);
  resourceManager.addPublicMethod('login', login);
  resourceManager.addPublicMethod('logout', logoutAndDeleteWebRTCSession);
  resourceManager.addPublicMethod('stopUserMedia', stopUserMedia);
  resourceManager.addPublicMethod('dial', dial);
  resourceManager.addPublicMethod('answer', answer);
  resourceManager.addPublicMethod('hold', hold);
  resourceManager.addPublicMethod('resume', resume);
  resourceManager.addPublicMethod('hangup', hangup);
  resourceManager.addPublicMethod('initSession', initSession);
}(ATT || {}));