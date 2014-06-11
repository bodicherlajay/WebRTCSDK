/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, assert: true, xit: true, URL: true*/

describe('rtc Management', function () {
  'use strict';


  describe('cleanPhoneNumber public method test  ', function () {
    it('should convert alpha numeric to number ', function () {
      var number = '425-080-FEDX';
      expect(ATT.rtc.Phone.cleanPhoneNumber(number)).to.equal('14250803339');
    });

    it('should be able to call 911', function () {
      var number = '911';
      expect(ATT.rtc.Phone.cleanPhoneNumber(number)).to.equal('911');
    });

    it('should be able to  *69', function () {
      var number = '*69';
      expect(ATT.rtc.Phone.cleanPhoneNumber(number)).to.equal('*69');
    });

    it('should remove all the special character and return dialable number', function () {
      var number = '451**(123*(5627';
      expect(ATT.rtc.Phone.cleanPhoneNumber(number)).to.equal('14511235627');
    });

    it('should remove only spaces from a number', function () {
      var number = '45 1 123 562 7';
      expect(ATT.rtc.Phone.cleanPhoneNumber(number)).to.equal('14511235627');
    });

    it('should be able to remove spaces and special characters ', function () {
      var number = '451** (123 5627';
      expect(ATT.rtc.Phone.cleanPhoneNumber(number)).to.equal('14511235627');
    });

    it('should be able to remove spaces and extra number if its >11 ', function () {
      var number = '451123 275623434233237';
      expect(ATT.rtc.Phone.cleanPhoneNumber(number)).to.equal('14511232756');
    });
  });

  describe('formatNumber public method test  ', function () {
    it('should convert ten digit number to a formated number ', function () {
      var number = '425-080-FEDX';
      expect(ATT.rtc.Phone.formatNumber(number)).to.equal('1 (425) 080-3339');
    });

    it('should be able to format 911', function () {
      var number = '911';
      expect(ATT.rtc.Phone.formatNumber(number)).to.equal('911');
    });

    it('should be able to format *69', function () {
      var number = '*69';
      expect(ATT.rtc.Phone.formatNumber(number)).to.equal('*69');
    });

    it('should return a format number after removing special character', function () {
      var number = '451**(123*(5627';
      expect(ATT.rtc.Phone.formatNumber(number)).to.equal('1 (451) 123-5627');
    });

    it('should format and remove  spaces from a number', function () {
      var number = '45 1 123 562 7';
      expect(ATT.rtc.Phone.formatNumber(number)).to.equal('1 (451) 123-5627');
    });

    it('should be format , remove spaces and special characters ', function () {
      var number = '451** (123 5627';
      expect(ATT.rtc.Phone.formatNumber(number)).to.equal('1 (451) 123-5627');
    });

    it('should be able to format, remove spaces and extra number if its >11 ', function () {
      var number = '451123 275623434233237';
      expect(ATT.rtc.Phone.formatNumber(number)).to.equal('1 (451) 123-2756');
    });
  });
});