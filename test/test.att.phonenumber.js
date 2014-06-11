/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
before: true, sinon: true, expect: true, xit: true, xdescribe: true*/

describe('ATT.phoneNumber', function () {
  "use strict";

  it('should exist', function () {
    expect(ATT.phoneNumber).to.be.an('object');
  });

  it('should contain ', function () {
    expect(ATT.phoneNumber.stringify).to.be.a('function');
  });

  it('stringify1', function () {
    var number = '12345678900';
    expect(ATT.phoneNumber.stringify(number)).to.equal('1 (234) 567-8900');
  });

  it('stringify2', function () {
    var number = '2345678900';
    expect(ATT.phoneNumber.stringify(number)).to.equal('(234) 567-8900');
  });

  it('stringify3', function () {
    var number = '222222';
    expect(ATT.phoneNumber.stringify(number)).to.equal('222-222');
  });

  xit('stringify4', function () {
    var number = 'b123456790a';
    expect(ATT.phoneNumber.stringify(number)).to.equal('212-345-67902');
  });

  xit('stringify5', function () {
    var number = '723';
    expect(ATT.phoneNumber.stringify(number)).to.equal('723');
  });

  xit('should trim numbers to 11 digits', function () {
    var number = '12345678901';
    expect(ATT.phoneNumber.stringify(number)).to.equal('1234567890');
    number = '1234567#$#$#8901';
    expect(ATT.phoneNumber.stringify(number)).to.equal('1234567890');
    number = '1234567890';
    expect(ATT.phoneNumber.stringify(number)).to.equal('1234567890');
  });

  it('getCallable1', function () {
    var number = '222222',
      countryCode = 'us';
    expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal(false);
  });

  it('getCallable2', function () {
    var number = '1234567890',
      countryCode = 'us';
    expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal('11234567890');
  });

  it('getCallable3', function () {
    var number = '11234567890',
      countryCode = 'us';
    expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal('11234567890');
  });

  it('getCallable3', function () {
    var number = '11234567890',
      countryCode = 'ca';
    expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal(false);
  });

  it('getCallable2', function () {
    var number = '1234567890',
      countryCode = 'us';
    expect(ATT.phoneNumber.getCallable(number, countryCode)).to.equal('11234567890');
  });
});
