/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global error:true, ATT:true*/

/** ErrorDictinaryModule will add a factory method to create Error Dictionaries.
 *  @param app The application to add the method to.
 */
(function () {
  "use strict";
  // identify the environment
  var typeOfWindow = typeof window,
    rootEnv = 'undefined' === typeOfWindow ? module.exports : window;

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
        var errorID = error.moduleID + error.userErrorCode + error.operationName
            + error.httpStatusCode + error.messageId;
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

  // Export method to ATT.utils.createErrorDictionary
  // will add a factory method to create an eventDictionary

  // Check if the global ATT var has been created
  if (undefined === rootEnv.ATT) { // ATT has not been defined
    ATT = { utils: {}}; // define global ATT variable
    console.log('Creating emtpy function ATT.utils.extend');
    ATT.utils.extend = function (target, source) {
      console.log(source);
      return target;
    };
  }
  ATT.utils.createErrorDictionary = createErrorDictionary;

}());