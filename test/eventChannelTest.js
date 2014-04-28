/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global WebSocket: true, ATT, describe, it, afterEach, beforeEach, before, sinon, expect*/

/**
 * Unit tests for event channel module.
 */
describe.only('Event Channel', function () {
  'use strict';

  describe('ATT library', function () {
    it('should have factory method to create an eventChannel at ATT.utils.createEventChannel', function () {
      expect(ATT.utils.createEventChannel).to.be.a('function');
    });
  });

  describe('Event Channel factory method', function () {

    var channelConfig, eventChannel;

    beforeEach(function () {
      // template configuration object to initialize the Event Channel
      channelConfig = {
        method: 'validMethod',
        url: 'valid URL',
        timeout: 30000,
        headers: {
          'Header 1': 'A valid header'
        },
        accessToken: 'my token',
        success: function () { console.log('ERROR'); },
        error: function () { console.log('Success!!!'); },
        publisher: {
          publish: sinon.spy()
        },
        callback: sinon.spy()
      };

      // Mock for the resource manager
      channelConfig.resourceManager = {
        // getInstance: function () { return this; },
        addPublicMethod: function () { return true; }
      };
    });

    it('should throw error if the config options are invalid', function () {
      channelConfig = { invalid: 'invalid options'};
      expect(ATT.utils.createEventChannel.bind(ATT.utils, channelConfig)).to.throw('Invalid Options. Cannot create channel.');
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

      it('should have a method: `startListenning`', function () {
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        expect(eventChannel.startListenning).to.be.a('function');
      });
      it('should call resourceManager.doOperation on `startListenning` and change `isListenning` flag to true', function () {
        channelConfig.resourceManager.doOperation = sinon.spy();
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        eventChannel.startListenning();
        expect(true === channelConfig.resourceManager.doOperation.called);
        expect(true === eventChannel.isListenning());
      });
      it('should publish event given a message (long polling)', function () {
        channelConfig.usesLongPolling = true;
        // create the event channel, after this, the event channel will have
        // a success and an error callback
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        // call the success callback for this event channel
        messages.responseText = JSON.stringify(response);
        channelConfig.success(messages);
        expect(true === channelConfig.publisher.publish.called);
      });
      it('should publish event given a message (websockets)', function () {
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
        expect(true === channelConfig.publisher.publish.called);
      });
      it('should continue listening for messages on error or timeout');
      it('should call `addOperation` of the resourceManager', function () {
        channelConfig.resourceManager.addOperation = sinon.spy();
        expect(true === channelConfig.resourceManager.addOperation.called);
      });
    });
  });
});