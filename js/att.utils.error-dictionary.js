/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT: true,sdkErrorCollection:true */

/** ErrorDictinaryModule will extend ATT.utils with a factory method to create Error Dictionaries.
 *  @warning Assumes ATT.utils is already defined.
 */

(function () {
  "use strict";
  var typeofModule;
  /** Will create an error object using a prototype and will append
   *  all the properties in `spec`
   *  @param spec An object specifying the properties that need to be added to
   *  the error object.
   */
  function createErrorWith(spec, utils) {

    var protoTypeAPIError = {
        JSObject:'',           //JS Object
        JSMethod:'',           //JS Method
        ErrorCode: '',         //Error code
        ErrorMessage: '',      //Error Message
        PossibleCauses: '',    //Possible Causes
        PossibleResolution: '',//Possible Resolution
        APIError: '',          //API Error response
        ResourceMethod: '',    //Resource URI
        HttpStatusCode:'',     //HTTP Status Code
        MessageId:''           //Message ID
      },
      newError;

    // will add a `formatError` method to `error`
    function addFormatter(error) {
      error.formatError = function () {
        var errorString = error.JSObject + '-' +
          error.JSMethod + '-' +
          error.ErrorCode + '-' +
          error.ErrorMessage + '-' +
          error.PossibleCauses + '-' +
          error.PossibleResolution + '-' +
          error.APIError + '-' +
          error.ResourceMethod + '-' +
          error.HttpStatusCode + '-' +
          error.MessageId;
        return errorString;
      };
      return error;
    }

    // will add a `getId` method to `error`
    function addIdGetter(error) {
      error.getId = function () {
        var errorID = error.ErrorCode;
        return errorID;
      };
      return error;
    }
    // second key to lookup using method name, http status code and message id
    function getAPIErrorByMethodStatusMsgId(error) {
      error.getAPIErrorByMethodStatusMsgId = function () {
        var opStatusMsgId = error.JSMethod + error.HttpStatusCode + error.MessageId;
        return opStatusMsgId;
      };
      return error;
    }
    newError = Object.create(protoTypeAPIError);
    // extend with the properties in the spec
    newError = utils.extend(newError, spec);
    newError = addFormatter(newError);// add `formatMethod`
    newError = addIdGetter(newError);
    newError = getAPIErrorByMethodStatusMsgId(newError);
    return newError;
  }

  function createErrorDictionary(sdkErrors, apiErrors) {
    var utils = ATT.utils,
      newError = null, idx = 0, apiErrorContainer = [], errorCount = apiErrors.length;

    //Load the API Errors into dictionary
    for (idx = 0; idx < errorCount; idx = idx + 1) {
      // create the error
      newError = createErrorWith(apiErrors[idx], utils);
      // add it to the dictionary
      apiErrorContainer[newError.getId()] = newError;
      apiErrorContainer[newError.getAPIErrorByMethodStatusMsgId()] = newError;
    }

    return { // return the error dictionary
      createError: function (spec) {
        return createErrorWith(spec,utils);
      },
      getSDKError: function (errorId) {
        return sdkErrors[errorId];
      },
      getError: function (errorId) {
        return apiErrorContainer[errorId];
      },
      getAPIError: function (methodName, httpStatusCode, messageId) {
        var errObj = apiErrorContainer[methodName + httpStatusCode + messageId];
        if (!errObj) {
          errObj = apiErrorContainer["*" + httpStatusCode + messageId];
          if (errObj) {
            errObj.JSMethod = methodName;
          }
        }
        return errObj;
      },
      getDefaultError: function (errorSpec) {
        return createErrorWith(errorSpec,utils);
      }
    };
  }

  // Export to NodeJS
  typeofModule = typeof module;
  if ('undefined' !== typeofModule && module.exports) {
    module.exports = createErrorDictionary;
  } else {
    console.debug('Not exporting to NodeJS...');
  }

  // Export to the Browser
  try {
    window.ATT.utils.createErrorDictionary = createErrorDictionary;
  } catch (e) {
    throw new Error('Error while exporting ATT.errorDictionary.'
      + '\n ATT = ', JSON.stringify(window.ATT)
      + 'Original Message: ' + e.message);
  }

}());
