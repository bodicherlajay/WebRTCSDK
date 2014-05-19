/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true*/


describe('webRTC', function () {
  'use strict';
  var resourceManager = Env.resourceManager.getInstance(),
    doOperation,
    requests;

  beforeEach(function () {
    this.xhr = sinon.useFakeXMLHttpRequest();
    requests = [];

    this.xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
    doOperation = sinon.spy(resourceManager, "doOperation");
  });

  afterEach(function () {
    this.xhr.restore();
    resourceManager.doOperation.restore();
  });

  it('ATT namespace should exist and contain utils', function () {
    expect(ATT).to.be.an('object');
    expect(ATT.utils).to.be.an('object');
  });

  it('login with audio only service', function () {

    ATT.rtc.Phone.login({token: "token", e911Id: "e911id", audioOnly: true, callbacks: {onSessionReady: function () {}, onError : function () {}}});
    expect(doOperation.calledOnce).equals(true);

    var opData = {
      data: {
        'session': {
          'mediaType': 'dtls-srtp',
          'ice': 'true',
          'services': ['ip_voice_call']
        }
      },
      params: {
        headers: {
          'Authorization': "token",
          'x-e911Id': "e911Id",
          'x-Arg': 'ClientSDK=WebRTCTestAppJavascript1'
        }
      },
      success: sinon.spy(),
      error: sinon.spy()
    };
    doOperation.calledWithMatch(opData);
  });

  it('should pass access token and e911id to createWebRTCSession and set appropriate headers/data', function () {

  });

});
