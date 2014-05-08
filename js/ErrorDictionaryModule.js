/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/

/** ErrorDictinaryModule will extend ATT.utils with a factory method to create Error Dictionaries.
 *  @warning Assumes ATT.utils is already defined.
 */

(function () {
  "use strict";
  var typeofWindow, typeofModule;
  /** Will create an error object using a prototype and will append
   *  all the properties in `spec`
   *  @param spec An object specifying the properties that need to be added to
   *  the error object.
   */
  function createErrorWith(spec, utils) {

    var prototypeError = {
        userErrorCode: '',    //5 digit error code
        operationName: '',    //Name of the REST operation
        httpStatusCode: '',   //HTTP Status code
        messageId: '',        //SVC or POL Error
        helpText: '',         //Help text which can be displayed on UI
        reasonText: '',       //High level reason text, invalid input, forbidden
        errorDescription: '', //Error Description
        moduleID: ''
      },
      newError;

    // will add a `formatError` method to `error`
    function addFormatter(error) {
      error.formatError = function () {
        var errorString = error.moduleID + '-' + error.userErrorCode + '-'
          + error.operationName + '-' + error.httpStatusCode + '-'
          + error.messageId + '-' + error.reasonText + '-' + error.errorDescription;
        return errorString;
      };
      return error;
    }

    // will add a `getId` method to `error`
    function addIdGetter(error) {
      error.getId = function () {
        var errorID = error.userErrorCode;
        return errorID;
      };
      return error;
    }
    // second key to lookup using operation name, http status code and message id
    function addOpStatusMessageId(error) {
      error.opStatusMsgId = function () {
        var opStatusMsgId = error.operationName + error.httpStatusCode + error.messageId;
        return opStatusMsgId;
      };
      return error;
    }
    newError = Object.create(prototypeError);
    // extend with the properties in the spec
    newError = utils.extend(newError, spec);
    newError = addFormatter(newError);// add `formatMethod`
    newError = addIdGetter(newError);
    newError = addOpStatusMessageId(newError);
    return newError;
  }

  function createErrorDictionary(spec, utils) {
    var allErrors = [], // collection of all errors in this dictionary
      // `modules` is an immutable of abbreviations for the modules of this `app`
      modules = Object.freeze(spec.modules),
      newError = null,
      allErrorsOpStats = [];

    return { // return the error dictionary
      createError: function (spec) {
        // only allow creation of error for modules in the list
        if (!modules.hasOwnProperty(spec.moduleID)) {
          throw new Error('Invalid Module ID-' + spec.moduleID);
        }
        // create the error
        newError = createErrorWith(spec, utils);
        // add it to the dictionary
        allErrors[newError.getId()] = newError;
        allErrorsOpStats[newError.opStatusMsgId()] = newError;
        return newError;
      },
      getError: function (errorId) {
        return allErrors[errorId];
      },
      getErrorByOpStatus: function (operationName, httpStatusCode, messageId) {
        return allErrorsOpStats[operationName + httpStatusCode + messageId];
      },
      getMissingError: function () {
        return allErrors['SDK-00000'];
      },
      getDafaultError: function () {
        return allErrors['SDK-00001'];
      },
      getDHSError: function (dhsErrSpec) {
        var err = utils.extend(allErrors['SDK-50000']);
        err.operationName = dhsErrSpec.operationName;
        err.httpStatusCode = dhsErrSpec.httpStatusCode;
        err.reasonText = dhsErrSpec.reasonText;
        return err;
      },
      modules: modules
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
  typeofWindow = typeof window;
  if ('undefined' !== typeofWindow) {
    if (undefined !== window.ATT && window.ATT.utils) {
      window.ATT.utils.createErrorDictionary = createErrorDictionary;
    } else {
      console.error('Not exporting... window.ATT.utils is:' + window.ATT.utils);
    }
  }
}());
