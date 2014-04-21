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
    callManager = cmgmt.CallManager.getInstance(),

    // private methods
    init,

    // public methods
    checkSession,

    register,

    login,

    loginSuccess,

    loginError,

    logout,

    token,

    getE911Id,

    createE911Id,

    validateAddress,

    isEmptyString,

    isEmpty,

    updateE911Id;

  init = function () {

    // create namespace.
    dhsNamespace = ATT.utils.createNamespace(app, 'rtc.dhs');

    apiObject = resourceManager.getAPIObject();

    // sub-namespaces on ATT.
    app.RESTClient = RESTClient;

    dhsNamespace.checkSession = checkSession;
    dhsNamespace.register = register;
    dhsNamespace.login = login;
    dhsNamespace.logout = logout;
    dhsNamespace.token = token;
    dhsNamespace.getE911Id = getE911Id;
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

  register = function (config) {
    var registerConfig = {
      data: config.data,
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
    // Call DHS to check for a browser session.
    resourceManager.doOperation('registerUser', registerConfig);
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

  loginError = function (config, responseObject) {
    if (typeof config.error === 'function') {
      config.error(responseObject.getJson());
    }
  };

  loginSuccess = function (config, responseObject) {

    // get access token, e911 id that is needed to create webrtc session
    var authenticateResponseData = responseObject.getJson(),
      accessToken = authenticateResponseData.accesstoken ? authenticateResponseData.accesstoken.access_token : null,
      e911Id =  authenticateResponseData.e911Id,
      successcb = function () {};

    // if no access token return user data to UI, without webrtc session id
    if (!accessToken) {
      if (typeof config.error === 'function') {
        config.error(authenticateResponseData);
      }
    } else {
      // Call BF to create WebRTC Session.
      // getE911Id(config.userId);
      if (typeof config.success === 'function') {
        successcb = config.success.bind(null, authenticateResponseData);
      }
      apiObject.initSession(accessToken, e911Id, successcb);
    }
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

  token = function (config) {
    // Call DHS to get token for user consent flow
    resourceManager.doOperation('getAccessToken', {
      params: {
        url: [config.code]
      },
      success:  loginSuccess.bind(this, config),
      error:    loginError.bind(this, config)
    });
  };

  /**
   * Get the E911 ID from DHS.
   * @param {Object} config
   */
  getE911Id = function (config) {

    if (!config.data.userId) {
      throw new Error('userId required for getE911Id.');
    }

    var getE911IdConfig = {
      data: {
        userId: config.userId
      },
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
    resourceManager.doOperation('getE911Id', getE911IdConfig);
  };

  /**
   * Simple validator for physical address object.
   * Todo: validator module.
   * @param addressObject
   */
  validateAddress = function (addressObject) {
    var retVal = true,
      index;

    if (typeof addressObject !== 'object') {
      return false;
    }

    if (Object.keys(addressObject).length === 0) {
      return false;
    }

    for (index in addressObject) {
      if (addressObject.hasOwnProperty(index)) {
        if (index !== 'address2') { // address 2 not required
          if (isEmptyString(addressObject[index])) {
            retVal = false;
          }
        }
      }
    }
    return retVal;
  };

  /**
   * Check for empty string.
   * Todo: validator module.
   * @param {String} item
   * @returns {boolean}
   */
  isEmptyString = function (item) {
    return (typeof item === 'string' && isEmpty(item));
  };

  /**
   * isEmpty validator function.
   * Todo: validator module.
   * @param {Any} item
   * @returns {boolean}
   */
  isEmpty = function (item) {
    if (item === null || item === undefined) {
      return true;
    }

    if (typeof item === 'string' || Array.isArray(item)) {
      return item.length === 0;
    }

    if (typeof item === 'object') {
      return Object.keys(item).length === 0;
    }

    return false;
  };

  /**
   * Create an the E911 ID on DHS.
   * @param {Object} config
   * @member {String} userId ICMN / VTN user
   * @member {Object} address The user's physical address object.
   */
  createE911Id = function (config) {

    if (isEmpty(config.userId)) {
      throw new Error('userId required.');
    }

    if (!validateAddress(config.address)) {
      throw new Error('Address did not validate.');
    }

    var createE911IdConfig = {
      data: {
        userId: config.userId,
        address: config.address
      },
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

    // Call DHS to update and e911 id linked address for the user
    resourceManager.doOperation('createE911Id', createE911IdConfig);
  };

  /**
   * update E911 ID on DHS.
   * @param {Object} config
   * @member {String} userId ICMN / VTN user
   * @member {Object} address The user's physical address object.
   */
  updateE911Id = function (config) {
    console.log(config);
  };

  init();
}(ATT || {}));