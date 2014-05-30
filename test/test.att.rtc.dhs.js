/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
before: true, sinon: true, expect: true, xit: true, xdescribe: true*/

describe('DHSModule', function () {
  "use strict";

  var resourceManager = Env.resourceManager.getInstance(),
    apiObj = resourceManager.getAPIObject(),
    requests,
    xhr,
    backupAtt;

  beforeEach(function () {
    backupAtt = ATT;
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

  it('should call `doOperation` on the resourceManager', function () {
    var config = {"data" : {"type" : "MOBILENUMBER"}},
      spy = sinon.spy(resourceManager, 'doOperation');

    ATT.rtc.dhs.login(config);
    expect(spy.called).to.equal(true);
    resourceManager.doOperation.restore();
  });

  xit('should call success callback after authentication', function () {
    var config = {
      "data" :
        { "type" : "MOBILENUMBER"}
    };

    resourceManager.doOperation = function (config) {
      config.success(config);
    };

    ATT.rtc.dhs.login(config);
    expect(config.success.called).to.equal(true);
  });

  xit('login should call SDK initSession with accesstoken & e911id on success ', function () {
    var initSessionSpy = sinon.spy(apiObj, 'initSession'),
      responseObject1;

    ATT.rtc.dhs.login({
      data: {
        un: 'un',
        pw: 'pw'
      },
      success: function () { return; }
    });

    // response json from authorizeUser call.  check the schema.
    responseObject1 = {
      "accesstoken": {
        "access_token": "abcd"
      },
      "e911Id": {
        "e911Locations": {
          "addressIdentifier": 'e911id'
        }
      }
    };


    // response to authorize
    requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

    // expect
    expect(initSessionSpy.called).to.equal(true);
    expect(initSessionSpy.calledWith(responseObject1.accesstoken.access_token,
      responseObject1.e911Id.e911Locations.addressIdentifier)).to.equal(true);

    // restore
    initSessionSpy.restore();
  });


  xit('getE911Id should call success callback on call success.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.getE911Id({
      userId: 'userId',
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

  xit('getE911Id should call error callback on call error.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.getE911Id({
      userId: 'userId',
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

  xit('getE911Id should throw error if no userId passed in.', function () {
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

  xit('createE911Id should call success callback on call success.', function () {
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
    requests[0].respond(200, {
      "Content-Type": "application/json"
    }, JSON.stringify(responseObject1));

    // expect
    expect(spySuccess.called).to.equal(true);
    expect(spySuccess.calledWith(responseObject1)).to.equal(true);
  });

  xit('createE911Id should call error callback on call error.', function () {
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

  xit('createE911Id should throw error if no userId passed in.', function () {
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

  xit('createE911Id should throw error if address fails validation.', function () {
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

  afterEach(function () {
    ATT = backupAtt;
  });

});
