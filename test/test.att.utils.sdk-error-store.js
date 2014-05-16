/*jslint indent:2*/
/*global ATT, describe, it, afterEach, beforeEach, sinon, expect*/

describe('SDK Error Store', function () {
  'use strict';

  it('should export ATT.utils.SDKErrorStore', function () {
    expect(ATT.utils.SDKErrorStore).to.be.an('object');
  });

  describe('SDKErrorStore.getAllErrors', function () {

    var SDKErrorStore;
    beforeEach(function () {
      SDKErrorStore = ATT.utils.SDKErrorStore;
    });

    it('should return an immutable array of error objects', function () {
      var errors = SDKErrorStore.getAllErrors(),
        oldValue;

      expect(errors).to.be.an('Array');
      expect(errors.length > 0).to.equal(true);

      // try to modify an error
      oldValue = errors[0].userErrorCode;

      function changeValue() {
        errors[0].userErrorCode = 'new value';
      }
      expect(changeValue).to.throw(/Cannot assign to read only property/);
      expect(errors[0].userErrorCode).to.equal(oldValue);
    });
  });
});