/*jslint indent:2*/
/*global assert, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, console, window*/

describe.only('RTC Event Module Tests', function () {
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

    it("should create Event", function () {
      var event = ATT.RTCEvent.getInstance().createEvent("from", "to", ATT.CallStatus.CALLING, "");
      assert.ok(event);
      expect(event.from).equals("from");
      expect(event.to).equals("to");
      expect(event.state).equals(ATT.CallStatus.CALLING);
      assert.isNotNull(event.timeStamp);
    });

    it("should generate error if call state does not match ATT.CallStatus type", function () {
      try {
        ATT.RTCEvent.getInstance().createEvent("from", "to", "", "");
      } catch (e) {
        expect(e).equal(new Error("State must be of type ATT.CallStatus"));
      }
    });

  });
});