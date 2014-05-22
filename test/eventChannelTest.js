/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global WebSocket: true, ATT, describe, xit, it, afterEach, beforeEach, before, sinon, expect*/

/**
 * Unit tests for event channel module.
 */
describe.only('Event Channel', function () {
  'use strict';
  var resourceManager = Env.resourceManager.getInstance(),
    requests, response, channelConfig, httpConfig;
  beforeEach(function () {
    this.xhr = sinon.useFakeXMLHttpRequest();
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
    this.xhr.onCreate = function (xhr) {
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
    this.xhr.restore();
  });

  describe('ATT.utils namespace', function () {
    it('should have factory method to create an eventChannel at ATT.utils.createEventChannel', function () {
      expect(ATT.utils.createEventChannel).to.be.a('function');
    });
  });

  it('should `startListening` and change `isListening` flag to true', function () {
    var eventChannel = ATT.utils.createEventChannel(channelConfig);
    eventChannel.startListening(httpConfig);
    expect(eventChannel.isListening()).to.equal(true);
  });

  it('should process successful response', function () {
    var eventChannel = ATT.utils.createEventChannel(channelConfig);
    eventChannel.startListening(httpConfig);
    expect(eventChannel.isListening()).to.equal(true);
    requests[0].respond(200, {"Content-Type": "application/json"}, JSON.stringify(response));
    expect(channelConfig.publisher.publish.calledOnce).equals(true);
  });

  it('should continue to poll for No content response', function () {
    var eventChannel = ATT.utils.createEventChannel(channelConfig);
    eventChannel.startListening(httpConfig);
    expect(eventChannel.isListening()).to.equal(true);
    requests[0].respond(204, {"Content-Type": "application/json"}, JSON.stringify({}));
    expect(channelConfig.publisher.publish.calledOnce).equals(false);
  });

  it('should continue to poll for 503 response code', function () {
    var eventChannel = ATT.utils.createEventChannel(channelConfig);
    eventChannel.startListening(httpConfig);
    expect(eventChannel.isListening()).to.equal(true);
    requests[0].respond(503, {"Content-Type": "application/json"}, JSON.stringify({}));
    expect(channelConfig.publisher.publish.calledOnce).equals(false);
  });

  it('should stop polling after max polling time', function () {
    channelConfig.maxPollingTime = 1000;
    var eventChannel = ATT.utils.createEventChannel(channelConfig);
    eventChannel.startListening(httpConfig);
    expect(eventChannel.isListening()).to.equal(true);
    requests[0].respond(503, {"Content-Type": "application/json"}, JSON.stringify({}));
    expect(channelConfig.publisher.publish.calledOnce).equals(false);
    expect(eventChannel.isListening()).to.equal(false);
  });
});
