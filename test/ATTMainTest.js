/*jslint indent:2*/
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect*/

/** These are the test for `main.js` these are integration tests. 
  * The purpose of which is to make sure that the Assembly process 
  * is correct, that we have all the objects/functions we need to start
  * processing calls.
  *
  * We don't need to test that every method works, because we already have unit tests for each module.
  */

describe.only('Entry Point: SDK Assembly Integration Tests', function () {
  'use strict';

  describe('ATT.errorDictionary', function () {
    it('should exist', function () {
      expect(ATT.errorDictionary).to.be.an('object');
    });
  });
  describe('ATT.eventChannel', function () {
    it('should not exist without session id', function () {
      expect(ATT.eventChannel).to.be.an('undefined');
    });
  });
});