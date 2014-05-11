/*jslint indent:2*/
/*global assert, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, console, window*/

describe('Event Dispatcher Tests', function () {
  'use strict';

  var backupAtt, utils = ATT.utils, eventRegistry;
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

  describe('createEventRegistry method', function () {
    it('should not create a registry if called without callbacks', function () {
      var badContext = { getUICallbacks: function () { return; } };
      eventRegistry = utils.createEventRegistry(badContext);
      assert.notOk(eventRegistry);
    });

    it('should create a registry if called with callbacks', function () {
      var goodContext = {
        getUICallbacks: function () {
          return {
            onCallback: function () {
              console.log('Hi! My name is callack!');
            }
          };
        }
      };
      eventRegistry = utils.createEventRegistry(goodContext);
      assert.ok(eventRegistry);
    });
  });
});