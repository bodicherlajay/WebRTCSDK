/*jslint indent:2*/

(function () {
  'use strict';
  function Phone() {
      // ===================
    // Call interface
    // ===================
    this.on = function () {};
    this.getSession = function () {};
    this.setSession = function () {};
    this.login = function () {};
    this.logout = function () {};
    this.dial = function () {};
    this.addCall = function () {};
    this.answer = function () {};
    this.mute = function () {};
    this.unmute = function () {};
    this.getMediaType = function () {};
    this.isCallInProgress = function () {};
    this.hangup = function () {};
    this.hold = function () {};
    this.resume = function () {};
    this.move = function () {};
    this.cancel = function () {};
    this.reject = function () {};
    this.updateE911Id = function () {};
    this.cleanPhoneNumber = function (number) {
      return number;
    };
    this.formatNumber = function (number) {
      return number;
    };

    // ===================
    // Conference interface
    // ===================
    this.startConference = function () {};
    this.endConference = function () {};
    this.joinConference = function () {};
    this.rejectConference = function () {};
    this.addParticipant = function () {};
    this.addParticipants = function () {};
    this.getParticipants = function (list) {
      return list;
    };
    this.removeParticipant = function () {};

    // ==================
    // Utility methods
    // ===================
    this.getCalls = function (calls) {
      return calls;
    }
  }

  function fakeRTC(rtc) {
    var fRTC = {
      configure: function () {},
      getConfiguration: function () {
        return {};
      },
      hasWebRTC: function () {
        return true;
      }
    };
    rtc = fRTC
    return fRTC;
  }
  


  function fakePhone(phone) {
    phone = fPhone;
    return fPhone;
  };

  window.fakePhone = fakePhone;
  window.fakeRTC = fakeRTC;
}());