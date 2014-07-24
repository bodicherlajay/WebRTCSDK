/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, errorDictionary, describe, it, expect, afterEach: true, beforeEach: true*/

describe('ErrorDictionaryModule', function () {
  "use strict";
  var backupAtt;
  beforeEach(function () {
    backupAtt = ATT;
  });

  describe('Application Object', function () {
    it('should have factory method at ATT.utils', function () {
      expect(ATT.utils.createErrorDictionary).to.be.a('function');
    });
  });

  describe('Error Dictionary Object', function () {
    var errorDictionary,
      dictionarySpec,
      errorSpec;

    beforeEach(function () {
      dictionarySpec = {
        modules: {
          M1: 'Module1',
          M2: 'Module2',
          M3: 'Module3',
          RTC: 'RTC Module'
        }
      };
      errorSpec = {
        JSObject: "ATT.rtc",
        JSMethod: "login",
        ErrorCode: 2500,
        ErrorMessage: "Any Service Error in the SB enabler components.",
        PossibleCauses: "Error Explanation covers the reason.",
        PossibleResolution: "Use the explanation to find the reason for failure.",
        APIError: "SVC0001: A service error has occurred. Error code is <error_explanation>",
        ResourceMethod: "POST /RTC/v1/sessions",
        HttpStatusCode: 400,
        MessageId:"SVC0001"
      };
      // Initialize the dictionary
      errorDictionary = ATT.utils.createErrorDictionary(dictionarySpec, ATT.utils);
    });

    it('should return valid Error Dictionary', function () {
      expect(errorDictionary).to.be.an('object');
    });

    it('should return previously created error', function () {
      var err = errorDictionary.createError(errorSpec);
      expect(errorDictionary.getError(err.getId())).to.be.an('object');
    });

    describe('Error Object', function () {
      it('should generate correct ID, add the error into API Errors, discoverable by error id and operation', function () {
        var err = errorDictionary.createError(errorSpec);
        expect(err.getId()).to.equal(2500);
        expect(errorDictionary.getError(err.getId()));
        expect(errorDictionary.getAPIError(errorSpec.JSMethod,errorSpec.HttpStatusCode+ errorSpec.MessageId));
      });

      it('should format error messages properly', function () {
        var err = errorDictionary.createError(errorSpec);
        expect(err.formatError()).to.equal('ATT.rtc-login-2500-Any Service Error in the SB enabler components.-Error Explanation covers the reason.-Use the explanation to find the reason for failure.-SVC0001: A service error has occurred. Error code is <error_explanation>-POST /RTC/v1/sessions-400-SVC0001');
      });

      it('should return SDK error object', function () {
        var err = errorDictionary.getSDKError('15002');
        expect(err.JSObject).to.equal('ATT.rtc.Phone');
        expect(err.JSMethod).to.equal('*');
        expect(err.ErrorCode).to.equal('15002');
        expect(err.ErrorMessage).to.equal('Event Channel got shutdown unexpectedly');
        expect(err.Cause).to.equal('Event Channel stopped. Please logout and login again.');
        expect(err.Resolution).to.equal('Please login again');
      });

      it('should return API error object', function () {
        var err = errorDictionary.getAPIError('login',400,"SVC0001");
        expect(err.JSObject).to.equal('ATT.rtc');
        expect(err.JSMethod).to.equal('login');
        expect(err.HttpStatusCode).to.equal(400);
        expect(err.MessageId).to.equal("SVC0001");
      });

      it('should return APIException error', function() {
        var error = {
          JSObject:"",        //JS Object
          JSMethod:"",       //JS Method
          ErrorCode: '600',         //Error code
          ErrorMessage: '',         //Error Message
          PossibleCauses: 'Please look into APIError message',       //Possible Causes
          PossibleResolution: 'Please look into APIError message',   //Possible Resolution
          APIError: "",          //API Error response
          ResourceMethod: '',       //Resource URI
          HttpStatusCode:500,     //HTTP Status Code
          MessageId:''           //Message ID
        }
        error = ATT.errorDictionary.getAPIExceptionError(error);
      });

      it ('should return APIError object given API Service Exception Error response', function() {
        var errorResponse = {
          getJson: function() {
            return {
              RequestError: {
                ServiceException: {
                  MessageId:'SVC0001',
                  Text:"Error occurred",
                  Variables: ''
                }
              }
            };
          },
          getResponseStatus: function() { return 400;},
          getResourceURL: function() { return "GET /RTC/v1/Sessions"}
        }, errorObj, apiErrorObj;
        apiErrorObj = ATT.errorDictionary.getAPIError("login",400,"SVC0001");
        errorObj = ATT.Error.create(errorResponse,"login","RTC");
        expect(errorObj.ErrorCode).to.equal(apiErrorObj.ErrorCode);
        expect(errorObj.APIError).to.equal("SVC0001:Error occurred,Variables=");
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
      });

      it ('should return APIError object given API Policy Exception Error response', function() {
        var errorResponse = {
          getJson: function() {
            return {
              RequestError: {
                PolicyException: {
                  MessageId:'POL0001',
                  Text:"Error occurred",
                  Variables: ''
                }
              }
            };
          },
          getResponseStatus: function() { return 401;},
          getResourceURL: function() { return "GET /RTC/v1/Sessions"}
        }, errorObj, apiErrorObj;
        apiErrorObj = ATT.errorDictionary.getAPIError("login",401,"POL0001");
        errorObj = ATT.Error.create(errorResponse,"login","RTC");
        expect(errorObj.ErrorCode).to.equal(apiErrorObj.ErrorCode);
        expect(errorObj.APIError).to.equal("POL0001:Error occurred,Variables=");
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
      });

      it ('should return APIError object given API Exception Error response', function() {
        var errorResponse = {
          getJson: function() {
            return {
              RequestError: {
                Exception: {
                  Text:"Error occurred"
                }
              }
            };
          },
          getResponseStatus: function() { return 401;},
          getResourceURL: function() { return "GET /RTC/v1/Sessions"}
        }, errorObj;
        errorObj = ATT.Error.create(errorResponse,"login","RTC");
        expect(errorObj.ErrorCode).to.equal(401);
        expect(errorObj.APIError).to.equal("Error occurred");
        expect(errorObj.PossibleCauses).to.equal("Please look into APIError message");
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
      });

      it ('should return APIError object given 500 error code no error response in payload', function() {
        var errorResponse = {
          getJson: function() {
            return "{error response}";
          },
          getResponseStatus: function() { return 500;},
          getResourceURL: function() { return "GET /RTC/v1/Sessions"}
        }, errorObj;
        errorObj = ATT.Error.create(errorResponse,"login","RTC");
        expect(errorObj.ErrorCode).to.equal(500);
        expect(errorObj.APIError).to.equal(JSON.stringify(errorResponse.getJson()));
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
      });

      it ('should return APIError object for DHS Module when there is no JSON response', function() {
        var errorResponse = {
          getJson: function() {
            return "";
          },
          getResponseStatus: function() { return 401;},
          getResourceURL: function() { return "GET /RTC/v1/Sessions"},
          responseText: "dhs response"
        }, errorObj;
        errorObj = ATT.Error.create(errorResponse,"login","DHS");
        expect(errorObj.ErrorCode).to.equal("DHS-0001");
        expect(errorObj.APIError).to.equal(errorResponse.responseText);
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
      });

      it ('should return APIError object for DHS Module when JSON response is present', function() {
        var errorResponse = {
          getJson: function() {
            return "{error_response}";
          },
          getResponseStatus: function() { return 500;},
          getResourceURL: function() { return "GET /RTC/v1/Sessions"},
          responseText: "dhs response"
        }, errorObj;
        errorObj = ATT.Error.create(errorResponse,"login","DHS");
        expect(errorObj.ErrorCode).to.equal("DHS-0001");
        expect(errorObj.APIError).to.equal(JSON.stringify(errorResponse.getJson()));
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
      });

      it ('should return APIError object given API Error object not found in dictionary', function() {
        var errorResponse = {
          getJson: function() {
            return {
              RequestError: {
                PolicyException: {
                  MessageId:'POL0001-xxxx',
                  Text:"Error occurred",
                  Variables: ''
                }
              }
            };
          },
          getResponseStatus: function() { return 401;},
          getResourceURL: function() { return "GET /RTC/v1/Sessions"}
        }, errorObj;
        errorObj = ATT.Error.create(errorResponse,"login","RTC");
        console.log(errorObj);
        expect(errorObj.ErrorCode).to.equal("UNKNOWN-00001");
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
      });

    });
  });

  afterEach(function () {
    ATT = backupAtt;
  });
});