/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true*/

/**
 *  WebRTC API REST configuration file.
 *  All configured methods will be placed in the ATT.WebRTCAPI namespace.
 *  @namespace WebRTCAPI
 */

describe('APIConfig', function () {
  "use strict";
  var appConfig, backupatt;
  beforeEach(function () {
    backupatt = ATT;
    appConfig = {
      DHSEndpoint: "http://localhost:9000",
      RTCEndpoint: "http://wdev.code-api-att.com:8080/RTC/v1"
    };
    ATT.configureAPIs(appConfig);
  });

  it('should contain a valid APIConfig object', function () {
    expect(ATT.APIConfigs).to.be.an('object');
    expect(ATT.APIConfigs).to.not.equal(undefined);
  });

  it('should have a valid method getE911Id method and return DHSEndpoint', function () {
    expect(ATT.APIConfigs.getE911Id).to.be.an('object');
    expect(ATT.APIConfigs.getE911Id.method).to.equal('get');
    expect(ATT.APIConfigs.getE911Id.formatters.url('e911Id')).to.equal(appConfig.DHSEndpoint + '/e911/e911Id');
  });


  it('should have a valid method createWebRTCSession method and return headers', function () {
    expect(ATT.APIConfigs.createWebRTCSession).to.be.an('object');
    expect(ATT.APIConfigs.createWebRTCSession.method).to.equal('post');
    expect(ATT.APIConfigs.createWebRTCSession.formatters.headers.Authorization('authtoken')).to.equal('Bearer authtoken');
    expect(ATT.APIConfigs.createWebRTCSession.formatters.headers['x-e911Id']('authtoken')).to.equal('authtoken');
  });


  it('should have a valid method deleteWebRTCSession method and Authorization', function () {
    expect(ATT.APIConfigs.deleteWebRTCSession).to.be.an('object');
    expect(ATT.APIConfigs.deleteWebRTCSession.method).to.equal('delete');
    expect(ATT.APIConfigs.deleteWebRTCSession.formatters.url('sessionid')).to.equal(appConfig.RTCEndpoint + '/sessions/sessionid');
    expect(ATT.APIConfigs.deleteWebRTCSession.formatters.headers.Authorization('authtoken')).to.equal('Bearer authtoken');
    expect(ATT.APIConfigs.deleteWebRTCSession.formatters.headers['x-e911Id']('authtoken')).to.equal('authtoken');
  });

  it('should have a valid method getEvents method and returns Authorization and url', function () {
    var  params = {sessionId : "sessionid", endpoint : "endpoint"};
    expect(ATT.APIConfigs.getEvents).to.be.an('object');
    expect(ATT.APIConfigs.getEvents.method).to.equal('get');
    expect(ATT.APIConfigs.getEvents.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/sessionidendpoint');
    expect(ATT.APIConfigs.getEvents.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
    expect(ATT.APIConfigs.getEvents.headers['Pragma']).to.equal('no-cache');
  });

  it('should have a valid method startCall method and returns Authorization and url', function () {
    expect(ATT.APIConfigs.startCall.method).to.equal('post');
    expect(ATT.APIConfigs.startCall).to.be.an('object');
    expect(ATT.APIConfigs.startCall.formatters.url('sessionid')).to.equal(appConfig.RTCEndpoint + '/sessions/sessionid/calls');
    expect(ATT.APIConfigs.startCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
  });

  it('should have a valid method answerCall method and returns Authorization and url', function () {
    var params = ["param1", "param2"];
    expect(ATT.APIConfigs.answerCall.method).to.equal('put');
    expect(ATT.APIConfigs.answerCall).to.be.an('object');
    expect(ATT.APIConfigs.answerCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/param1/calls/param2');
    expect(ATT.APIConfigs.answerCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
  });

  it('should have a valid method modifyCall method and returns Authorization and url', function () {
    var  params = ["param1", "param2"];
    expect(ATT.APIConfigs.modifyCall.method).to.equal('put');
    expect(ATT.APIConfigs.modifyCall).to.be.an('object');
    expect(ATT.APIConfigs.modifyCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/param1/calls/param2');
    expect(ATT.APIConfigs.modifyCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
    expect(ATT.APIConfigs.modifyCall.formatters.headers['x-calls-action']('action')).to.equal('action');
    expect(ATT.APIConfigs.modifyCall.headers).to.be.an('object');
  });

  it('should have a valid method acceptModifications method and returns Authorization and url', function () {
    var  params = ["param1", "param2"];
    expect(ATT.APIConfigs.acceptModifications.method).to.equal('put');
    expect(ATT.APIConfigs.acceptModifications).to.be.an('object');
    expect(ATT.APIConfigs.acceptModifications.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/param1/calls/param2');
    expect(ATT.APIConfigs.acceptModifications.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
  });

  it('should have a valid method endCall method and returns Authorization and url', function () {
    var  params = ["param1", "param2"];
    expect(ATT.APIConfigs.endCall.method).to.equal('delete');
    expect(ATT.APIConfigs.endCall).to.be.an('object');
    expect(ATT.APIConfigs.endCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/param1/calls/param2');
    expect(ATT.APIConfigs.endCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
  });

  afterEach(function () {
    ATT = backupatt;
  });

});
