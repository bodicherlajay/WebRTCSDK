/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */
/**
 *  The WebRTC DHS module.
 */

(function (app) {
  'use strict';

  var dhsNamespace = {},
    apiConfigs = ATT.private.config.api,
    factories = ATT.private.factories,
    resourceManager = factories.createResourceManager(apiConfigs),
    logManager = ATT.logManager.getInstance(),
    logger,

    // private methods
    init,

    handleSuccess,

    handleError,

    validateAddress,

    isEmptyString,

    isEmpty,

    // public methods
    session,

    registerUser,

    deleteUser,

    vtnList,

    authorize,

    token,

    login,

    logout,

    createE911Id,

  // implementions
  init = function () {

    logger = logManager.getLogger('DHSModule', logManager.loggerType.CONSOLE, logManager.logLevel.ERROR);

    // create namespace.
    dhsNamespace = ATT.utils.createNamespace(app, 'rtc.dhs');

    // sub-namespaces on ATT.
    app.RESTClient = RESTClient;

    dhsNamespace.session = session;
    dhsNamespace.registerUser = registerUser;
    dhsNamespace.deleteUser = deleteUser;
    dhsNamespace.vtnList = vtnList;
    dhsNamespace.authorize = authorize;
    dhsNamespace.token = token;
    dhsNamespace.login = login;
    dhsNamespace.logout = logout;
    dhsNamespace.createE911Id = createE911Id;
  };

  handleSuccess = function (successHandler, responseObject) {
    if (typeof successHandler === 'function') {
      successHandler(responseObject.getJson());
    }
  };

  handleError = function (operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);
    logger.logInfo('There was an error performing operation ' + operation);

    var error = ATT.Error.create(err, operation, 'DHS');

    if (typeof errHandler === 'function') {
      ATT.Error.publish(error, operation, errHandler);
    }
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
        if (index !== 'unit') { // unit is not required
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

  session = function (config) {
    try {
      // Call DHS to check for a browser session.
      resourceManager.doOperation('checkDhsSession', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    handleError.bind(this, 'session', config.error)
      });
    } catch (err) {
      handleError.call(this, 'session', config.error, err);
    }
  };

  registerUser = function (config) {
    try {
      // Call DHS to register a new user on DHS
      resourceManager.doOperation('registerUser', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    handleError.bind(this, 'registerUser', config.error)
      });
    } catch (err) {
      handleError.call(this, 'registerUser', config.error, err);
    }
  };

  deleteUser = function (config) {
    try {
      // Call DHS to delete a user on DHS
      resourceManager.doOperation('deleteUser', {
        params: {
          url: config.data.userId
        },
        success:  handleSuccess.bind(this, config.success),
        error:    handleError.bind(this, 'deleteUser', config.error)
      });
    } catch (err) {
      handleError.call(this, 'deleteUser', config.error, err);
    }
  };

  vtnList = function (config) {
    try {
      // Call DHS to get a list of VTN phone numbers
      resourceManager.doOperation('getVTNList', {
        success:  handleSuccess.bind(this, config.success),
        error:    handleError.bind(this, 'vtnList', config.error)
      });
    } catch (err) {
      handleError.call(this, 'vtnList', config.error, err);
    }
  };

  /**
   * The login method that will be hit by UI.
   * @param {Object} config The usertype
   */
  authorize = function (config) {
    try {
      // Call DHS to get user consent url or access token, associate user to access token.
      resourceManager.doOperation('oAuthAuthorize', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    handleError.bind(this, 'authorize', config.error)
      });
    } catch (err) {
      handleError.call(this, 'authorize', config.error, err);
    }
  };

  /**
   * The token method that will be hit by UI.
   * @param {Object} config The code
   */
  token = function (config) {
    try {
      // Call DHS to get token for user consent flow
      resourceManager.doOperation('oAuthToken', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    handleError.bind(this, 'token', config.error)
      });
    } catch (err) {
      handleError.call(this, 'token', config.error, err);
    }
  };

  /**
   * The login method that will be hit by UI.
   * @param {Object} config The usertype
   */
  login = function (config) {
    try {
      // Call DHS to authenticate user
      resourceManager.doOperation('authenticateUser', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    handleError.bind(this, 'login', config.error)
      });
    } catch (err) {
      handleError.call(this, 'login', config.error, err);
    }
  };

  /**
   * The logout method that will be hit by UI.
   * @param {Object} config The callbacks
   */
  logout = function (config) {
    try {
      // Call DHS to logout user by deleting browser session.
      resourceManager.doOperation('logoutUser', {
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
        error: handleError.bind(this, 'logout', config.error)
      });
    } catch (err) {
      handleError.call(this, 'logout', config.error, err);
    }
  };

  /**
   * Create an E911 ID.
   * @param {Object} config
   * @member {Object} address The user's physical address object.
   */
  createE911Id = function (config) {
    try {
      if (!config) {
        throw 'Cannot create e911 id. Configuration is required.';
      }
      if (!config.data) {
        throw 'Cannot create e911 id. Configuration data is required.';
      }
      if (!validateAddress(config.data.address)) {
        throw 'Cannot create e911 id. Address did not validate.';
      }

      // Call DHS to create an e911 id linked address for the user
      resourceManager.doOperation('createE911Id', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    handleError.bind(this, 'createE911Id', config.error)
      });
    } catch (err) {
      handleError.call(this, 'createE911Id', config.error, err);
    }
  };

  init();
}(ATT || {}));
