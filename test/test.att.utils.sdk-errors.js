/*jslint indent:2*/
/*global ATT, describe, it, afterEach, before, beforeEach, sinon, expect*/

describe('SDK Error Store', function () {
  'use strict';

  it('should export ATT.utils.SDKErrorStore', function () {
    expect(ATT.utils.ErrorStore.SDKErrors).to.be.an('object');
  });

  describe('SDKErrorStore.getAllErrors', function () {

    var SDKErrorStore,
      errors;

    before(function () {
      SDKErrorStore = ATT.utils.ErrorStore.SDKErrors;
      errors = SDKErrorStore.getAllSDKErrors();
    });

    it('should return an immutable array', function () {
      expect(Object.isFrozen(errors)).to.equal(true);
    });

    it('should return frozen error objects inside the array');
  });
});
