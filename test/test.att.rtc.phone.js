/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert*/

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
    var expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204";
    ATT.rtc.Phone.login({token: "token", e911Id: "e911id", audioOnly: true, callbacks: {onSessionReady: function () {}, onError : function () {}}});
    expect(doOperation.calledOnce).equals(true);
    requests[0].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));
    expect(requests[0].requestBody).equals('{"session":{"mediaType":"dtls-srtp","ice":"true","services":["ip_voice_call"]}}');
    expect(requests[0].getResponseHeader('location')).to.equal(expectedLocationHeader);
    expect(requests[0].requestHeaders.Authorization).to.equal('Bearer token');
  });

  it('login with audio and video service', function () {
    var expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204";
    ATT.rtc.Phone.login({token: "token", e911Id: "e911id", callbacks: {onSessionReady: function () {}, onError : function () {}}});
    expect(doOperation.calledOnce).equals(true);
    requests[0].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));
    expect(requests[0].getResponseHeader('location')).to.equal(expectedLocationHeader);
    expect(requests[0].requestBody).equals('{"session":{"mediaType":"dtls-srtp","ice":"true","services":["ip_voice_call","ip_video_call"]}}');
    expect(requests[0].method).equals('post');
    expect(requests[0].requestHeaders.Authorization).to.equal('Bearer token');
  });

  describe('logout', function () {
    it('logout', function () {
      var expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204", stub, hdr;
      stub = sinon.stub(ATT.UserMediaService, "stopStream");
      ATT.rtc.Phone.logout({success: function () {},
        error : function () {}});
      expect(doOperation.calledOnce).equals(true);
      requests[0].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));
      expect(requests[0].getResponseHeader('location')).to.equal(expectedLocationHeader);
      expect(requests[0].method).equals('delete');
      hdr = requests[0].url.indexOf(expectedLocationHeader) !== -1 ? true : false;
      expect(requests[0].requestHeaders.Authorization).to.equal('Bearer token');
      expect(hdr).equals(true);
      stub.restore();
    });
  });

  describe('hold', function () {
    var stubSessionContext, fakeSessionContext, instanceFunction, holdCalled = false,
      myCallManager = cmgmt.CallManager.getInstance();
    it('will call hold if callObject is defined', function () {
      instanceFunction = function () { return { hold: function () { holdCalled = true; } }; };
      fakeSessionContext = {getCallObject: instanceFunction };
      stubSessionContext = sinon.stub(myCallManager, "getSessionContext");
      stubSessionContext.returns(fakeSessionContext);
      ATT.rtc.Phone.hold();
      expect(holdCalled).equals(true);
      stubSessionContext.restore();
    });
    it('will not call hold if calledObject is null', function () {
      instanceFunction = function () { return null; };
      fakeSessionContext = {getCallObject: instanceFunction };
      stubSessionContext = sinon.stub(myCallManager, "getSessionContext");
      stubSessionContext.returns(fakeSessionContext);
      ATT.rtc.Phone.hold();
      stubSessionContext.restore();
    });
  });

  describe('resume', function () {
    var stubSessionContext, fakeSessionContext, instanceFunction, resumeCalled = false,
      myCallManager = cmgmt.CallManager.getInstance();
    it('will call resume if callObject is defined', function () {
      instanceFunction = function () { return { resume: function () { resumeCalled = true; } }; };
      fakeSessionContext = { getCallObject: instanceFunction };
      stubSessionContext = sinon.stub(myCallManager, "getSessionContext");
      stubSessionContext.returns(fakeSessionContext);
      ATT.rtc.Phone.resume();
      expect(resumeCalled).equals(true);
      stubSessionContext.restore();
    });
    it('will not call resume if calledObject is null', function () {
      instanceFunction = function () { return null; };
      fakeSessionContext = {getCallObject: instanceFunction };
      stubSessionContext = sinon.stub(myCallManager, "getSessionContext");
      stubSessionContext.returns(fakeSessionContext);
      ATT.rtc.Phone.resume();
      stubSessionContext.restore();
    });
  });
  describe('hangup', function () {
    var stubSessionContext, fakeSessionContext, instanceFunction, hangupCalled = false,
      myCallManager = cmgmt.CallManager.getInstance();
    it('will call hangup if callObject is defined', function () {
      instanceFunction = function () { return { end: function () { hangupCalled = true; } }; };
      fakeSessionContext = { getCallObject: instanceFunction };
      stubSessionContext = sinon.stub(myCallManager, "getSessionContext");
      stubSessionContext.returns(fakeSessionContext);
      ATT.rtc.Phone.hangup();
      expect(hangupCalled).equals(true);
      stubSessionContext.restore();
    });
    it('will not call hangup if calledObject is null', function () {
      instanceFunction = function () { return null; };
      fakeSessionContext = {getCallObject: instanceFunction };
      stubSessionContext = sinon.stub(myCallManager, "getSessionContext");
      stubSessionContext.returns(fakeSessionContext);
      ATT.rtc.Phone.hangup();
      stubSessionContext.restore();
    });
  });

  describe('Mute', function () {
    it('should have a mute method', function () {
      assert.ok(ATT.rtc.Phone.mute);
    });
  });

  describe('Unmute', function () {
    it('should have a unmute method', function () {
      assert.ok(ATT.rtc.Phone.unmute);
    });
  });
});
