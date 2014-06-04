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
    expect(ATT.phoneNumber.parse).to.be.a('function');
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

  it('stringify4', function () {
    var number = 'b123456790a';
    expect(ATT.phoneNumber.stringify(number)).to.equal('233333333333333351234567902');
  });

  it('stringify5', function () {
    var number = '723';
    expect(ATT.phoneNumber.stringify(number)).to.equal('723');
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
});
