/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt, describe: true, it: true, afterEach: true,
beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe('SignalingService', function () {
  "use strict";

  var resourceManager,
    apiObj,
    requests = [],
    xhr,
    callManager,
    sessionContext,
    operationSpy;

  beforeEach(function () {

    // resource Manager
    resourceManager = Env.resourceManager.getInstance();
    apiObj = resourceManager.getAPIObject();
    operationSpy = sinon.spy(resourceManager, 'doOperation');

    // call manager
    callManager = cmgmt.CallManager.getInstance();
    callManager.CreateSession({
      token: "",
      e911Id: "",
      sessionId: ""
    });
    sessionContext = callManager.getSessionContext();
    sessionContext.setEventObject({resourceURL: ''});

    // fake xhr setup.
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];

    xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
  });

  afterEach(function () {
    resourceManager.doOperation.restore();
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

  it('sendOffer should call startCall operation with call object passed as data with SDP & calledParty.', function () {

    // setup
    apiObj.Session = {
      accessToken: 'access_token',
      Id: 'webrtc_sessionid'
    };

    var operationPassedToStartCall,
      configPassedToStartCall,
      stub = sinon.stub(ATT.sdpFilter, "getInstance", function () {
        return {
          processChromeSDPOffer: function () {
            return {
              sdp: 'sdp'
            };
          }
        };
      }),
      successSpy = sinon.spy(),
      errorSpy = sinon.spy();

    ATT.SignalingService.sendOffer({
      calledParty: '123',
      sdp: 'sdp',
      success: successSpy,
      error: errorSpy
    });

    // Response to startCall
    requests[0].respond(204, {}, "");

    expect(operationSpy.called).to.equal(true);

    operationPassedToStartCall = operationSpy.args[0][0];
    configPassedToStartCall = operationSpy.args[0][1];

    expect(operationPassedToStartCall).to.equal('startCall');
    expect(configPassedToStartCall.data.call).to.be.an('object');
    expect(configPassedToStartCall.data.call.sdp).to.equal('sdp');
    expect(configPassedToStartCall.data.call.calledParty).to.equal('sip:123@icmn.api.att.net');
    expect(errorSpy.called).to.equal(false);
    expect(successSpy.called).to.equal(true);
    stub.restore();
  });


  it('sendOffer should receive 201 and Location url and x-state: invitation-sent in header', function () {

    // setup
    // fake xhr response headers
    var responseHeaders = {
        Location: '/RTC/v1/sessions/0045-ab42-89a2/calls/1234',
        'x-state': 'invitation-sent',
        "Content-Type": "application/json"
      },
      successSpy = sinon.spy(),
      errorSpy = sinon.spy(),
      sendSuccessArguments,
      appConfig = {
        DHSEndpoint: "http://localhost:9000",
        RTCEndpoint: "http://wdev.code-api-att.com:8080/RTC/v1"
      };

    ATT.configureAPIs(appConfig);

    // execute
    ATT.SignalingService.sendOffer({
      calledParty: '123',
      sdp: 'sdp',
      success: successSpy,
      error: errorSpy
    });

    // Response to startCall
    requests[0].respond(201, responseHeaders, "");

    // verify
    // send callback should be called
    expect(successSpy.called).to.equal(true);

    // send should be called with object with x-state and location.
    sendSuccessArguments = successSpy.args[0][0];
    expect(sendSuccessArguments).to.be.an('object');
  });

  it('sendAnswer should call startCall operation with sdp', function () {

    var operationName,
      configPassedToOperation,
      successSpy = sinon.spy(),

      // stubs for sendAnswer function.
      stub = sinon.stub(ATT.sdpFilter, "getInstance", function () {
        return {
          processChromeSDPOffer: function () {
            return {
              sdp: 'sdp'
            };
          }
        };
      });

    ATT.SignalingService.sendAnswer({
      sdp: 'sdp',
      success: successSpy
    });

    // Response to operation call
    requests[0].respond(204, {}, "");

    expect(operationSpy.called).to.equal(true);

    operationName = operationSpy.args[0][0];
    configPassedToOperation = operationSpy.args[0][1];

    expect(operationName).to.equal('answerCall');
    expect(configPassedToOperation.data.callsMediaModifications).to.be.an('object');
    expect(configPassedToOperation.data.callsMediaModifications.sdp).to.equal('sdp');

    expect(successSpy.called).to.equal(true);
    stub.restore();
  });

  it('sendAnswer should call error callback on 500', function () {

    var successSpy = sinon.spy(),
      errorSpy = sinon.spy(),

    // stubs for sendAnswer function.
      stub = sinon.stub(ATT.sdpFilter, "getInstance", function () {
        return {
          processChromeSDPOffer: function () {
            return {
              sdp: 'sdp'
            };
          }
        };
      });


    ATT.SignalingService.sendAnswer({
      sdp: 'sdp',
      success: successSpy,
      error: errorSpy
    });

    // Response to operation call
    requests[0].respond(500, {}, "");

    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(false);
    expect(errorSpy.called).to.equal(true);

    stub.restore();
  });

  it('sendAcceptMods should call success callback with xstate and location.', function () {

    // setup

    // fake xhr response headers
    var responseHeaders = {
        Location: 'location',
        'x-state': 'x-state',
        "Content-Type": "content-type"
      },
      successSpy = sinon.spy(),

      // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendAcceptMods',
        inputConfig: {
          sdp: 'sdp',
          modId: 'modId',
          success: successSpy
        },
        operation: 'acceptModifications',
        params: [],
        data: {}
      };

    // execute
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(204, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);

    // send callback should be called with location and xstate
    expect(successSpy.called).to.equal(true);
    expect(successSpy.calledWith({
      location: 'location',
      xState: 'x-state'
    })).to.equal(true);
  });

  it('sendAcceptMods should call error callback.', function () {

    // setup

    // fake xhr response headers
    var responseHeaders = {
        Location: 'location',
        'x-state': 'x-state',
        "Content-Type": "content-type"
      },
      successSpy = sinon.spy(),
      errorSpy = sinon.spy(),

    // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendAcceptMods',
        inputConfig: {
          sdp: 'sdp',
          modId: 'modId',
          success: successSpy,
          error: errorSpy
        },
        operation: 'acceptModifications',
        params: [],
        data: {}
      };

    // execute
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(500, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(false);
  });

  it('sendHoldCall should call success callback on 204 HTTP response code.', function () {

    // setup

    // fake xhr response headers
    var responseHeaders = {},
      successSpy = sinon.spy(),

    // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendHoldCall',
        inputConfig: {
          sdp: 'sdp',
          success: successSpy
        },
        operation: 'modifyCall',
        params: [],
        data: {}
      };

    // execute
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(204, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(true);
  });

  it('sendHoldCall should call error callback if not 204 or 500+ HTTP response code.', function () {
    // setup

    // fake xhr response headers
    var responseHeaders = {},
      successSpy = sinon.spy(),
      errorSpy = sinon.spy(),

    // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendHoldCall',
        inputConfig: {
          sdp: 'sdp',
          success: successSpy,
          error:  errorSpy
        },
        operation: 'modifyCall',
        params: [],
        data: {}
      };

    // execute (non 204 path)
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(200, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(false);
    expect(errorSpy.called).to.equal(true);

    // execute (500 path)
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[1].respond(500, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(false);
    expect(errorSpy.called).to.equal(true);
  });

  it('sendResumeCall should call success callback on 204 HTTP response code.', function () {
    // setup

    // fake xhr response headers
    var responseHeaders = {},
      successSpy = sinon.spy(),

      // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendResumeCall',
        inputConfig: {
          sdp: 'sdp',
          success: successSpy
        },
        operation: 'modifyCall',
        params: [],
        data: {}
      };

    // execute
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(204, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(true);
  });

  it('sendResumeCall should call error callback if not 204 HTTP response code.', function () {
    // setup

    // fake xhr response headers
    var responseHeaders = {
        Location: '/RTC/v1/sessions/0045-ab42-89a2/calls/1234',
        'x-state': 'invitation-sent',
        "Content-Type": "application/json"
      },
      successSpy = sinon.spy(),
      errorSpy = sinon.spy(),

    // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendResumeCall',
        inputConfig: {
          sdp: 'sdp',
          success: successSpy,
          error:  errorSpy
        },
        operation: 'modifyCall',
        params: [],
        data: {}
      };

    // execute
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(200, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(false);
    expect(errorSpy.called).to.equal(true);

    // 500+ path
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[1].respond(500, responseHeaders, "");

    // verify
    expect(successSpy.called).to.equal(false);
    expect(errorSpy.called).to.equal(true);
  });

  it('sendEndCall should call endCall op with correct url & headers', function () {
    // setup

    // fake xhr response headers
    var responseHeaders = {},
      successSpy = sinon.spy(),

    // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendEndCall',
        inputConfig: {
          success: successSpy
        },
        operation: 'endCall',
        params: [],
        data: {}
      };

    // execute
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(204, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(true);
  });

  it('sendEndCall should call error callback if not 204 HTTP response code.', function () {
    // setup

    // fake xhr response headers
    var responseHeaders = {},
      successSpy = sinon.spy(),
      errorSpy = sinon.spy(),

    // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendEndCall',
        inputConfig: {
          success: successSpy,
          error: errorSpy
        },
        operation: 'endCall',
        params: [],
        data: {}
      };

    // execute
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(200, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(false);
    expect(errorSpy.called).to.equal(true);
  });

  it('sendEndCall should call error callback if 500 HTTP response code.', function () {
    // setup

    // fake xhr response headers
    var responseHeaders = {},
      successSpy = sinon.spy(),
      errorSpy = sinon.spy(),

    // test config to set up test inputs, etc.
      testConfig = {
        name: 'sendEndCall',
        inputConfig: {
          success: successSpy,
          error: errorSpy
        },
        operation: 'endCall',
        params: [],
        data: {}
      };

    // execute
    ATT.SignalingService[testConfig.name](testConfig.inputConfig);

    // Response to operation call
    requests[0].respond(500, responseHeaders, "");

    // verify
    // send callback should be called
    expect(operationSpy.called).to.equal(true);
    expect(successSpy.called).to.equal(false);
    expect(errorSpy.called).to.equal(true);
  });
});
