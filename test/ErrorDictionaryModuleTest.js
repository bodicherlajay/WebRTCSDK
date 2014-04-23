/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, errorDictionary:true, describe:true, it: true, expect: true*/

describe('ErrorDictionaryModule', function () {
  "use strict";
  var errorDictionary = ATT.errorDictionary.getInstance();
  it('should exist', function () {
    expect(errorDictionary).to.be.an('object');
  });

  it('should create new error, format error message', function () {
    var err = errorDictionary.newError({userErrorCode: '00000',    //5 digit error code
      operationName: 'Create Session',    //Name of the REST operation
      httpStatusCode: '400',   //HTTP Status code
      messageId: 'SVC0002',        //SVC or POL Error
      helpText: 'One or more of the input parameters are not valid for this operation',         //Help text which can be displayed on UI
      reasonText: 'invalidinput',       //High level reason text, invalid input, forbidden
      errorDescription: 'Request payload does not conform as documented', //Error Description
      moduleID: 'RTC'          //one of the configured module name
      });
    expect(err.formatError()).to.equal('RTC-00000-Create Session-400-SVC0002-invalidinput-Request payload does not conform as documented');
    expect(err.errorId()).to.equal('RTC00000Create Session400SVC0002');
    expect(errorDictionary.getError(err.errorId()).reasonText).to.equal('invalidinput');
  });
});