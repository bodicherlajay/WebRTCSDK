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
  'use strict';

  var dhsNamespace = {},
    resourceManager = Env.resourceManager.getInstance(),
    callManager = cmgmt.CallManager.getInstance(),
    logManager = ATT.logManager.getInstance(),
    log,

    // private methods
    init,

    // public methods
    checkSession,

    register,

    loginSuccess,

    loginError,

    login,

    token,

    logout,

    validateAddress,

    isEmptyString,

    isEmpty,

    createE911Id,

    updateE911Id;

  init = function () {

    logManager.configureLogger('DHSModule', logManager.loggerType.CONSOLE, logManager.logLevel.ERROR);

    log = logManager.getLogger('DHSModule');

    // create namespace.
    dhsNamespace = ATT.utils.createNamespace(app, 'rtc.dhs');

    // sub-namespaces on ATT.
    app.RESTClient = RESTClient;

    dhsNamespace.checkSession = checkSession;
    dhsNamespace.register = register;
    dhsNamespace.login = login;
    dhsNamespace.token = token;
    dhsNamespace.logout = logout;
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
        var error = {
          status: response.getResponseStatus(),
          error: "Please login first"
        };

        if (typeof config.error === 'function') {
          config.error(error);
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

  loginError = function (config, responseObject) {
    log.logError(responseObject.getJson().error);

    if (typeof config.error === 'function') {
      config.error(responseObject.getJson());
    }
  };

  loginSuccess = function (config, responseObject) {
    if (typeof config.success === 'function') {
      config.success(responseObject.getJson());
    }
  };

  /**
   * The login method that will be hit by UI.
   * @param {Object} config The usertype
   */
  login = function (config) {
    // Call DHS to authenticate, associate user to session.
    resourceManager.doOperation('authenticateUser', {
      data:     config.data,
      success:  loginSuccess.bind(this, config),
      error:    loginError.bind(this, config)
    });
  };

  /**
   * The token method that will be hit by UI.
   * @param {Object} config The code
   */
  token = function (config) {
    // Call DHS to get token for user consent flow
    resourceManager.doOperation('getAccessToken', {
      data: config.data,
      success:  loginSuccess.bind(this, config),
      error:    loginError.bind(this, config)
    });
  };

  /**
   * The logout method that will be hit by UI.
   * @param {Object} config The callbacks
   */
  logout = function (config) {

    var logoutConfig = {
      success: function (response) {
        var data;
        if (response.getResponseStatus() === 204) {
          data = {
            message: "You have been successfully logged out."
          };
        } else {
          data = response.getJson();
        }
        if (typeof config.success === 'function') {
          config.success(data);
        }
      },
      error: function (response) {
        var data = response.getJson();
        log.logError(data.error);
        if (typeof config.error === 'function') {
          config.error(data);
        }
      }
    };

    // Call DHS to logout user by deleting browser session.
    resourceManager.doOperation('logoutUser', logoutConfig);
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
    if (!config) {
      return log.logError('Cannot create e911 id. Configuration is required.');
    }
    if (!config.data) {
      return log.logError('Cannot create e911 id. Configuration data is required.');
    }
    if (!validateAddress(config.data.address)) {
      return log.logError('Cannot create e911 id. Address did not validate.');
    }

    var createE911IdConfig = {
      data: config.data,
      success: function (response) {
        var data = response.getJson();
        if (typeof config.success === 'function') {
          config.success(data);
        }
      },
      error: function (response) {
        var data = response.getJson();
        log.logError(data.error);
        if (typeof config.error === 'function') {
          config.error(data);
        }
      }
    };

    // Call DHS to create an e911 id linked address for the user
    resourceManager.doOperation('createE911Id', createE911IdConfig);
  };

  /**
   * update E911 ID on DHS.
   * @param {Object} config
   * @member {String} userId ICMN / VTN user
   * @member {Object} address The user's physical address object.
   */
  updateE911Id = function (config) {
    if (!config) {
      return log.logError('Cannot create e911 id. Configuration is required.');
    }
    if (!config.data) {
      return log.logError('Cannot create e911 id. Configuration data is required.');
    }
    if (!validateAddress(config.data.address)) {
      return log.logError('Cannot create e911 id. Address did not validate.');
    }

    var updateE911IdConfig = {
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

    // Call DHS to update an e911 id linked address for the user
    resourceManager.doOperation('updateE911Id', updateE911IdConfig);
  };

  init();
}(ATT || {}));