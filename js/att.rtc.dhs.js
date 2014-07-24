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

      dhsNamespace = {};

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

      return dhsNamespace;
    };

  handleSuccess = function (successHandler, responseObject) {
    if (typeof successHandler === 'function') {
      successHandler(responseObject.getJson());
    }
  };

  handleError = function (errHandler, err, methodName) {
    logger.logDebug('handleError: ' + methodName);
    logger.logInfo('There was an error performing operation ' + methodName);

    var error = ATT.Error.createAPIErrorCode(err,"ATT.rtc.dhs",methodName,"DHS");
    errHandler(error);
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

  /**
   * @summary
   * Create a session on the DHS for a given user
   * @desc
   * Confirms the User Session
   *
   * **Error Codes**
   *
   *   - Code - Desc
   *
   * @memberof ATT.rtc.dhs
   * @static
   * @param {Object} config
   * @param {Function} config.success
   * @param {Function} config.error
   */
  session = function (config) {
    try {
      // Call DHS to check for a browser session.
      resourceManager.doOperation('checkDhsSession', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    function(error)
        {
          handleError(config.error,error,"session");
        }
      });
    } catch (err) {
      handleError(config.error, err, "session");
    }
  };

  /**
   * @summary
   * Creates a new user in the DHS.
   * @desc
   * Used to create new VTN/NoTN users
   *
   * **Error Codes**
   *
   *   - Code - Desc
   *
   * @memberof ATT.rtc.dhs
   * @static
   * @param {Object} config
   * @param {Object} config.data
   * @param {String} config.data.name
   * @param {String} config.data.userid
   * @param {String} config.data.name
   * @param {String} config.data.password
   * @param {String} config.data.confpassword
   * @param {Function} config.success
   * @param {Function} config.error

   * @example
   var dhs = ATT.rtc.dhs;
   dhs.registerUser({
      data: userData,
      success: function (data) {
        // ...
      },
      error: function (err) {
        // ..
      }
    });
   */
  registerUser = function (config) {
    try {
      // Call DHS to register a new user on DHS
      resourceManager.doOperation('registerUser', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    function(error)
        {
          handleError(config.error,error,"registerUser");
        }
      });
    } catch (err) {
      handleError(config.error, err, "registerUser");
    }
  };

  /**
   * @summary
   * Delete a user from the DHS
   * @desc
   *
   * **Error Codes**
   *
   *   - Code - Desc
   *
   * @memberof ATT.rtc.dhs
   * @static
   * @param {Object} config
   * @param {Object} config.data User's data
   * @param {String} config.data.name
   * @param {Function} config.success
   * @param {Function} config.error
   */
  deleteUser = function (config) {
    try {
      // Call DHS to delete a user on DHS
      resourceManager.doOperation('deleteUser', {
        params: {
          url: config.data.userId
        },
        success:  handleSuccess.bind(this, config.success),
        error:    function(error)
        {
          handleError(config.error,error,"deleteUser");
        }
      });
    } catch (err) {
      handleError(config.error, err, "deleteUser");
    }
  };

  vtnList = function (config) {
    try {
      // Call DHS to get a list of VTN phone numbers
      resourceManager.doOperation('getVTNList', {
        success:  handleSuccess.bind(this, config.success),
        error:    function(error)
        {
          handleError(config.error,error,"vtnList");
        }
      });
    } catch (err) {
      handleError(config.error, err, "vtnList");
    }
  };

  /**
   * @summary
   * Attempts to authorize your mobile to make WebRTC calls
   * @desc
   * AT&T OAuth Consent flow
   *
   * **Error Codes**
   *
   *   - Code - Desc
   *
   * @memberof ATT.rtc.dhs
   * @static
   * @param {Object} config
   * @param {Object} config.data
   * @param {Object} config.data.type User type: `ICMN`, `VTN` or `NOTN`
   * @param {Function} config.success
   * @param {Function} config.error
   */
  authorize = function (config) {
    try {
      // Call DHS to get user consent url or access token, associate user to access token.
      resourceManager.doOperation('oAuthAuthorize', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    function(error)
        {
          handleError(config.error,error,"authorize");
        }
      });
    } catch (err) {
      handleError(config.error, err, "authorize");
    }
  };

  /**
   * @summary Retrive an Access Token
   * @description
   * Uses the authcode obtained from consent flow.
   * For ICMN user we obtain new access token every time the user goes through
   * consent flow and authenticated calls dhs to get access token on successful
   * return it will call address page
   * @function token
   * @static
   * @memberOf ATT.rtc.dhs
   * @param {Object} config
   * @param {Object} config.data
   * @param {Object} config.data.code Authorization Code from Consent flow.
   * @param {Function} config.success
   * @param {Function} config.error
   */
  token = function (config) {
    try {
      // Call DHS to get token for user consent flow
      resourceManager.doOperation('oAuthToken', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    function(error)
        {
          handleError(config.error,error,"token");
        }
      });
    } catch (err) {
      handleError(config.error, err, "token");
    }
  };

  /**
   * @summary Login user to the DHS
   * @description Call DHS to authenticate user
   * @function login
   * @static
   * @memberOf ATT.rtc.dhs
   * @param {Object} config
   * @param {Object} config.data
   * @param {Object} config.data.userid
   * @param {Object} config.data.password
   * @param {Function} config.success
   * @param {Function} config.error
   */
  login = function (config) {
    try {
      // Call DHS to authenticate user
      resourceManager.doOperation('authenticateUser', {
        data:     config.data,
        success:  handleSuccess.bind(this, config.success),
        error:    function(error)
        {
          handleError(config.error,error,"login");
        }
      });
    } catch (err) {
      handleError(config.error, err, "login");
    }
  };

  /**
   * The logout method that will be hit by UI.
   * @param {Object} config The callbacks
   */
  /**
   * @summary Logout user from the DHS
   * @description Call DHS to delete the user's session
   * @function logout
   * @static
   * @memberOf ATT.rtc.dhs
   * @param {Object} config
   * @param {Function} config.success
   * @param {Function} config.error
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
        error:    function(error)
        {
          handleError(config.error,error,"logout");
        }
      });
    } catch (err) {
      handleError(config.error, err, "logout");
    }
  };

  /**
   * @summary
   * Creates a new E911 ID for the address provided
   * @desc
   * Created every time the ICMN user goes through the consent flow and authenticated
   *
   * **Error Codes**
   *
   *   - Code - Desc
   *
   * @memberof ATT.rtc.dhs
   * @static
   * @param {Object} config
   * @param {Object} config.data The address fields
   * @param {Function} config.success
   * @param {Function} config.error
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
        error:    function(error)
        {
          handleError(config.error,error,"createE911Id");
        }
      });
    } catch (err) {
      handleError(config.error, err, "createE911Id");
    }
  };


  /**
   * DHS API.
   * Wrapper methods to interact with the DHS.
   * @namespace ATT.rtc.dhs
   */
  ATT.rtc.dhs = init();
}(ATT || {}));
