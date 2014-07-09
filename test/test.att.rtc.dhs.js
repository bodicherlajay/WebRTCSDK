/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
before: true, sinon: true, expect: true, xit: true, xdescribe: true*/

describe('DHSModule', function () {
  "use strict";

  var apiConfigs = ATT.private.config.api.getConfiguration(),
    factories = ATT.private.factories,
    resourceManager = factories.createResourceManager(apiConfigs),
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
      stub = sinon.stub(resourceManager, 'doOperation');

    ATT.rtc.dhs.login(config);
    expect(stub.called).to.equal(true);
    stub.restore();
  });

  it('should call success callback after authentication', function () {
    var successSpy = sinon.spy(),
      doOperationStub = sinon.stub(resourceManager, 'doOperation'),
      errorSpy = sinon.spy,
      config = {
        data: {
          type: "MOBILENUMBER"
        },
        success: successSpy,
        error: errorSpy
      };

    ATT.rtc.dhs.login(config);
    expect(doOperationStub.called).to.equal(true);
    doOperationStub.restore();
  });

  it('login should call success cb on success ', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.login({
      data: {
        un: 'un',
        pw: 'pw'
      },
      success: spySuccess,
      error: spyError
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
    expect(spySuccess.called).to.equal(true);
  });

  it('getE911Id should call success callback on call success.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.getE911Id({
      data: {
        id: 'userId'
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
        id: 'userId'
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

  it('getE911Id should publish error if no userId passed in.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      publishStub = sinon.stub(ATT.Error, 'publish');

    ATT.rtc.dhs.getE911Id({
      data: {
        id: null
      },
      success:  spySuccess,
      error:    spyError
    });

    expect(publishStub.called).to.equal(true);
    publishStub.restore();
  });

  it('createE911Id should call success callback on call success.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.createE911Id({
      data: {
        id: 'userId',
        address: {
          address1: 'add1',
          address2: 'add2',
          city: 'Redmond',
          state: 'WA',
          zip: '12345'
        }
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

  it('createE911Id should call error callback on call error.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.createE911Id({
      data: {
        id: 'userId',
        address: {
          address1: 'add1',
          address2: 'add2',
          city: 'Redmond',
          state: 'WA',
          zip: '12345'
        }
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

  it('createE911Id should publish error if no config.data passed in.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      publishStub = sinon.stub(ATT.Error, 'publish');

    ATT.rtc.dhs.createE911Id({
//      data: {
//        id: null,
//        address: {
//          address1: 'add1',
//          address2: 'add2',
//          city: 'Redmond',
//          state: 'WA',
//          zip: '12345'
//        }
//      },
      success:  spySuccess,
      error:    spyError
    });

    expect(publishStub.called).to.equal(true);
    publishStub.restore();
  });

  it('createE911Id should publish error if address fails validation.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      publishStub = sinon.stub(ATT.Error, 'publish');

    // Missing fields
    ATT.rtc.dhs.createE911Id({
      data: {
        userId: '123',
        address: {
          address1: '',
          address2: '',
          city: '',
          state: 'WA',
          zip: '12345'
        }
      },
      success:  spySuccess,
      error:    spyError
    });

    expect(publishStub.called).to.equal(true);
    publishStub.restore();
  });
});
