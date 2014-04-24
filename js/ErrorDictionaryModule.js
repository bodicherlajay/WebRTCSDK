/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global error:true, ATT:true*/

/** ErrorDictinaryModule will add a factory method to create Error Dictionaries.
 *  @param app The application to add the method to.
 */
(function (app) {
  "use strict";

  /** Will create an error object using a prototype and will append
   *  all the properties in `spec`
   *  @param spec An object specifying the properties that need to be added to 
   *  the error object.
   */
  function createErrorWith(spec) {

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
    newError = app.utils.extend(newError, spec);
    newError = addFormatter(newError);// add `formatMethod`
    newError = addIdGetter(newError);

    return newError;
  }

  // will add a factory method to create an eventDictionary
  app.createErrorDictionary = function (spec) {
    var allErrors = [], // collection of all errors in this dictionary
      // `modules` is an immutable of abbreviations for the modules of this `app`
      modules = Object.freeze(spec.modules),
      newError = null;

    return { // return the error dictionary
      modules: modules,
      createError: function (spec) {
        // only allow creation of error for modules in the list
        if (!modules.hasOwnProperty(spec.moduleID)) {
          throw new Error('Invalid Module ID');
        }
        // create the error
        newError = createErrorWith(spec);
        // add it to the dictionary
        allErrors[newError.getId()] = newError;
        return newError;
      },
      getError: function (errorId) {
        return allErrors[errorId];
      }
    };
  };

}(ATT));

// Create an Error Dictionary for ATT
// TODO: This should be called in our `main` entry point.
ATT.errorDictionary = ATT.createErrorDictionary({
  modules: {
    APP_COfNFIG: 'APP-CFG',
    DHS: 'DHS',
    EVENT_CHANNEL: 'EVT-CHL',
    PEER_CONNECTION: 'PCN-SRV',
    USER_MEDIA: 'USR-SRV',
    RESOURCE_MGR: 'RES-MGR',
    RTC_EVENT: 'RTC-EVT',
    SIGNALING: 'SIG-SRV',
    SDP_FILTER: 'SDP-FLT',
    CALL_MGR: 'CALL-MGR',
    RTC: 'RTC'
  }
});
