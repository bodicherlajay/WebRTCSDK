/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global WebSocket: true, ATT, Env, describe, xit, it, afterEach, beforeEach, before, sinon, expect*/

/**
 * Unit tests for event channel module.
 */
describe('Event Channel', function () {
  'use strict';

  var resourceManager = {
      doOperation: function () {}
    },
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
    var doOperationStub;

    beforeEach(function () {
      doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) {
        options.success();
      });
    });
    afterEach(function () {
      doOperationStub.restore();
    });
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
      createEventChannelSpy.restore();
    });

    it('should return an EventChannel object', function () {
      eventChannel = factories.createEventChannel(channelConfig);
      expect(eventChannel).to.be.an('object');
    });
  });

  describe('On', function () {

    var emitter,
      createEventEmitterStub,
      doOperationStub;

    beforeEach(function () {
      doOperationStub = sinon.stub(resourceManager, 'doOperation', function () {});
      emitter = factories.createEventEmitter();
      createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitter;
      });
      eventChannel = factories.createEventChannel(channelConfig);
    });

    afterEach(function () {
      createEventEmitterStub.restore();
      doOperationStub.restore();
    });

    it('Should exist', function () {
      expect(eventChannel.on).to.be.a('function');
    });

    it('Should throw an Error if event is not recognized', function () {
      expect(eventChannel.on.bind(eventChannel, 'unknown')).to.throw('Event not defined');
    });

    it('should throw an Error if `handler` is not a function', function () {
      expect(eventChannel.on.bind(eventChannel, 'api-event', '234')).to.throw('Handler is not a function');
    });

    it('Should register callback for known events', function () {
      var handler = sinon.spy(),
        unsubscribeSpy = sinon.spy(emitter, 'unsubscribe'),
        subscribeSpy = sinon.spy(emitter, 'subscribe');

      expect(eventChannel.on.bind(eventChannel, 'api-event', handler)).to.not.throw(Error);
      expect(unsubscribeSpy.called).to.equal(true);
      expect(subscribeSpy.calledAfter(unsubscribeSpy)).to.equal(true);

      unsubscribeSpy.restore();
      subscribeSpy.restore();
    });
  });

  describe('startListening', function () {

    var emitter,
      doOperationStub;

    beforeEach(function () {
      emitter = factories.createEventEmitter();
    });

    it('should exist', function () {
      doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) {
        return;
      });

      eventChannel = factories.createEventChannel(channelConfig);

      expect(eventChannel.startListening).to.be.a('function');

      doOperationStub.restore();
    });
    it('should change `isListening` flag to true', function () {

      doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) {
        return;
      });

      eventChannel = factories.createEventChannel(channelConfig);
      eventChannel.startListening(httpConfig);

      expect(eventChannel.isListening()).to.equal(true);

      doOperationStub.restore();
      eventChannel.stopListening();
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

      eventChannel.stopListening();
      doOperationStub.restore();
    });

    describe('Success on `doOperation`', function () {

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
            eventChannel.stopListening();
            done();
          } catch (e) {
            doOperationStub.restore();
            eventChannel.stopListening();
            done(e);
          }
        }, 100);

      });

      it('should publish `api-event` event with data', function (done) {

        var createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
            return emitter;
          }),
          onAPIEventSpy = sinon.spy(),
          eventData = response,
          mockedDataStr,
          responseDataStr;

        doOperationStub = sinon.stub(channelConfig.resourceManager, 'doOperation', function (name, options) {
          options.success({
            getResponseStatus: function () { return 200; },
            httpStatusCode: '200',
            responseText: JSON.stringify(eventData)
          });
        });

        eventChannel = factories.createEventChannel(channelConfig);

        eventChannel.on('api-event', onAPIEventSpy);

        eventChannel.startListening(httpConfig);

        setTimeout(function () {
          try {
            expect(onAPIEventSpy.called).equals(true);

            responseDataStr = JSON.stringify(onAPIEventSpy.getCall(0).args[0]);
            mockedDataStr = JSON.stringify(eventData.events.eventList[0].eventObject);

            expect(responseDataStr).equals(mockedDataStr);

            createEventEmitterStub.restore();
            doOperationStub.restore();
            eventChannel.stopListening();
            done();
          } catch (e) {
            doOperationStub.restore();
            createEventEmitterStub.restore();
            eventChannel.stopListening();
            done(e);
          }
        }, 100);

      });




    });


    xit('should stop polling after max polling time', function () {
      channelConfig.maxPollingTime = 1000;
      var eventChannel = ATT.private.factories.createEventChannel(channelConfig);
      eventChannel.startListening(httpConfig);
      expect(eventChannel.isListening()).to.equal(true);
      requests[0].respond(503, {"Content-Type": "application/json"}, JSON.stringify({}));

      expect(channelConfig.publisher.publish.calledOnce).equals(false);
      expect(eventChannel.isListening()).to.equal(false);

      eventChannel.stopListening();
    });

    xit('should continue to poll after timeout', function () {
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

      eventChannel.stopListening();
    });

    describe('Error on `doOperation`', function () {

      it('should retry polling if there\'s an error (HTTP Status Code != 200', function (done) {

        var doOperationStub503;

        doOperationStub503 = sinon.stub(channelConfig.resourceManager, 'doOperation', function (name, options) {
          options.error({
            getResponseStatus: function () { return 503; },
            httpStatusCode: '503'
          });
        });

        console.log('Error:' + doOperationStub503.callCount);

        eventChannel = factories.createEventChannel(channelConfig);
        eventChannel.startListening(httpConfig);

        setTimeout(function () {
          try {
            console.log('Error:' + doOperationStub503.callCount);
            expect(doOperationStub503.callCount >= 2).to.equal(true);
            expect(doOperationStub503.getCall(0).args[0]).to.equal('getEvents');
            doOperationStub503.restore();
            eventChannel.stopListening();
            done();
          } catch (e) {
            doOperationStub503.restore();
            eventChannel.stopListening();
            done(e);
          }
        }, 100);
      });
    });

  });

});
