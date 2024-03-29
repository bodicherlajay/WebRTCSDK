/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
before: true, sinon: true, expect: true, xit: true, xdescribe: true*/

describe('ATT.phoneNumber', function () {
  'use strict';

  it('should exist', function () {
    expect(ATT.phoneNumber).to.be.an('object');
  });

  it('should contain a stringify method', function () {
    expect(ATT.phoneNumber.stringify).to.be.a('function');
  });

  describe('stringify', function () {
    it('should stringify number `12345678900`', function () {
      var number = '12345678900';
      expect(ATT.phoneNumber.stringify(number)).to.equal('+1 (234) 567-8900');
    });

    it('should stringify number `2345678900`', function () {
      var number = '2345678900';
      expect(ATT.phoneNumber.stringify(number)).to.equal('(234) 567-8900');
    });

    it('should stringify number `222222`', function () {
      var number = '222222';
      expect(ATT.phoneNumber.stringify(number)).to.equal('222-222');
    });
  });

  describe('getCallable', function () {
    it('should return false', function () {
      var number = '222222',
        countryCode = 'us';
      expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal(false);
    });

    it('should return 11234567890', function () {
      var number = '1234567890',
        countryCode = 'us';
      expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal('11234567890');
    });

    it('should return 11234567890', function () {
      var number = '11234567890',
        countryCode = 'us';
      expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal('11234567890');
    });

    it('should return false', function () {
      var number = '11234567890',
        countryCode = 'ca';
      expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal(false);
    });

    it('should return 11234567890', function () {
      var number = '1234567890',
        countryCode = 'us';
      expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal('11234567890');
    });
  });

  describe('cleanPhoneNumber public method test', function () {
    var phone = ATT.rtc.Phone.getPhone();
    it('should exist', function () {
      expect(ATT.phoneNumber.formatNumber).to.be.a('function');
    });

    it('should exist', function () {
      expect(phone.formatNumber).to.be.a('function');
    });

    it('should convert alpha numeric to number', function () {
      var number = '425-080-FEDX';
      expect(phone.cleanPhoneNumber(number)).to.equal('14250803339');
    });

    it('should be able to call 911', function () {
      var number = '911';
      expect(phone.cleanPhoneNumber(number)).to.equal('911');
    });

    it('should be able to call *69', function () {
      var number = '*69';
      expect(phone.cleanPhoneNumber(number)).to.equal('*69');
    });

    it('should remove all the special character and return dialable number', function () {
      var number = '451**(123*(5627';
      expect(phone.cleanPhoneNumber(number)).to.equal('14511235627');
    });

    it('should remove only spaces from a number', function () {
      var number = '45 1 123 562 7';
      expect(phone.cleanPhoneNumber(number)).to.equal('14511235627');
    });

    it('should be able to remove spaces and special characters ', function () {
      var number = '451** (123 5627';
      expect(phone.cleanPhoneNumber(number)).to.equal('14511235627');
    });

    it('should be able to remove spaces and extra number if its >11 ', function () {
      var number = '451123 275623434233237';
      expect(phone.cleanPhoneNumber(number)).to.equal('14511232756');
    });

    it('should be able to remove spaces and extra number if its >11 ', function () {
      var number = '1234567890873';
      expect(phone.cleanPhoneNumber(number)).to.equal('12345678908');
    });
  });

  describe('formatNumber public method test', function () {
    var phone = ATT.rtc.Phone.getPhone();
    it('should exist ', function () {
      expect(ATT.phoneNumber.cleanPhoneNumber).to.be.a('function');
    });

    it('should exist', function () {
      expect(phone.cleanPhoneNumber).to.be.a('function');
    });

    it('should convert ten digit number to a formated number ', function () {
      var number = '425-080-FEDX';
      expect(phone.formatNumber(number)).to.equal('+1 (425) 080-3339');
    });

    it('should be able to format 911', function () {
      var number = '911';
      expect(phone.formatNumber(number)).to.equal('911');
    });

    it('should be able to format *69', function () {
      var number = '*69';
      expect(phone.formatNumber(number)).to.equal('*69');
    });

    it('should return a format number after removing special character', function () {
      var number = '451**(123*(5627';
      expect(phone.formatNumber(number)).to.equal('+1 (451) 123-5627');
    });

    it('should format and remove  spaces from a number', function () {
      var number = '45 1 123 562 7';
      expect(phone.formatNumber(number)).to.equal('+1 (451) 123-5627');
    });

    it('should be format , remove spaces and special characters ', function () {
      var number = '451** (123 5627';
      expect(phone.formatNumber(number)).to.equal('+1 (451) 123-5627');
    });

    it('should be able to format, remove spaces and extra number if its >11 ', function () {
      var number = '451123 275623434233237';
      expect(phone.formatNumber(number)).to.equal('+1 (451) 123-2756');
    });

    it('should be able to remove spaces and extra number if its >11 ', function () {
      var number = '11800333391211212';
      expect(phone.formatNumber(number)).to.equal('+1 (180) 033-3391');
    });

    it('should be able to format a alpha numeric with 1 appended', function () {
      var number = '1800CallFedex';
      expect(phone.formatNumber(number)).to.equal('+1 (800) 225-5333');
    });
  });
});
