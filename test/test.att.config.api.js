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
  var appConfig;

  it('should export', function () {
    expect(ATT.private.config.api.configure).to.be.a('function');
  });

  describe('Methods', function () {
    describe('ATT.private.config.api.getConfiguration', function () {
      it('exist', function () {
        expect(ATT.private.config.api.getConfiguration).to.be.an('function');
      });
      it('should return the current configuration object', function () {
        var apiConfiguration,
          currentAppConfig;

        apiConfiguration = ATT.private.config.api.getConfiguration();
        expect(apiConfiguration).to.be.an('object');

        currentAppConfig = ATT.private.config.app.getConfiguration();
        expect(apiConfiguration.createWebRTCSession.url).to.equal(currentAppConfig.RTCEndpoint + '/sessions');
      });
    });
  });

  describe('Properties (API Configurations)', function () {
    var currentConfiguration;

    beforeEach(function () {
      appConfig = ATT.private.config.app.getConfiguration();
      currentConfiguration = ATT.private.config.api.getConfiguration();
    });

    it('should have a valid method createE911Id method and return DHSEndpoint', function () {
      expect(currentConfiguration.createE911Id).to.be.an('object');
      expect(currentConfiguration.createE911Id.method).to.equal('post');
      expect(currentConfiguration.createE911Id.url).to.equal(appConfig.DHSEndpoint + '/e911');
    });


    it('should have a valid method createWebRTCSession method and return headers', function () {
      expect(currentConfiguration.createWebRTCSession).to.be.an('object');
      expect(currentConfiguration.createWebRTCSession.method).to.equal('post');
      expect(currentConfiguration.createWebRTCSession.formatters.headers.Authorization('authtoken')).to.equal('Bearer authtoken');
      expect(currentConfiguration.createWebRTCSession.formatters.headers['x-e911Id']('authtoken')).to.equal('authtoken');
    });


    it('should have a valid method deleteWebRTCSession method and Authorization', function () {
      expect(currentConfiguration.deleteWebRTCSession).to.be.an('object');
      expect(currentConfiguration.deleteWebRTCSession.method).to.equal('delete');
      expect(currentConfiguration.deleteWebRTCSession.formatters.url('sessionid')).to.equal(appConfig.RTCEndpoint + '/sessions/sessionid');
      expect(currentConfiguration.deleteWebRTCSession.formatters.headers.Authorization('authtoken')).to.equal('Bearer authtoken');
      expect(currentConfiguration.deleteWebRTCSession.formatters.headers['x-e911Id']('authtoken')).to.equal('authtoken');
    });

    it('should have a valid method getEvents method and returns Authorization and url', function () {
      var  params = {sessionId : "sessionid", endpoint : "endpoint"};
      expect(currentConfiguration.getEvents).to.be.an('object');
      expect(currentConfiguration.getEvents.method).to.equal('get');
      expect(currentConfiguration.getEvents.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/sessionidendpoint');
      expect(currentConfiguration.getEvents.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
      expect(currentConfiguration.getEvents.headers.Pragma).to.equal('no-cache');
      expect(currentConfiguration.getEvents.headers['Cache-Control']).to.equal('no-cache');
    });

    it('should have a valid method createCall configuration object', function () {
      var params = { sessionId: '1d23', type: 'call' };
      expect(currentConfiguration.createCall).to.be.an('object');
      expect(currentConfiguration.createCall.method).to.equal('POST');
      expect(currentConfiguration.createCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/' + params.sessionId + '/' + params.type);
      expect(currentConfiguration.createCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
    });

    it('should have a valid method answerCall method and returns Authorization and url', function () {
      var params = ["param1", "param2"];
      expect(currentConfiguration.answerCall).to.be.an('object');
      expect(currentConfiguration.answerCall.method).to.equal('put');
      expect(currentConfiguration.answerCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/param1/calls/param2');
      expect(currentConfiguration.answerCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
    });

    it('should have a valid method modifyCall method and returns Authorization and url', function () {
      var  params = ["param1", "param2"];
      expect(currentConfiguration.modifyCall).to.be.an('object');
      expect(currentConfiguration.modifyCall.method).to.equal('put');
      expect(currentConfiguration.modifyCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/param1/calls/param2');
      expect(currentConfiguration.modifyCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
      expect(currentConfiguration.modifyCall.headers).to.be.an('object');
    });

    it('should have a valid method modifyConference method and returns Authorization and url', function () {
      var  params = {
        sessionId: '1234',
        callId: 'callId'
      };
      expect(currentConfiguration.modifyConference).to.be.an('object');
      expect(currentConfiguration.modifyConference.method).to.equal('PUT');
      expect(currentConfiguration.modifyConference.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/1234/conferences/callId');
      expect(currentConfiguration.modifyConference.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
      expect(currentConfiguration.modifyConference.headers).to.be.an('object');
      expect(currentConfiguration.connectCall.formatters.headers.options['x-conference-action']('call-action')).to.equal('call-action');
    });

    it('should have a valid method connectCall', function () {
      var params = {
        sessionId: 'sessionId',
        callId: 'callId',
        type: 'conferences'
      };
      expect(currentConfiguration.connectCall).to.be.an('object');
      expect(currentConfiguration.connectCall.method).to.equal('PUT');
      expect(currentConfiguration.connectCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/sessionId/conferences/callId');
      expect(currentConfiguration.connectCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
      expect(currentConfiguration.connectCall.formatters.headers.options['x-conference-action']('conf-action')).to.equal('conf-action');
      expect(currentConfiguration.connectCall.formatters.headers.options['x-calls-action']('call-action')).to.equal('call-action');
      expect(currentConfiguration.connectCall.headers).to.be.an('object');
    });

    it('should have a valid method addParticipant', function () {
      var params = ['sessionId', 'confId', 'participantId'];
      expect(currentConfiguration.addParticipant).to.be.an('object');
      expect(currentConfiguration.addParticipant.method).to.equal('put');
      expect(currentConfiguration.addParticipant.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/sessionId/conferences/confId/participants/participantId');
      expect(currentConfiguration.addParticipant.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
      expect(currentConfiguration.addParticipant.headers).to.be.an('object');
    });

    it('should have a valid method removeParticipant', function () {
      var params = ['sessionId', 'confId', 'participantId'];
      expect(currentConfiguration.removeParticipant).to.be.an('object');
      expect(currentConfiguration.removeParticipant.method).to.equal('delete');
      expect(currentConfiguration.removeParticipant.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/sessionId/conferences/confId/participants/participantId');
      expect(currentConfiguration.removeParticipant.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
      expect(currentConfiguration.removeParticipant.headers).to.be.an('object');
    });

    it('should have a valid method acceptModifications method and returns Authorization and url', function () {
      var params = {
        sessionId: 'sessionId',
        callId: 'callId',
        type: 'calls'
      };
      expect(currentConfiguration.acceptModifications).to.be.an('object');
      expect(currentConfiguration.acceptModifications.method).to.equal('put');
      expect(currentConfiguration.acceptModifications.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/sessionId/calls/callId');
      expect(currentConfiguration.acceptModifications.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
    });

    it('should have a valid method endCall method and returns Authorization and url', function () {
      var  params = ["sessionId", "callType", "callId"];
      expect(currentConfiguration.endCall).to.be.an('object');
      expect(currentConfiguration.endCall.method).to.equal('delete');
      expect(currentConfiguration.endCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/sessionId/callType/callId');
      expect(currentConfiguration.endCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
    });

    it('should have a valid method rejectCall method and returns Authorization and url', function () {
      var  params = ["sessionId", "callType", "callId"];
      expect(currentConfiguration.rejectCall).to.be.an('object');
      expect(currentConfiguration.rejectCall.method).to.equal('delete');
      expect(currentConfiguration.rejectCall.formatters.url(params)).to.equal(appConfig.RTCEndpoint + '/sessions/sessionId/callType/callId');
      expect(currentConfiguration.rejectCall.formatters.headers.Authorization('authtoken')).to.equal('authtoken');
    });

  });

});
