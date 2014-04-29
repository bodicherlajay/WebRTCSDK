/*jslint indent:2*/
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect*/

describe.only('Main Integration Tests', function () {
  'use strict';

  describe('ATT.errorDictionary', function () {
    it('should exist', function () {
      expect(ATT.errorDictionary).to.be.an('object');
    });
  });
  describe('ATT.eventChannel', function () {
    it('should exist', function () {
      expect(ATT.eventChannel).to.be.an('object');
    });
  });
});