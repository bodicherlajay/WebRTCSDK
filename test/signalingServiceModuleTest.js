/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe.only('SignalingService', function () {
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

  it('should exist and contain sendOffer method.', function () {
    expect(ATT.SignalingService).to.be.an('object');
    expect(ATT.SignalingService.sendOffer).to.be.a('function');
  });

  it('should exist and contain sendAnswer method.', function () {
    expect(ATT.SignalingService).to.be.an('object');
    expect(ATT.SignalingService.sendAnswer).to.be.a('function');
  });

  it('should exist and contain sendAcceptMods method.', function () {
    expect(ATT.SignalingService).to.be.an('object');
    expect(ATT.SignalingService.sendAcceptMods).to.be.a('function');
  });

  it('should exist and contain sendHoldCall method.', function () {
    expect(ATT.SignalingService).to.be.an('object');
    expect(ATT.SignalingService.sendHoldCall).to.be.a('function');
  });

  it('should exist and contain sendResumeCall method.', function () {
    expect(ATT.SignalingService).to.be.an('object');
    expect(ATT.SignalingService.sendResumeCall).to.be.a('function');
  });

  it('should exist and contain sendEndCall method.', function () {
    expect(ATT.SignalingService).to.be.an('object');
    expect(ATT.SignalingService.sendEndCall).to.be.a('function');
  });

  it('should call startCall operation with call object passed as data with SDP & calledParty.', function () {

    // setup
    apiObj.Session = {
      accessToken: 'access_token',
      Id: 'webrtc_sessionid'
    };

    var startCallSpy = sinon.spy(resourceManager, 'doOperation'),
      operationPassedToStartCall,
      configPassedToStartCall;

    sinon.stub(ATT.sdpFilter, "getInstance", function () {
      return {
        processChromeSDPOffer: function () {
          return {
            sdp: 'sdp'
          };
        }
      };
    });

    ATT.SignalingService.sendOffer({
      calledParty: '123',
      sdp: 'sdp'
    });

    expect(startCallSpy.called).to.equal(true);

    operationPassedToStartCall = startCallSpy.args[0][0];
    configPassedToStartCall = startCallSpy.args[0][1];

    expect(operationPassedToStartCall).to.equal('startCall');
    expect(configPassedToStartCall.data.call).to.be.an('object');
    expect(configPassedToStartCall.data.call.sdp).to.equal('sdp');
    expect(configPassedToStartCall.data.call.calledParty).to.equal('sip:123@icmn.api.att.net');

    startCallSpy.restore();
  });


  it('should receive 201 and Location url and x-state: invitation-sent in header', function () {
    // setup
    apiObj.Session = {
      accessToken: 'access_token',
      Id: 'webrtc_sessionid'
    };

    // fake xhr response headers
    var responseHeaders = {
        Location: '/RTC/v1/sessions/0045-ab42-89a2/calls/1234',
        'x-state': 'invitation-sent',
        "Content-Type": "application/json"
      },
      successSpy = sinon.spy(),
      errorSpy = sinon.spy(),
      sendSuccessArguments,
      appConfig;

    appConfig = {
      DHSEndpoint: "http://localhost:9000",
      RTCEndpoint: "http://wdev.code-api-att.com:8080/RTC/v1"
    };

    // TODO: Find out proper configure call. Fix configue typo.
    ATT.configueAPIs(appConfig);
    ATT.configure();

    // call
    ATT.SignalingService.sendOffer({
      calledParty: '123',
      sdp: 'sdp',
      success: successSpy,
      error: errorSpy
    });

    // Response to startCall (happy path)
    requests[0].respond(201, responseHeaders, "");

    // send callback should be called
    expect(successSpy.called).to.equal(true);

    // send should be called with object with x-state and location.
    sendSuccessArguments = successSpy.args[0][0];
    expect(sendSuccessArguments).to.be.an('object');
  });

  xit('should not call success callback on any 400.', function () {
    var errorSpy = sinon.spy(),
      successSpy = sinon.spy();

    // setup
    apiObj.Session = {
      accessToken: 'access_token',
      Id: 'webrtc_sessionid'
    };

    // call
    ATT.SignalingService.sendOffer({
      calledParty: '123',
      sdp: 'sdp',
      success: successSpy,
      error: errorSpy
    });

    // response
    // Response to startCall (happy path)
    requests[0].respond(400, {}, "");

    // send callback should be called
    expect(successSpy.called).to.equal(false);
  });
});