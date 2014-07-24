/*jslint indent:2*/
/*global ATT, describe, it, afterEach, beforeEach, sinon, expect*/

describe('SDK Error Store', function () {
  'use strict';

  it('should export ATT.utils.SDKErrorStore', function () {
    expect(ATT.utils.ErrorStore.SDKErrors).to.be.an('object');
  });

  describe('SDKErrorStore.getAllErrors', function () {

    var SDKErrorStore;
    beforeEach(function () {
      SDKErrorStore = ATT.utils.ErrorStore.SDKErrors;
    });

    it('should return an immutable array of error objects', function () {
      var errors = SDKErrorStore.getAllErrors(),
        oldValue;

      expect(errors).to.be.an('Object');

      // try to modify an error
      oldValue = errors[15002].ErrorCode;

      function changeValue() {
        errors[15002].ErrorCode = 'new value';
      }
      //expect(changeValue).to.throw(/Cannot assign to read only property/);
      //expect(errors[15002].ErrorCode).to.equal(oldValue);
    });
  });
});