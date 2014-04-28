/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, errorDictionary, describe, it, expect, beforeEach*/

describe.only('ErrorDictionaryModule', function () {
  "use strict";

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
        userErrorCode: '00000',    //5 digit error code
        operationName: 'Create Session',    //Name of the REST operation
        httpStatusCode: '400',   //HTTP Status code
        messageId: 'SVC0002',        //SVC or POL Error
        helpText: 'One or more of the input parameters are not valid for this operation',         //Help text which can be displayed on UI
        reasonText: 'invalidinput',       //High level reason text, invalid input, forbidden
        errorDescription: 'Request payload does not conform as documented', //Error Description
        moduleID: 'RTC'          //one of the configured module name
      };
      // Initialize the dictionary
      errorDictionary = ATT.utils.createErrorDictionary(dictionarySpec, ATT.utils);
    });

    it('should return valid Error Dictionary', function () {
      expect(errorDictionary).to.be.an('object');
    });

    it('should return error object for valid module IDs', function () {
      // Error spec with a valid module
      errorSpec.moduleID = 'M1';
      var err = errorDictionary.createError(errorSpec);
      expect(err).to.be.an('object');
    });

    it('should fail (throw error) when creating an error with an invalid Module IDs', function () {
      errorSpec.moduleID = 'Invalid Module ID';
      expect(errorDictionary.createError.bind(errorDictionary, errorSpec)).to.throw('Invalid Module ID');
    });

    it('should return previously created error', function () {
      var err = errorDictionary.createError(errorSpec);
      expect(errorDictionary.getError(err.getId())).to.be.an('object');
    });

    describe('Error Object', function () {
      it('should generate correct ID', function () {
        var err = errorDictionary.createError(errorSpec);
        expect(err.getId()).to.equal('RTC00000Create Session400SVC0002');
      });

      it('should format error messages properly', function () {
        var err = errorDictionary.createError(errorSpec);
        expect(err.formatError()).to.equal('RTC-00000-Create Session-400-SVC0002-invalidinput-Request payload does not conform as documented');
      });
    });
  });
});