/*jslint indent:2*/
/*global assert,cmgmt, event, ATT, describe, it, xit, afterEach, beforeEach, before, sinon, expect, console, window*/

describe('Event Dispatcher Tests', function () {
  'use strict';

  var backupAtt,
    utils = ATT.utils,
    eventRegistry,
    onSessionReady,
    event = {},
    data = {},
    RTCEventModule = ATT.RTCEvent.getInstance();

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
          }
        };
      }
    };

    function SessionContext(token, e9Id, sessionId, state) {
      var currState = state, callObject = null,
        accessToken = token, e911Id = e9Id, currSessionId = sessionId,
        currentCallId, UICbks = {}, currentCall = null;
      return {
        getCurrentCall: function () {
          return currentCall;
        },
        setCurrentCall: function (callObj) {
          currentCall = callObj;
        },
        getAccessToken: function () {
          return accessToken;
        },
        setAccessToken: function (token) {
          accessToken = token;
        },
        getE911Id: function () {
          return e911Id;
        },
        setE911Id: function (id) {
          e911Id = id;
        },
        getSessionId: function () {
          return currSessionId;
        },
        setSessionId: function (id) {
          currSessionId = id;
        },
        getCallState: function () {
          return currState;
        },
        setCallState: function (state) {
          currState = state;
        },
        getCallObject: function () {
          return callObject;
        },
        setCallObject: function (callObj) {
          callObject = callObj;
        },
        getEventObject: function () {
          return event;
        },
        setEventObject: function (eventObject) {
          event = eventObject;
        },
        setUICallbacks: function (callbacks) {
          UICbks = ATT.utils.extend(UICbks, callbacks);
        },
        getUICallbacks: function () {
          return UICbks;
        },
        setCurrentCallId: function (event) {
          currentCallId = event.split('/')[6] || null;
        },
        getCurrentCallId: function () {
          return currentCallId;
        }
      };
    }


    it('should not create a registry if called without callbacks', function () {
      var badContext = {
        getUICallbacks: function () { return; }
      };
      eventRegistry = utils.createEventRegistry(badContext, RTCEventModule);
      assert.notOk(eventRegistry);
    });

    it('should create a registry if called with callbacks', function () {
      eventRegistry = utils.createEventRegistry(goodContext, RTCEventModule);
      assert.ok(eventRegistry);
    });

    it('should invoke onSessionReady when RTC_SESSION_CREATED happens', function () {
      onSessionReady = false;
      eventRegistry = utils.createEventRegistry(goodContext, RTCEventModule);
      eventRegistry[ATT.SessionEvents.RTC_SESSION_CREATED](event);
      assert.isTrue(onSessionReady);
    });

    it('should invoke onError when RTC_SESSION_ERROR happens', function () {
      var context = new SessionContext("token", "e911id", ATT.RTCCallEvents.RTC_SESSION_ERROR), called = false;
      context.setUICallbacks({onError: function () { called = true; }});
      eventRegistry = utils.createEventRegistry(context, RTCEventModule, cmgmt.CallManager.getInstance(), ATT.PeerConnectionService);
      event = {reason: '', state: 'foo'};
      eventRegistry[ATT.SessionEvents.RTC_SESSION_ERROR](event);
      assert.isTrue(called);
    });

    it('should invoke onCallInProgress when CALL_IN_PROGRESS happens', function () {
      var callMgr = sinon.stub(), peerConn = sinon.stub(), called = false,
        context = new SessionContext("token", "e911id", ATT.RTCCallEvents.CALL_IN_PROGRESS);
      context.setUICallbacks({onCallInProgress: function () { called = true; }});
      eventRegistry = utils.createEventRegistry(context, RTCEventModule, callMgr, peerConn);
      eventRegistry[ATT.RTCCallEvents.CALL_IN_PROGRESS]({calltype: "", codec: ""});
      assert.isTrue(called);

    });

    xit('should invoke onCallEnded when SESSION_TERMINATED happens WITHOUT event.reason', function () {
      var context = new SessionContext("token", "e911id", ATT.RTCCallEvents.SESSION_TERMINATED), called = false;
      context.setUICallbacks({onCallEnded: function () { called = true; }});
      eventRegistry = utils.createEventRegistry(context, RTCEventModule, cmgmt.CallManager.getInstance(), ATT.PeerConnectionService);
      event = {reason: ''};
      eventRegistry[ATT.RTCCallEvents.SESSION_TERMINATED](event);
      assert.isTrue(called);
    });

    it('should invoke onIncomingCall when INVITATION_RECEIVED happens', function () {
      var context = new SessionContext("token", "e911id", ATT.RTCCallEvents.INVITATION_RECEIVED), called = false;
      context.setUICallbacks({onIncomingCall: function () { called = true; }});
      eventRegistry = utils.createEventRegistry(context, RTCEventModule, cmgmt.CallManager.getInstance(), ATT.PeerConnectionService);
      event = {sdp: 'sendonly', from: '@mc:hammer'};
      eventRegistry[ATT.RTCCallEvents.INVITATION_RECEIVED](event);
      assert.isTrue(called);
    });

    it('should invoke onConnecting when CALL_CONNECTING happens', function () {
      var context = new SessionContext("token", "e911id", ATT.RTCCallEvents.CALL_CONNECTING), called = false;
      context.setUICallbacks({onConnecting: function () { called = true; }});
      eventRegistry = utils.createEventRegistry(context, RTCEventModule, cmgmt.CallManager.getInstance(), ATT.PeerConnectionService);
      eventRegistry[ATT.RTCCallEvents.CALL_CONNECTING](event);
      assert.isTrue(called);
    });

    it('should invoke onCallEstablished when SESSION_OPEN happens', function () {
      var context = new SessionContext("token", "e911id", ATT.RTCCallEvents.SESSION_OPEN), called = false;
      context.setUICallbacks({onCallEstablished: function () { called = true; }});
      eventRegistry = utils.createEventRegistry(context, RTCEventModule, cmgmt.CallManager.getInstance(), ATT.PeerConnectionService);
      event = {from: 'foo'};
      eventRegistry[ATT.RTCCallEvents.SESSION_OPEN](event, data);
      assert.isTrue(called);
    });

    it('should invoke onCallError when UNKNOWN happens', function () {
      var context = new SessionContext("token", "e911id", ATT.RTCCallEvents.UNKNOWN), called = false;
      context.setUICallbacks({onCallError: function () { called = true; }});
      eventRegistry = utils.createEventRegistry(context, RTCEventModule, cmgmt.CallManager.getInstance(), ATT.PeerConnectionService);
      eventRegistry[ATT.RTCCallEvents.UNKNOWN](event);
      assert.isTrue(called);
    });
  });
});
