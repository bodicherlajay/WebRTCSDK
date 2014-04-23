/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global error:true, ATT:true*/

(function (app) {
  "use strict";
  //Error prototype
  var instance,
    errorCollection = [],
    module = {},
    errorProtoType = {
      userErrorCode: '',    //5 digit error code
      operationName: '',    //Name of the REST operation
      httpStatusCode: '',   //HTTP Status code
      messageId: '',        //SVC or POL Error
      helpText: '',         //Help text which can be displayed on UI
      reasonText: '',       //High level reason text, invalid input, forbidden
      errorDescription: '', //Error Description
      moduleID: '',          //one of the configured module name
      formatError : function () {
        return this.moduleID + '-' + this.userErrorCode + '-' + this.operationName + '-' + this.httpStatusCode + '-' + this.messageId + '-' +
          this.reasonText + '-' + this.errorDescription;
      },
      errorId : function () {
        return this.moduleID + this.userErrorCode + this.operationName + this.httpStatusCode + this.messageId;
      }
    },
    error = function (props) {
      var err = app.utils.extend(Object.create(errorProtoType), props);
      errorCollection[err.errorId()] = err;
      return err;
    },
    getError = function (Id) {
      return errorCollection[Id];
    },
    init = function () {
      return {
        newError: error,
        getError: getError
      };
    };
  module.MODULES = {
    APP_CONFIG: 'APP-CFG',
    DHS: 'DHS',
    EVENT_CHANNEL: 'EVT-CHL',
    PEER_CONNECTION: 'PCN-SRV',
    USER_MEDIA: 'USR-SRV',
    RESOURCE_MGR: 'RES-MGR',
    RTC_EVENT: 'RTC-EVT',
    SIGNALING: 'SIG-SRV',
    SDP_FILTER: 'SDP-FLT',
    CALL_MGR: 'CALL-MGR'
  };
  module.MODULES = Object.freeze(module.MODULES);

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };
  //Add to main namespace
  app.errorDictionary = module;

}(ATT || {}));