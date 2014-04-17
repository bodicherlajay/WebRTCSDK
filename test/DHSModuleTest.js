/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe('DHSModule', function () {
  "use strict";

  var resourceManager = Env.resourceManager.getInstance(),
    apiObj = resourceManager.getAPIObject(),
    requests,
    xhr;

  before(function () {
  });

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

  it('should exist', function () {
    expect(ATT.rtc.dhs).to.be.an('object');
  });

  it('should contain login and logout methods', function () {
    expect(ATT.rtc.dhs.login).to.be.a('function');
    expect(ATT.rtc.dhs.logout).to.be.a('function');
  });

  it('shouldn\'t wipe out existing rtc methods', function () {
    expect(ATT.rtc.Phone).to.be.an('object');
  });

  it('login should call SDK initSession with accesstoken & e911id on success ', function () {

    // plan of attack:
    // fake the authorization call response.
    // spy on createWebRTCSession.

    // spy on createWebRTCSession
    var spy = sinon.spy(apiObj, 'initSession'),
      responseObject1;

    ATT.rtc.dhs.login({
      data: {
        un: 'un',
        pw: 'pw'
      },
      success: function () {}
    });

    // response json from authorizeUser call.  check the schema.
    responseObject1 = {
      "accesstoken": {
        "access_token": "abcd"
      },
      "e911Id": 'e911id'
    };


    // response to authorize
    requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

    // expect
    expect(spy.called).to.equal(true);
    expect(spy.calledWith(responseObject1.accesstoken.access_token, responseObject1.e911Id)).to.equal(true);

    // restore
    spy.restore();
  });


  it('getE911Id should return e911id string on success ', function () {

  });

});