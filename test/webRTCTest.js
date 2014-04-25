/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true*/


describe('webRTC', function () {
  'use strict';
  var resourceManager = Env.resourceManager.getInstance(),
    apiObj = resourceManager.getAPIObject(),
    requests,
    xhr;

  beforeEach(function () {

    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];

    xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
  });


  afterEach(function () {
    xhr.restore();
  });

  it('ATT namespace should exist and contain utils', function () {
    expect(ATT).to.be.an('object');
    expect(ATT.utils).to.be.an('object');
  });

  describe('loginAndCreateWebRTCSession', function () {

    /**
     * Create session curl call
     * curl -i -X POST -H "Content-Type: application/json" -H "Accept:application/json" 
     * -H "Authorization:Bearer abcd" -H "x-e911Id:f81d4fae-7dec-11d0-a765-00a0c91e6bf" 
     * -d @bftest.txt http://wdev.code-api-att.com:8080/RTC/v1/sessions
     */

    xit('should pass access token and e911id to createWebRTCSession and set appropriate headers/data', function () {

      // plan of attack:
      // fake the authorization call response.
      // spy on createWebRTCSession.

      // spy on createWebRTCSession
      var createWebRTCSessionSpy = sinon.spy(apiObj, 'createWebRTCSession'),
        args1,
        responseObject1;

      apiObj.login({
        data: {
          un: 'un',
          pw: 'pw'
        },
        callbacks : {
          onSessionReady: function () {
          },
          onSessionError: function () {
          }
        }
      });

      // response json from authorize call.  check the schema.
      responseObject1 = {
        "accesstoken": {
          "access_token": "abcd"
        },
        "e911": 'e911id'
      };

      // response to authorize
      requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));
      args1 = createWebRTCSessionSpy.args[0];

      // expect
      expect(args1[0].headers.Authorization).to.contain(responseObject1.accesstoken.access_token);
      expect(args1[0].headers.Authorization).to.contain(responseObject1.accesstoken.access_token);
      expect(args1[0].headers['x-e911Id']).to.be.a('string');


      // restore
      createWebRTCSessionSpy.restore();
    });


    xit('should pass session description as data object to createWebRTCSession', function () {
      // plan of attack:
      // fake the authorization call response.
      // spy on createWebRTCSession.

      // spy on createWebRTCSession
      var createWebRTCSessionSpy = sinon.spy(apiObj, 'createWebRTCSession'),
        responseObject1,
        args1;

      apiObj.login({
        data: {
          un: 'un',
          pw: 'pw'
        },
        callbacks : {
          onSessionReady: function () {
          },
          onSessionError: function () {
          }
        }
      });

      // response json from authorize call.  check the schema.
      responseObject1 = {
        "accesstoken": {
          "access_token": "abcd"
        }
      };

      // response to authorize
      requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));
      args1 = createWebRTCSessionSpy.args[0];

      // expect
      // should contain mediaType and services.
      expect(args1[0].data.session.services).to.be.an('array');

      // restore
      createWebRTCSessionSpy.restore();

    });


    xit('should call success callback of createWebRTCSession, happy path', function () {

      // response json from authorize call.  check the schema.
      var responseObject1 = {
          "accesstoken": {
            "access_token": "abcd"
          }
        },
        expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204",
        jsonSpy = sinon.spy();

      apiObj.login({data: {}, callbacks : { onSessionReady : jsonSpy } });

      // response to authorize
      requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

      // response to createWebRTCSession.  Only passes pack response with no body.
      requests[1].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));

      expect(requests[1].getResponseHeader('location')).to.equal(expectedLocationHeader);
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
});