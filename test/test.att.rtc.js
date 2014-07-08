/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect, xit, assert, after*/


describe.only('ATT.rtc', function () {
  'use strict';

  it('should export ATT.rtc', function () {
    expect(ATT.rtc).to.be.an('object');
  });

  describe('getConfiguration', function () {
    it('should exist', function () {
      expect(ATT.rtc.getConfiguration).to.be.a('function');
    });
    it('should return an object', function () {
      expect(ATT.rtc.getConfiguration()).to.be.a('object');
    });
  });
  describe('configure', function () {

    var rtc;

    beforeEach(function () {
      rtc = ATT.rtc;
    });

    it('should exist', function () {
      expect(ATT.rtc.configure).to.be.a('function');
    });


    it('should throw an error if `options.key` is not recognized', function () {

      expect(ATT.rtc.configure.bind(rtc, undefined)).to.not.throw('Environment not recognized');
      expect(ATT.rtc.configure.bind(rtc, {})).to.not.throw('Environment not recognized');

      expect(ATT.rtc.configure.bind(rtc, {key: 'invalid'})).to.throw('Environment not recognized');

      expect(ATT.rtc.configure.bind(rtc, {key: 'AMS'})).to.not.throw('Environment not recognized');
      expect(ATT.rtc.configure.bind(rtc, {key: 'F6UAT'})).to.not.throw('Environment not recognized');
      expect(ATT.rtc.configure.bind(rtc, {key: 'F3UAT'})).to.not.throw('Environment not recognized');
      expect(ATT.rtc.configure.bind(rtc, {key: 'PROD'})).to.not.throw('Environment not recognized');
    });

    it('should set the current environment', function () {
      var options = { key : 'AMS'},
        currentConfig;

      rtc.configure(options);
      currentConfig = rtc.getConfiguration();

      expect(currentConfig.environment).to.equal('AMS');
    });

    it('should return default values if empty parameters are passed', function () {
      var currentConfig;

      rtc.configure({});
      currentConfig = ATT.rtc.getConfiguration();

      expect(currentConfig.environment).to.equal('PROD');
      expect(currentConfig.useWebSockets).to.equal(false);
    });

    it('should set way to consume events from the event channel', function () {
      var options = { useWebSockets: true },
        currentConfig;

      rtc.configure({key : 'AMS'});
      currentConfig = rtc.getConfiguration();
      expect(currentConfig.useWebSockets).to.equal(false);

      rtc.configure(options);
      currentConfig = rtc.getConfiguration();

      expect(currentConfig.useWebSockets).to.equal(true);
    });
  });

});
