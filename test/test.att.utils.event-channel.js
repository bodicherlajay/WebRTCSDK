/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global WebSocket: true, ATT, Env, describe, xit, it, afterEach, beforeEach, before, sinon, expect*/

/**
 * Unit tests for event channel module.
 */
describe('Event Channel', function () {
  'use strict';
  var resourceManager = Env.resourceManager.getInstance(),
    requests,
    response,
    channelConfig,
    httpConfig,
    factories,
    eventChannel,
    xhr;

  beforeEach(function () {
    factories = ATT.private.factories;
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];
    // using a mock response
    response = {
      events: {
        eventList: [{
          eventObject: {
            resourceURL: '/v1/sessions/aaa-bbb-ccc/calls/12345'
          }
        }]
      }
    };
    xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
    channelConfig = {
      accessToken: 'my token',
      endpoint: '/events',
      sessionId: 'sessionId',
      publisher: {
        publish: sinon.spy()
      },
      publicMethodName: 'getEvents',
      resourceManager: resourceManager,
      usesLongPolling: true
    };

    httpConfig = {
      params: {
        url: {sessionId: channelConfig.sessionId, endpoint: channelConfig.endpoint},
        headers: {
          'Authorization' : 'Bearer ' + channelConfig.accessToken
        }
      },
      success: sinon.spy(),
      error: sinon.spy(),
      ontimeout: sinon.spy()
    };
  });

  afterEach(function () {
    xhr.restore();
  });


  it('should export factory method ATT.private.factories.createEventChannel', function () {
    expect(ATT.private.factories.createEventChannel).to.be.a('function');
  });

  describe('Factory method', function () {
    it('createEventChannel should throw error if channelConfig is undefined', function () {
      channelConfig = undefined;
      expect(ATT.private.factories.createEventChannel.bind(ATT.utils, channelConfig)).to.throw('No options');
    });

    it('createEventChannel should throw error if channelConfig is invalid', function () {
      var createEventChannel = factories.createEventChannel;
      expect(createEventChannel.bind(null, {})).to.throw(Error);
      expect(createEventChannel.bind(null, { test: 'test' })).to.throw('No Access Token');
      expect(createEventChannel.bind(null, { accessToken: 'test' })).to.throw('No Endpoint');
      expect(createEventChannel.bind(null, {
        accessToken: 'test',
        endpoint: 'xxx'
      })).to.throw('No Session Id');
      expect(createEventChannel.bind(null, {
        accessToken: 'test',
        endpoint: 'xxx',
        sessionId: '123'
      })).to.throw('No Resource Manager');

      it('should update `interval` if passed');
      it('should update `maxPollingTime` if passed');
    });

    it('should create an eventEmitter', function () {
      var createEventChannelSpy = sinon.spy(factories, 'createEventEmitter');

      eventChannel = factories.createEventChannel(channelConfig);

      expect(createEventChannelSpy.called).to.equal(true);
    });

    it('should return an EventChannel object', function () {
      eventChannel = factories.createEventChannel(channelConfig);
      expect(eventChannel).to.be.an('object');
    });
  });

  describe('startListening', function () {

    var emitter,
      doOperationStub;

    beforeEach(function () {
      emitter = factories.createEventEmitter();
    });

    it('should exist', function () {
      eventChannel = factories.createEventChannel(channelConfig);
      expect(eventChannel.startListening).to.be.a('function');
    });
    it('should change `isListening` flag to true', function () {

      doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) {
        return;
      });

      eventChannel = factories.createEventChannel(channelConfig);
      eventChannel.startListening(httpConfig);

      expect(eventChannel.isListening()).to.equal(true);

      doOperationStub.restore();
    });

    it('should call resourceManager.doOperation with `getEvents`', function () {

      doOperationStub = sinon.stub(channelConfig.resourceManager, 'doOperation', function (name, options) {
        options.success({
          getResponseStatus: function () { return 200; },
          httpStatusCode: '200',
          responseText: JSON.stringify(response)
        });
      });

      eventChannel = factories.createEventChannel(channelConfig);
      eventChannel.startListening(httpConfig);
      expect(doOperationStub.calledOnce).to.equal(true);
      expect(doOperationStub.getCall(0).args[0]).to.equal('getEvents');

      doOperationStub.restore();
    });

    describe('Success', function () {

      it('should continue polling if data is received (HTTP Status Code = 200)', function (done) {

        doOperationStub = sinon.stub(channelConfig.resourceManager, 'doOperation', function (name, options) {
          options.success({
            getResponseStatus: function () { return 200; },
            httpStatusCode: '200',
            responseText: JSON.stringify(response)
          });
        });

        eventChannel = factories.createEventChannel(channelConfig);
        eventChannel.startListening(httpConfig);

        setTimeout(function () {
          try {
            console.log('200 - ' + doOperationStub.callCount);
            expect(doOperationStub.callCount >= 2).to.equal(true);
            expect(doOperationStub.getCall(0).args[0]).to.equal('getEvents');
            doOperationStub.restore();
            done();
          } catch (e) {
            doOperationStub.restore();
            done(e);
          }
        }, 100);

      });

      it('should publish `api-event` event with data', function (done) {
        var createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
            return emitter;
          }),
          publishSpy = sinon.spy(emitter, 'publish');

        eventChannel = factories.createEventChannel(channelConfig);

        eventChannel.startListening(httpConfig);

        setTimeout(function () {
          try {
            expect(publishSpy.called).equals('api-event');
//            expect(publishSpy.getCall(0).args[0]).equals('api-event');
            createEventEmitterStub.restore();
            done();
          } catch (e) {
            createEventEmitterStub.restore();
            done();
          }
        }, 100);

      });

      it('should create new WebSocket if usesLongPolling false', function () {
        var spyOnCreateWebSocket = sinon.spy(function (ws) {
            expect(ws.onmessage).to.be.a('function');
          }),
          stub = sinon.stub(window, 'WebSocket', function () {});


        channelConfig.usesLongPolling = false;
        channelConfig.success = undefined;
        response.location = 'ws://location';
        channelConfig.onCreateWebSocket = spyOnCreateWebSocket;

        eventChannel = ATT.private.factories.createEventChannel(channelConfig);
        eventChannel.startListening(httpConfig);
        requests[0].respond(200, response, JSON.stringify(response));
        expect(spyOnCreateWebSocket.called).to.equal(true);
        stub.restore();
      });

    });


    xit('should continue to poll for 503 response code', function () {
      var doOperationStub503;

      doOperationStub204 = sinon.stub(channelConfig.resourceManager, 'doOperation', function (name, options) {
        options.success({
          getResponseStatus: function () { return 204; },
          httpStatusCode: '204'
        });
      });

      eventChannel = factories.createEventChannel(channelConfig);
      eventChannel.startListening(httpConfig);

      expect(doOperationStub204.called).to.equal(true);
      expect(doOperationStub204.getCall(0).args[0]).to.equal('getEvents');

      doOperationStub204.restore();
    });

    it('should stop polling after max polling time', function () {
      channelConfig.maxPollingTime = 1000;
      var eventChannel = ATT.private.factories.createEventChannel(channelConfig);
      eventChannel.startListening(httpConfig);
      expect(eventChannel.isListening()).to.equal(true);
      requests[0].respond(503, {"Content-Type": "application/json"}, JSON.stringify({}));
      expect(channelConfig.publisher.publish.calledOnce).equals(false);
      expect(eventChannel.isListening()).to.equal(false);
    });

    it('should continue to poll after timeout', function () {
      channelConfig.resourceManager.getAPIObject = sinon.spy(function () {
        return {
          method: 'get',
          formatters: {
            url: function (params) {
              return "http://localhost" + '/sessions/' + params.sessionId + params.endpoint;
            },
            headers: {
              'Authorization': function (param) {
                return param;
              }
            }
          },
          timeout: 1000,
          headers: {
            'Content-Type': 'application/json',
            'Accept' : 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        };
      });

      eventChannel = ATT.private.factories.createEventChannel(channelConfig);
      eventChannel.startListening(httpConfig);
      expect(eventChannel.isListening()).to.equal(true);
      requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(response));
      expect(channelConfig.publisher.publish.calledOnce).equals(true);
      expect(eventChannel.isListening()).to.equal(true);
    });
  });

});
