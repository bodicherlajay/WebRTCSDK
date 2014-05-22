/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global WebSocket: true, ATT, describe, xit, it, afterEach, beforeEach, before, sinon, expect*/

/**
 * Unit tests for event channel module.
 */
describe('Event Channel', function () {
  'use strict';
  var resourceManager = Env.resourceManager.getInstance(),
    requests;

  beforeEach(function () {
    this.xhr = sinon.useFakeXMLHttpRequest();
    requests = [];

    this.xhr.onCreate = function (xhr) {
      requests.push(xhr);
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

  it('should call resourceManager.doOperation on `startListening` and change `isListening` flag to true', function () {
    var channelConfig = {
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

    var httpConfig = {
      params: {
        url: {sessionId: channelConfig.sessionId, endpoint: channelConfig.endpoint},
        headers: {
          'Authorization' : 'Bearer ' + channelConfig.accessToken
        }
      },
      success: sinon.spy(), //onSuccess.bind(this, config),
      error: sinon.spy(), //onError.bind(this, config),
      ontimeout: sinon.spy() //onTimeOut
    };

    var eventChannel = ATT.utils.createEventChannel(channelConfig);
    eventChannel.startListening(httpConfig);
    expect(eventChannel.isListening()).to.equal(true);
  });

});
