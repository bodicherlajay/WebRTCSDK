/*jslint indent:2*/
/*global assert, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, window*/

describe('Event Dispatcher Tests', function () {
  'use strict';

  var backupAtt, utils = ATT.utils;
  beforeEach(function () {
    backupAtt = window.ATT;
  });

  afterEach(function () {
    window.ATT = backupAtt;
  });

  describe('Event registry', function () {
    it('should have a createEventRegistry method', function () {
      assert.isFunction(utils.createEventRegistry);
    });
  });
});