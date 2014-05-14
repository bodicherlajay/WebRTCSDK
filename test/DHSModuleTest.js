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
    var config = {"data" : {"type" : "MOBILENUMBER"}};
    resourceManager.doOperation = sinon.spy(resourceManager.doOperation);
    ATT.rtc.dhs.login(config);
    expect(resourceManager.doOperation.called).to.equal(true);
  });

  it('should call success callback after authorization', function () {
    var config = {
      data: {
        type: "MOBILENUMBER"
      },
      success: sinon.spy(),
      error: sinon.spy()
    };

    resourceManager.doOperation = function () {
      config.success();
    };

    ATT.rtc.dhs.login(config);
    expect(config.success.called).to.equal(true);
  });

  it('getE911Id should call success callback on call success.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.getE911Id({
      data: {
        id: 'id'
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
        id: 'id'
      },
      success:  spySuccess,
      error:    spyError
    });

    // response json.
    responseObject1 = {
      "error": 'error'
    };

    // response
    requests[0].respond(400, {"Content-Type": "application/json"}, JSON.stringify(responseObject1));

    // expect
    expect(spyError.called).to.equal(true);
    expect(spySuccess.called).to.equal(false);
  });

  it('getE911Id should throw error if no id passed in.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      boundCall;

    boundCall = ATT.rtc.dhs.getE911Id.bind(null, {
      data: {
        id: null
      },
      success:  spySuccess,
      error:    spyError
    });

    expect(spyError.called).to.equal(true);
    //throw('Cannot get e911 id. Unique identifier is required.');
  });

  it('createE911Id should call success callback on call success.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      responseObject1;

    ATT.rtc.dhs.createE911Id({
      data: {
        address: {
          houseNumber: '1234',
          street: 'Test St.',
          unit: '',
          city: 'Redmond',
          state: 'WA',
          zip: '12345'
        },
        isAddressConfirmed: 'true'
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
        address: {
          houseNumber: '1234',
          street: 'Test St.',
          unit: '',
          city: 'Redmond',
          state: 'WA',
          zip: '12345'
        },
        isAddressConfirmed: 'true'
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

  it('createE911Id should throw error if no isAddressConfirmed passed in.', function () {
    var spySuccess = sinon.spy(),
      spyError = sinon.spy(),
      boundCall;

    boundCall = ATT.rtc.dhs.createE911Id.bind(null, {
      data: {
        address: {
          houseNumber: '1234',
          street: 'Test St.',
          unit: '',
          city: 'Redmond',
          state: 'WA',
          zip: '12345'
        },
        isAddressConfirmed: null
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
      data: {
        address: {
        }
      },
      success:  spySuccess,
      error:    spyError
    });

    expect(boundCall).to.throw('Address did not validate.');

    // Missing city
    boundCall = ATT.rtc.dhs.createE911Id.bind(null, {
      data: {
        address: {
          houseNumber: null,
          street: null,
          unit: '',
          city: 'Redmond',
          state: 'WA',
          zip: '12345'
        },
        isAddressConfirmed: 'true'
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