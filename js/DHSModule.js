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

    register,

    vtnList,

    authorize,

    token,

    login,

    logout,

    getE911Id,

    createE911Id,

    updateE911Id;

  // implementions
  init = function () {

    logger = logManager.getLogger('DHSModule', logManager.loggerType.CONSOLE, logManager.logLevel.ERROR);

    // create namespace.
    dhsNamespace = ATT.utils.createNamespace(app, 'rtc.dhs');

    // sub-namespaces on ATT.
    app.RESTClient = RESTClient;

    dhsNamespace.session = session;
    dhsNamespace.register = register;
    dhsNamespace.vtnList = vtnList;
    dhsNamespace.authorize = authorize;
    dhsNamespace.token = token;
    dhsNamespace.login = login;
    dhsNamespace.logout = logout;
    dhsNamespace.getE911Id = getE911Id;
    dhsNamespace.createE911Id = createE911Id;
    dhsNamespace.updateE911Id = updateE911Id;
  };

  handleSuccess = function (config, responseObject) {
    if (typeof config.success === 'function') {
      config.success(responseObject.getJson());
    }
  };

  handleError = function (config, operation, errorResp) {
    var errObj = errorResp.getJson(),
      error;

    if (errObj.RequestError) {    // Known API errors
      if (errObj.RequestError.ServiceException) { // API Service Exceptions
        error = ATT.errorDictionary.getErrorByOpStatus(operation, errorResp.getResponseStatus(), errObj.RequestError.ServiceException.MessageId);
      } else if (errObj.RequestError.PolicyException) { // API Policy Exceptions
        error = ATT.errorDictionary.getErrorByOpStatus(operation, errorResp.getResponseStatus(), errObj.RequestError.PolicyException.MessageId);
      } else if (errObj.RequestError.Exception) { // API Exceptions
        error = ATT.errorDictionary.getDefaultError({
          moduleID: 'DHS',
          operationName: operation,
          httpStatusCode: errorResp.getResponseStatus(),
          errorDescription: 'Operation ' + operation + ' failed',
          reasonText: errObj.RequestError.Exception.Text
        });
      } else {                      // Unknown API network errors
        error = ATT.errorDictionary.getDefaultError({
          moduleID: 'DHS',
          operationName: operation,
          httpStatusCode: errorResp.getResponseStatus(),
          errorDescription: 'Operation ' + operation + ' failed',
          reasonText: 'DHS operation ' + operation + ' failed due to unknown reason'
        });
      }
    } else {
      error = ATT.errorDictionary.getDHSError({ // DHS thrown errors
        operationName: operation,
        httpStatusCode: errorResp.getResponseStatus(),
        reasonText: errObj.error || ''
      });
    }
    if (!error) {
      error = ATT.errorDictionary.getMissingError();
    }
    // log the error
    logger.logError(error.formatError());

    if (typeof config.error === 'function') {
      config.error(error);
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
    // Call DHS to check for a browser session.
    resourceManager.doOperation('checkDhsSession', {
      data:     config.data,
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'session')
    });
  };

  register = function (config) {
    // Call DHS to register a new user on DHS
    resourceManager.doOperation('registerUser', {
      data:     config.data,
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'register')
    });
  };

  vtnList = function (config) {
    // Call DHS to get a list of VTN phone numbers
    resourceManager.doOperation('getVTNList', {
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'vtnList')
    });
  };

  /**
   * The login method that will be hit by UI.
   * @param {Object} config The usertype
   */
  authorize = function (config) {
    // Call DHS to get user consent url or access token, associate user to access token.
    resourceManager.doOperation('oAuthAuthorize', {
      data:     config.data,
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'authorize')
    });
  };

  /**
   * The token method that will be hit by UI.
   * @param {Object} config The code
   */
  token = function (config) {
    // Call DHS to get token for user consent flow
    resourceManager.doOperation('oAuthToken', {
      data:     config.data,
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'token')
    });
  };

  /**
   * The login method that will be hit by UI.
   * @param {Object} config The usertype
   */
  login = function (config) {
    // Call DHS to authenticate user
    resourceManager.doOperation('authenticateUser', {
      data:     config.data,
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'login')
    });
  };

  /**
   * The logout method that will be hit by UI.
   * @param {Object} config The callbacks
   */
  logout = function (config) {
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
      error: handleError.bind(this, config, 'logout')
    });
  };

  /**
   * Get the E911 ID from DHS.
   * @param {Object} config Unique id.
   */
  getE911Id = function (config) {
    if (!config) {
      return logger.logError('Cannot get e911 id. Configuration is required.');
    }
    if (!config.data) {
      return logger.logError('Cannot get e911 id. Configuration data is required.');
    }
    if (!config.data.id) {
      return logger.logError('Cannot get e911 id. Unique identifier is required.');
    }

    resourceManager.doOperation('getE911Id', {
      params: {
        url: config.data.id
      },
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'getE911Id')
    });
  };

  /**
   * Create an E911 ID.
   * @param {Object} config
   * @member {Object} address The user's physical address object.
   */
  createE911Id = function (config) {
    if (!config) {
      return logger.logError('Cannot create e911 id. Configuration is required.');
    }
    if (!config.data) {
      return logger.logError('Cannot create e911 id. Configuration data is required.');
    }
    if (!validateAddress(config.data.address)) {
      return logger.logError('Cannot create e911 id. Address did not validate.');
    }

    // Call DHS to create an e911 id linked address for the user
    resourceManager.doOperation('createE911Id', {
      data:     config.data,
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'createE911Id')
    });
  };

  /**
   * Update an E911 ID.
   * @param {Object} config
   * @member {Object} address The user's physical address object.
   */
  updateE911Id = function (config) {
    if (!config) {
      return logger.logError('Cannot update e911 id. Configuration is required.');
    }
    if (!config.data) {
      return logger.logError('Cannot update e911 id. Configuration data is required.');
    }
    if (!validateAddress(config.data.address)) {
      return logger.logError('Cannot update e911 id. Address did not validate.');
    }

    // Call DHS to create an e911 id linked address for the user
    resourceManager.doOperation('updateE911Id', {
      data:     config.data,
      success:  handleSuccess.bind(this, config),
      error:    handleError.bind(this, config, 'updateE911Id')
    });
  };

  init();
}(ATT || {}));