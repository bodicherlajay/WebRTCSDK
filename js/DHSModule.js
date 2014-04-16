/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */
/**
 *  The WebRTC DHS module.
 */

if (!ATT) {
  var ATT = {};
}

if (!Env) {
  var Env = {};
}

(function (app) {
  "use strict";

  var dhsNamespace = {},
    // apiObject,
    resourceManager = Env.resourceManager.getInstance(),
    callManager = cmgmt.CallManager.getInstance(),

    // private methods
    init,

    // public methods
    checkSession,

    login,

    logout,

    getE911Id,

    createE911Id,

    updateE911Id,

    registerUserOnDHS;

  init = function () {

    // create namespace.
    dhsNamespace = ATT.utils.createNamespace(app, 'rtc.dhs');

    //apiObject = resourceManager.getAPIObject();

    // sub-namespaces on ATT.
    app.RESTClient = RESTClient;

    dhsNamespace.checkSession = checkSession;
    dhsNamespace.login = login;
    dhsNamespace.logout = logout;
    dhsNamespace.getE911Id = getE911Id;
    dhsNamespace.registerUserOnDHS = registerUserOnDHS;
    dhsNamespace.createE911Id = createE911Id;
    dhsNamespace.updateE911Id = updateE911Id;

  };

  checkSession = function (config) {
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
      },
      error: function (response) {
        var data = response.getJson();

        if (typeof config.error === 'function') {
          config.error(data);
        }
      }
    };

    // Call DHS to check for a browser session.
    resourceManager.doOperation('checkDhsSession', sessionConfig);
  };

  // dirty fix for login
  login = function (config) {
    var authenticateConfig = {
      data: config.data,
      success: function (responseObject) {
        // get access token, e911 id that is needed to create webrtc session
        var authenticateResponseData = responseObject.getJson(),
          accessToken = authenticateResponseData.accesstoken ? authenticateResponseData.accesstoken.access_token : null,
          e911Id = authenticateResponseData.e911;

        // if no access token return user data to UI, without webrtc session id
        if (!accessToken) {
          if (typeof config.error === 'function') {
            config.error(authenticateResponseData);
          }
        } else {
          if (typeof config.success.onSessionReady === 'function') {
            config.success.onSessionReady({type: 0, data: authenticateResponseData});
          }
          // Call BF to create WebRTC Session.
        }
      },
      error: function (responseObject) {
        var authenticateResponseData = responseObject.getJson();
        if (typeof config.error === 'function') {
          config.error(authenticateResponseData);
        }
      }
    };

    // Call DHS to authenticate, associate user to session.
    resourceManager.doOperation('authenticateUser', authenticateConfig);
  };

  logout = function (config) {

    var logoutConfig = {
      success: function (response) {
        var data = response.getJson();
        if (typeof config.success === 'function') {
          config.success(data);
        }
      },
      error: function (response) {
        var data = response.getJson();
        if (typeof config.error === 'function') {
          config.error(data);
        }
      }
    };

    // Call DHS to logout user by deleting browser session.
    resourceManager.doOperation('logoutUser', logoutConfig);
  };

  /**
   * Get the E911 ID from DHS.
   * @param userID
   */
  getE911Id = function (userId) {
    console.log(userId);
  };

  /**
   * Create E911 ID on DHS.
   * @param {Object} address Physical address object.
   */
  createE911Id = function (address) {
    console.log(address);
  };

  /**
   * Update the E911 ID on DHS.
   * @param {String} userId ICMN/VTN number or NoTN ID.
   * @param {Object} address The user's physical address object.
   */
  updateE911Id = function (userId, address) {
    console.log(userId, address);
  };

  registerUserOnDHS = function () {

  };

  init();
}(ATT || {}));
