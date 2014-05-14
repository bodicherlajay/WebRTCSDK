/*jslint indent:2*/
/*global assert,cmgmt, event, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, console, window*/

describe.only('Event Dispatcher Tests', function () {
  'use strict';

  var backupAtt, utils = ATT.utils, eventRegistry,
    onSessionReady, onError, onIncomingCall, onConnecting,
    onInProgress, onCallError, onCallEnded, event = {state: 'foo'};
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
    var goodContext = {
      getUICallbacks: function () {
        return {
          onSessionReady: function () {
            onSessionReady = true;
          },
          onError: function () {
            onError = true;
          },
          onCallEnded: function () {
            onCallEnded = true;
          },
          onCallError: function () {
            onCallError = true;
          },
          onIncomingCall: function () {
            onIncomingCall = true;
          },
          onConnecting: function () {
            onConnecting = true;
          },
          onInProgress: function () {
            onInProgress = true;
          }
        };
      }
    };
    it('should not create a registry if called without callbacks', function () {
      var badContext = { getUICallbacks: function () { return; } };
      eventRegistry = utils.createEventRegistry(badContext);
      assert.notOk(eventRegistry);
    });

    it('should create a registry if called with callbacks', function () {
      eventRegistry = utils.createEventRegistry(goodContext);
      assert.ok(eventRegistry);
    });

    it('should invoke onSessionReady when RTC_SESSION_CREATED happens', function () {
      onSessionReady = false;
      eventRegistry = utils.createEventRegistry(goodContext);
      eventRegistry[ATT.SessionEvents.RTC_SESSION_CREATED](event);
      assert.isTrue(onSessionReady);
    });

    it('should invoke onError when RTC_SESSION_ERROR happens', function () {
      onError = false;
      eventRegistry = utils.createEventRegistry(goodContext);
      eventRegistry[ATT.SessionEvents.RTC_SESSION_ERROR](event);
      assert.isTrue(onError);
    });

    it('should invoke onInProgress when SESSION_OPEN happens', function () {
      onInProgress = false;
      eventRegistry = utils.createEventRegistry(goodContext);
      var data = {sdp: 'sendonly'};
      eventRegistry[ATT.RTCCallEvents.SESSION_OPEN](event, data);
      assert.isTrue(onInProgress);
    });

    it('should invoke onCallEnded when SESSION_TERMINATED happens WITHOUT event.reason', function () {
      onCallEnded = false;
      eventRegistry = utils.createEventRegistry(goodContext);
      event = {reason: ''};
      eventRegistry[ATT.RTCCallEvents.SESSION_TERMINATED](event);
      assert.isTrue(onCallEnded);
    });

    it('should invoke onIncomingCall when INVITATION_RECEIVED happens', function () {
      onIncomingCall = false;
      eventRegistry = utils.createEventRegistry(goodContext);
      event = {sdp: 'sendonly', from: '@mc:hammer'};
      eventRegistry[ATT.RTCCallEvents.INVITATION_RECEIVED](event);
      assert.isTrue(onIncomingCall);
    });

    it('should invoke onConnecting when CALL_CONNECTING happens', function () {
      onConnecting = false;
      eventRegistry = utils.createEventRegistry(goodContext);
      eventRegistry[ATT.RTCCallEvents.CALL_CONNECTING](event);
      assert.isTrue(onConnecting);
    });

    it('should invoke onCallError when UNKNOWN happens', function () {
      onCallError = false;
      eventRegistry = utils.createEventRegistry(goodContext);
      eventRegistry[ATT.RTCCallEvents.UNKNOWN](event);
      assert.isTrue(onCallError);
    });
  });
});