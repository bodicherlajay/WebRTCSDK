/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect, xit, assert, after*/


describe('ATT.rtc', function () {
  'use strict';

  it('should export ATT.rtc', function () {
    expect(ATT.rtc).to.be.an('object');
  });

  describe('getConfiguration', function () {
    it('should exist', function () {
      expect(ATT.rtc.getConfiguration).to.be.a('function');
    });
    it('should return an object', function () {
      var currentConfig = ATT.rtc.getConfiguration();
      expect(currentConfig).to.be.a('object');
      expect(currentConfig.environment).to.equal('PROD');
      expect(currentConfig.RTCEndpoint).to.equal('https://api.att.com/RTC/v1');
      expect(currentConfig.DHSEndpoint).to.equal('https://localhost:9001');
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


    it('should throw an error if `options.environment` is not recognized', function () {

      expect(ATT.rtc.configure.bind(rtc, undefined)).to.not.throw('Environment not recognized');
      expect(ATT.rtc.configure.bind(rtc, {})).to.not.throw('Environment not recognized');

      expect(ATT.rtc.configure.bind(rtc, {environment: 'invalid'})).to.throw('Environment not recognized');

      expect(ATT.rtc.configure.bind(rtc, {environment: 'AMS'})).to.not.throw('Environment not recognized');
      expect(ATT.rtc.configure.bind(rtc, {environment: 'F6UAT'})).to.not.throw('Environment not recognized');
      expect(ATT.rtc.configure.bind(rtc, {environment: 'F3UAT'})).to.not.throw('Environment not recognized');
      expect(ATT.rtc.configure.bind(rtc, {environment: 'PROD'})).to.not.throw('Environment not recognized');
    });

    it('should set the current environment', function () {
      var options = { environment : 'AMS'},
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
      var currentConfig;

      rtc.configure({environment : 'AMS',
                     keepAlive: 500 });
      currentConfig = rtc.getConfiguration();
      expect(currentConfig.useWebSockets).to.equal(false);
      expect(currentConfig.keepAlive).to.equal(500);

      rtc.configure({useWebSockets : true});
      currentConfig = rtc.getConfiguration();

      expect(currentConfig.useWebSockets).to.equal(true);
      expect(currentConfig.keepAlive).to.equal(0);
    });
    it('should call ATT.private.config.api.configure', function () {
      var configureAPIsSpy = sinon.spy(ATT.private.config.api, 'configure'),
        args;

      rtc.configure({environment: 'AMS'});
      args = configureAPIsSpy.getCall(0).args[0];

      expect(configureAPIsSpy.called).to.equal(true);
      expect(args.environment).to.equal('AMS');
      expect(args.useWebSockets).to.equal(false);
      expect(args.RTCEndpoint).to.equal('http://wdev.code-api-att.com:8080/RTC/v1');
      expect(args.DHSEndpoint).to.equal('https://localhost:9001');

      rtc.configure({environment: 'PROD'});
      args = configureAPIsSpy.getCall(0).args[0];

      expect(args.environment).to.equal('PROD');
      expect(args.useWebSockets).to.equal(false);
      expect(args.RTCEndpoint).to.equal('https://api.att.com/RTC/v1');
      expect(args.DHSEndpoint).to.equal('https://localhost:9001');

      rtc.configure({environment: 'F6UAT',
                     DHSEndpoint: 'HTTP'});
      args = configureAPIsSpy.getCall(0).args[0];

      expect(args.environment).to.equal('F6UAT');
      expect(args.useWebSockets).to.equal(false);
      expect(args.eventChannelConfig.type).to.equal('longpolling');
      expect(args.RTCEndpoint).to.equal('https://api-stage.mars.bf.sl.attcompute.com/RTC/v1');
      expect(args.DHSEndpoint).to.equal('http://localhost:9000');

      rtc.configure({environment: 'F3UAT',
        DHSEndpoint: 'HTTPS',
        useWebSockets: true });
      args = configureAPIsSpy.getCall(0).args[0];

      expect(args.environment).to.equal('F3UAT');
      expect(args.useWebSockets).to.equal(true);
      expect(args.eventChannelConfig.type).to.equal('websocket');
      expect(args.RTCEndpoint).to.equal('https://api-uat.mars.bf.sl.attcompute.com/RTC/v1');
      expect(args.DHSEndpoint).to.equal('https://localhost:9001');

      configureAPIsSpy.restore();
    });
  });

  describe("hasWebRTC", function () {
    it('should exist', function () {
      expect(ATT.rtc.hasWebRTC).to.be.a('function');
    });
    it('should return a boolean value', function() {
      expect(ATT.rtc.hasWebRTC()).to.be.a('boolean');
    });
  });

});
