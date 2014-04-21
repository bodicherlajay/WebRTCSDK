/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe.only('DHSModule', function () {
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


  it('getE911Id should call success callback on call success.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.getE911Id({
      data: {
        userId: 'userId'
      },
      success:  spySuccess,
      error:    spyError
    });

    // response json.
    responseObject1 = {
      "e911Id": 'e911id'
    };

    // response
    requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

    // expect
    expect(spySuccess.called).to.equal(true);
    expect(spySuccess.calledWith(responseObject1)).to.equal(true);
  });

  it('getE911Id should call error callback on call error.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.getE911Id({
      data: {
        userId: 'userId'
      },
      success:  spySuccess,
      error:    spyError
    });

    // response json.
    responseObject1 = {
      "e911Id": 'e911id'
    };

    // response
    requests[0].respond(400, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

    // expect
    expect(spyError.called).to.equal(true);
    expect(spySuccess.called).to.equal(false);
  });

  it('getE911Id should throw error if no userId passed in.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      boundCall;

    boundCall = ATT.rtc.dhs.getE911Id.bind(null, {
      data: {
        userId: null
      },
      success:  spySuccess,
      error:    spyError
    });

    expect(boundCall).to.throw('userId required for getE911Id.');
  });

  it('createE911Id should call success callback on call success.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.createE911Id({
      userId: 'userId',
      address: {
        address1: '1234 Test St.',
        address2: '',
        city: 'Redmond',
        state: 'WA',
        zip: '12345'
      },
      success:  spySuccess,
      error:    spyError
    });

    // response json.
    responseObject1 = {
      "e911Id": 'e911id'
    };

    // response
    requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

    // expect
    expect(spySuccess.called).to.equal(true);
    expect(spySuccess.calledWith(responseObject1)).to.equal(true);
  });

  it('createE911Id should call error callback on call error.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.createE911Id({
      userId: 'userId',
      address: {
        address1: '1234 Test St.',
        address2: '',
        city: 'Redmond',
        state: 'WA',
        zip: '12345'
      },
      success:  spySuccess,
      error:    spyError
    });

    // response json.
    responseObject1 = {};

    // response
    requests[0].respond(400, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

    // expect
    expect(spyError.called).to.equal(true);
    expect(spySuccess.called).to.equal(false);
  });

  it('createE911Id should throw error if no userId passed in.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      boundCall;

    boundCall = ATT.rtc.dhs.createE911Id.bind(null, {
      userId: null,
      address: {
        address1: '1234 Test St.',
        address2: '',
        city: 'Redmond',
        state: 'WA',
        zip: '12345'
      },
      success:  spySuccess,
      error:    spyError
    });

    expect(boundCall).to.throw('userId required.');
  });

  it('createE911Id should throw error if address fails validation.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      boundCall;

    // Address empty object.
    boundCall = ATT.rtc.dhs.createE911Id.bind(null, {
      userId: '123',
      address: {
      },
      success:  spySuccess,
      error:    spyError
    });

    expect(boundCall).to.throw('Address did not validate.');

    // Missing city
    boundCall = ATT.rtc.dhs.createE911Id.bind(null, {
      userId: '123',
      address: {
        address1: '1234 Test St.',
        address2: '',
        city: '',
        state: 'WA',
        zip: '12345'
      },
      success:  spySuccess,
      error:    spyError
    });

    expect(boundCall).to.throw('Address did not validate.');
  });

});