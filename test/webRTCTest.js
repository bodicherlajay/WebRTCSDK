/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true*/


describe('webRTC', function () {
  'use strict';

  var apiObj = ATT[ATT.apiNamespaceName],
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


  describe('utils', function () {
    it('hasWebRTC should return true if navigator.mozGetUserMedia or ' +
      'navigator.webkitGetUserMedia or navigator.getUserMedia is a function', function () {
      //act
        var hasWebRTC = ATT.utils.hasWebRTC();
        expect(hasWebRTC).to.equal(true);
      });
  });

  describe('loginAndCreateWebRTCSession', function () {

    /**
     * Create session curl call
     * curl -i -X POST -H "Content-Type: application/json" -H "Accept:application/json" 
     * -H "Authorization:Bearer abcd" -H "x-e911Id:f81d4fae-7dec-11d0-a765-00a0c91e6bf" 
     * -d @bftest.txt http://wdev.code-api-att.com:8080/RTC/v1/sessions
     */

    it('should pass access token and e911id to createWebRTCSession and set appropriate headers/data', function () {

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
          pw: 'pw',
          access_token: {access_token: 'tokin' }
        },
        success: function () {
        },
        error: function () {
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


    it('should pass session description as data object to createWebRTCSession', function () {
      // plan of attack:
      // fake the authorization call response.
      // spy on createWebRTCSession.

      // spy on createWebRTCSession
      var createWebRTCSessionSpy = sinon.spy(apiObj, 'createWebRTCSession'),
        responseObject1,
        args1;

      apiObj.login({
        un: 'un',
        pw: 'pw'
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


    it('should call success callback of createWebRTCSession, happy path', function () {

      // response json from authorize call.  check the schema.
      var responseObject1 = {
          "accesstoken": {
            "access_token": "abcd"
          }
        },
        expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204",
        jsonSpy = sinon.spy();

      apiObj.login({data: {}, success: jsonSpy});

      // response to authorize
      requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

      // response to createWebRTCSession.  Only passes pack response with no body.
      requests[1].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));

      expect(requests[1].getResponseHeader('location')).to.equal(expectedLocationHeader);
    });
  });
});