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
    newError = Object.create(prototypeError);
    // extend with the properties in the spec
    newError = utils.extend(newError, spec);
    newError = addFormatter(newError);// add `formatMethod`
    newError = addIdGetter(newError);

    return newError;
  }

  function createErrorDictionary(spec, utils) {
    var allErrors = [], // collection of all errors in this dictionary
      // `modules` is an immutable of abbreviations for the modules of this `app`
      modules = Object.freeze(spec.modules),
      newError = null;

    return { // return the error dictionary
      createError: function (spec) {
        // only allow creation of error for modules in the list
        if (!modules.hasOwnProperty(spec.moduleID)) {
          throw new Error('Invalid Module ID');
        }
        // create the error
        newError = createErrorWith(spec, utils);
        // add it to the dictionary
        allErrors[newError.getId()] = newError;
        return newError;
      },
      getError: function (errorId) {
        return allErrors[errorId];
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
  typeofWindow = typeof window;
  if ('undefined' !== typeofWindow) {
    if (undefined !== window.ATT && window.ATT.utils) {
      window.ATT.utils.createErrorDictionary = createErrorDictionary;
    } else {
      console.error('Not exporting... window.ATT.utils is:' + window.ATT.utils);
    }
  }
}());
