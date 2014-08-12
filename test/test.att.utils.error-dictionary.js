/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 250 */
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
        MessageId: "SVC0001"
      };

    beforeEach(function () {
      // Initialize the dictionary
      errorDictionary = ATT.errorDictionary;
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
        expect(errorDictionary.getAPIError(errorSpec.JSMethod, errorSpec.HttpStatusCode, errorSpec.MessageId));
      });

      it('should format error messages properly', function () {
        var err = errorDictionary.createError(errorSpec), expectedErr = '';
        expectedErr += 'ATT.rtc-login-2500-Any Service Error in the SB enabler components.-Error Explanation covers the reason.-';
        expectedErr += 'Use the explanation to find the reason for failure.-SVC0001: A service error has occurred. Error code is <error_explanation>-POST /RTC/v1/sessions-400-SVC0001';
        expect(err.formatError()).to.equal(expectedErr);
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

      it('should return API error object for login method', function () {
        var err = errorDictionary.getAPIError('login', 400, "SVC0001");
        expect(err.JSObject).to.equal('ATT.rtc');
        expect(err.JSMethod).to.equal('login');
        expect(err.HttpStatusCode).to.equal(400);
        expect(err.MessageId).to.equal("SVC0001");
      });

      it('should return API error object for login method when method name passed as `*`', function () {
        var err = errorDictionary.getAPIError('*', 400, "SVC0001");
        expect(err.JSObject).to.equal('ATT.rtc');
        expect(err.JSMethod).to.equal('login');
        expect(err.HttpStatusCode).to.equal(400);
        expect(err.MessageId).to.equal("SVC0001");
      });

      it('should return APIError object given API Service Exception Error response', function () {
        var errorResponse = {
          getJson: function () {
            return {
              RequestError: {
                ServiceException: {
                  MessageId: 'SVC0001',
                  Text: "Error occurred",
                  Variables: ''
                }
              }
            };
          },
          getResponseStatus: function () { return 400; },
          getResourceURL: function () { return "GET /RTC/v1/Sessions"; }
        }, errorObj, apiErrorObj;
        apiErrorObj = ATT.errorDictionary.getAPIError("login", 400, "SVC0001");
        errorResponse.errorDetail = ATT.Error.parseAPIErrorResponse(errorResponse);
        errorObj = ATT.Error.createAPIErrorCode(errorResponse, "ATT.rtc", "login", "RTC");
        expect(errorObj.ErrorCode).to.equal(apiErrorObj.ErrorCode);
        expect(errorObj.APIError).to.equal("SVC0001:Error occurred,Variables=");
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
        expect(errorObj.ErrorMessage).to.have.string('login failed');
      });

      it('should return APIError object given API Policy Exception Error response', function () {
        var errorResponse = {
          getJson: function () {
            return {
              RequestError: {
                PolicyException: {
                  MessageId: 'POL0001',
                  Text: "Error occurred",
                  Variables: ''
                }
              }
            };
          },
          getResponseStatus: function () { return 401; },
          getResourceURL: function () { return "GET /RTC/v1/Sessions"; }
        }, errorObj, apiErrorObj;
        apiErrorObj = ATT.errorDictionary.getAPIError("login", 401, "POL0001");
        errorResponse.errorDetail = ATT.Error.parseAPIErrorResponse(errorResponse);
        errorObj = ATT.Error.createAPIErrorCode(errorResponse, "ATT.rtc", "login", "RTC");
        expect(errorObj.ErrorCode).to.equal(apiErrorObj.ErrorCode);
        expect(errorObj.APIError).to.equal("POL0001:Error occurred,Variables=");
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
        expect(errorObj.ErrorMessage).to.have.string('login failed');
      });

      it('should return APIError object given API Exception Error response', function () {
        var errorResponse = {
          getJson: function () {
            return {
              RequestError: {
                Exception: {
                  Text: "Error occurred",
                  MessageId: ""
                }
              }
            };
          },
          getResponseStatus: function () { return 401; },
          getResourceURL: function () { return "GET /RTC/v1/Sessions"; }
        }, errorObj;
        errorResponse.errorDetail = ATT.Error.parseAPIErrorResponse(errorResponse);
        errorObj = ATT.Error.createAPIErrorCode(errorResponse, "ATT.rtc", "login", "RTC");
        expect(errorObj.ErrorCode).to.equal("RTC-UNKNOWN");
        expect(errorObj.APIError).to.equal(":Error occurred,Variables=undefined");
        expect(errorObj.PossibleCauses).to.equal("Please look into APIError");
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
        expect(errorObj.ErrorMessage).to.have.string('login failed');
      });

      it('should return APIError object given 500 error code no error response in payload', function () {
        var errorResponse = {
          getJson: function () {
            return "{error response}";
          },
          getResponseStatus: function () { return 500; },
          getResourceURL: function () { return "GET /RTC/v1/Sessions"; }
        }, errorObj;
        errorResponse.errorDetail = ATT.Error.parseAPIErrorResponse(errorResponse);
        errorObj = ATT.Error.createAPIErrorCode(errorResponse, "ATT.rtc", "login", "RTC");
        expect(errorObj.ErrorCode).to.equal(500);
        expect(errorObj.APIError).to.equal(JSON.stringify(errorResponse.getJson()));
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
        expect(errorObj.ErrorMessage).to.have.string('login failed');
      });

      it('should return APIError object for DHS Module when there is no JSON response', function () {
        var errorResponse = {
          getJson: function () {
            return "";
          },
          getResponseStatus: function () { return 401; },
          getResourceURL: function () { return "GET /RTC/v1/Sessions"; },
          responseText: "dhs response"
        }, errorObj;
        errorResponse.errorDetail = ATT.Error.parseAPIErrorResponse(errorResponse);
        errorObj = ATT.Error.createAPIErrorCode(errorResponse, "ATT.rtc", "login", "DHS");
        expect(errorObj.ErrorCode).to.equal("DHS-UNKNOWN");
        expect(errorObj.APIError).to.equal(errorResponse.responseText);
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
        expect(errorObj.ErrorMessage).to.have.string('login failed');
      });

      it('should return APIError object for DHS Module when JSON response is present', function () {
        var errorResponse = {
          getJson: function () {
            return "{error_response}";
          },
          getResponseStatus: function () { return 500; },
          getResourceURL: function () { return "GET /RTC/v1/Sessions"; },
          responseText: "dhs response"
        }, errorObj;
        errorResponse.errorDetail = ATT.Error.parseAPIErrorResponse(errorResponse);
        errorObj = ATT.Error.createAPIErrorCode(errorResponse, "ATT.rtc", "login", "DHS");
        expect(errorObj.ErrorCode).to.equal(500);
        expect(errorObj.APIError).to.equal(JSON.stringify(errorResponse.getJson()));
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
        expect(errorObj.ErrorMessage).to.have.string('login failed');
      });

      it('should return APIError object given API Error object not found in dictionary', function () {
        var errorResponse = {
          getJson: function () {
            return {
              RequestError: {
                PolicyException: {
                  MessageId: 'POL0001-xxxx',
                  Text: "Error occurred",
                  Variables: ''
                }
              }
            };
          },
          getResponseStatus: function () { return 401; },
          getResourceURL: function () { return "GET /RTC/v1/Sessions"; }
        }, errorObj;
        errorResponse.errorDetail = ATT.Error.parseAPIErrorResponse(errorResponse);
        errorObj = ATT.Error.createAPIErrorCode(errorResponse, "ATT.rtc", "login", "DHS");
        expect(errorObj.ErrorCode).to.equal("DHS-UNKNOWN");
        expect(errorObj.ResourceMethod).to.equal(errorResponse.getResourceURL());
        expect(errorObj.ErrorMessage).to.have.string('login failed');
      });

    });
  });

  afterEach(function () {
    ATT = backupAtt;
  });
});
