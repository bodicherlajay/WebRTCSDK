/*jslint indent:2*/
/*global assert, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, console, window*/

describe('RTC Event Module Tests', function () {
  'use strict';

  var backupAtt;
  beforeEach(function () {
    backupAtt = window.ATT;
  });

  afterEach(function () {
    window.ATT = backupAtt;
  });

  describe('RTCEventModule', function () {
    it('should exist', function () {
      assert.ok(ATT.RTCEvent);
    });
  });
});