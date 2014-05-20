/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global WebSocket: true, ATT, describe, xit, it, afterEach, beforeEach, before, sinon, expect*/

/**
 * Unit tests for event channel module.
 */
describe('Event Channel', function () {
  'use strict';

  describe('ATT.utils namespace', function () {
    it('should have factory method to create an eventChannel at ATT.utils.createEventChannel', function () {
      expect(ATT.utils.createEventChannel).to.be.a('function');
    });
  });

  describe('Event Channel factory method', function () {

    var channelConfig, eventChannel;

    beforeEach(function () {
      // template configuration object to initialize the Event Channel
      channelConfig = {
        accessToken: 'my token',
        endpoint: '/events',
        sessionId: 'sessionId',
        publisher: {
          publish: sinon.spy()
        },
        publicMethodName: 'publicMethodName',
        usesLongPolling: true
      };
      // Mock for the resource manager
      channelConfig.resourceManager = {
        addPublicMethod: function () { return true; }
      };
    });

    it('should throw error if the config options are invalid', function () {
      channelConfig = { invalid: 'invalid options'};
      expect(ATT.utils.createEventChannel.bind(ATT.utils, channelConfig)).to.throw(Error);
    });
    it('should return a valid eventChannel given config options', function () {
      eventChannel = ATT.utils.createEventChannel(channelConfig);
      expect(eventChannel).to.be.an('object');
    });
    describe('Event Channel Object', function () {
      var response, messages = {};

      beforeEach(function () {
        // stub the resourceManager
        channelConfig.resourceManager.getAPIObject = sinon.spy(function () {
          return {
            getEvents: sinon.spy()
          };
        });
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
      });

      it('should have a method: `startListening`', function () {
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        expect(eventChannel.startListening).to.be.a('function');
      });
      xit('should call resourceManager.doOperation on `startListening` and change `isListening` flag to true', function () {
        channelConfig.resourceManager.doOperation = sinon.spy();
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        eventChannel.startListening();
        expect(channelConfig.resourceManager.doOperation.called).to.equal(true);
        expect(eventChannel.isListening()).to.equal(true);
      });
      xit('should call publisher.publish  given a event (long polling)', function () {
        channelConfig.resourceManager.doOperation = sinon.spy();
        channelConfig.usesLongPolling = true;
        // create the event channel, after this, the event channel will have
        // a success and an error callback
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        eventChannel.startListening = sinon.spy();
        // call the success callback for this event channel
        messages.responseText = JSON.stringify(response);
        //channelConfig.success(messages);
        expect(channelConfig.publisher.publish.called).to.equal(true);
        expect(channelConfig.resourceManager.doOperation.called).to.equal(true);
      });
      xit('should log error detail if polling fails (long polling)', function () {
        var error = {message: 'FATAL ERROR!!!'};
        // fake the console
        console.log = sinon.spy();
        channelConfig.usesLongPolling = true;
        // create the event channel, after this, the event channel will have
        // a success and an error callback
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        channelConfig.error(error);
        expect(console.log.calledWith('ERROR: Network Error: ' + JSON.stringify(error))).to.equal(true);
      });
      xit('should retry polling on timeout (long polling)', function () {
        channelConfig.resourceManager.doOperation = sinon.spy();
        channelConfig.usesLongPolling = true;
        // create the event channel, after this, the event channel will have
        // a success and an error callback
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        channelConfig.ontimeout();
        expect(channelConfig.resourceManager.doOperation.called).to.equal(true);
      });
      it('should continue listening for messages on error or timeout');
      xit('should create a websockets with the given location', function () {
        channelConfig.usesLongPolling = false;
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        // setup the response
        response = {
          getResponseHeader: function () {
            return 'localhost';
          }
        };
        // mock the WebSocket constructor
        WebSocket = sinon.spy();

        // call the success callback for this event channel
        channelConfig.success(response);
        expect(WebSocket.calledWith('localhost')).to.equal(true);
      });
      it('should publish an event given a message on the open socket');
    });
  });
});
