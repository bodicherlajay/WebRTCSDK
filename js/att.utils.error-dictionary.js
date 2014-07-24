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
    // second key to lookup using operation name, http status code and message id
    function addOpStatusMessageId(error) {
      error.opStatusMsgId = function () {
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
    newError = addOpStatusMessageId(newError);
    return newError;
  }

  function createErrorDictionary(spec, utils) {
    var apiErrors = ATT.utils.ErrorStore.APIErrors.getAllAPIErrors(), // collection of all errors in this dictionary
      sdkErrors = ATT.utils.ErrorStore.SDKErrors.getAllSDKErrors(),
      newError = null;

    return { // return the error dictionary
      createError: function (spec) {
        // create the error
        newError = createErrorWith(spec, utils);
        // add it to the dictionary
        apiErrors[newError.getId()] = newError;
        apiErrors[newError.opStatusMsgId()] = newError;
        return newError;
      },
      getSDKError: function (errorId) {
        return sdkErrors[errorId];
      },
      getError: function (errorId) {
        return apiErrors[errorId];
      },
      getAPIError: function (methodName, httpStatusCode, messageId) {
        return createErrorWith(apiErrors[methodName + httpStatusCode + messageId],utils);
      },
      getMissingError: function (errSpec) {
        return this.createError(errSpec);
      },
      getAPIExceptionError: function (errSpec) {
        return this.createError(errSpec);
      },
      getDHSError: function (dhsErrSpec) {
        return this.createError(dhsErrSpec);
      },
      getDefaultError: function (errorSpec) {
        return this.createError(errorSpec);
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
