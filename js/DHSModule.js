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
    apiObject,
    resourceManager = Env.resourceManager.getInstance(),

    // private methods
    init,

    // public methods

    login,

    loginSuccess,

    loginError,

    logout,

    getE911Id,

    getE911IdSuccess,

    getE911IdError,

    createE911Id,

    updateE911Id,

    registerUserOnDHS;

  init = function () {

    // create namespace.
    dhsNamespace = ATT.utils.createNamespace(app, 'rtc.dhs');

    apiObject = resourceManager.getAPIObject();

    // sub-namespaces on ATT.
    app.RESTClient = RESTClient;

    dhsNamespace.login = login;
    dhsNamespace.logout = logout;
    dhsNamespace.getE911Id = getE911Id;
    dhsNamespace.registerUserOnDHS = registerUserOnDHS;
    dhsNamespace.createE911Id = createE911Id;
    dhsNamespace.updateE911Id = updateE911Id;
  };

  /**
   * The login method that will be hit by UI.
   * @param {Object} config The userId/password
   */
  login = function (config) {
    // Call DHS to authenticate, associate user to session.
    resourceManager.doOperation('authenticateUser', {
      data:     config.data,
      success:  loginSuccess.bind(this, config),
      error:    loginError.bind(this, config)
    });
  };

  loginError = function (responseObject) {
    console.log('Create session error : ', responseObject);
  };

  loginSuccess = function (config, responseObject) {

    // get access token, e911 id that is needed to create webrtc session
    var authenticateResponseData = responseObject.getJson(),
      accessToken = authenticateResponseData.accesstoken ? authenticateResponseData.accesstoken.access_token : null,
      e911Id =  authenticateResponseData.e911Id;

    // if no access token return user data to UI, without webrtc session id
    if (!accessToken) {

      if (typeof config.error === 'function') {
        config.error(authenticateResponseData);
      }

    } else {
      // Call BF to create WebRTC Session.
      // getE911Id(config.userId);
      apiObject.initSession(accessToken, e911Id, function () {
        config.success();
      });
    }
  };

  logout = function () {

  };

  /**
   * Get the E911 ID from DHS.
   * @param userID
   */
  getE911Id = function () {
    resourceManager.doOperation('getE911Id', {
      success:  getE911IdSuccess,
      error:    getE911IdError
    });
  };

  /**
   * Success callback to get the e911Id
   * @param e911Id
   */
  getE911IdSuccess = function (e911Id) {
    console.log(e911Id);
  };

  getE911IdError = function () {
    console.log('getE911IDError!');
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

  registerUserOnDHS = function (config) {
    config.success();
  };

  init();
}(ATT || {}));
