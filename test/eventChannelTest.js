/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect*/

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
        error: function () { console.log('Success!!!'); }
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
      it('should have a method: `startListenning`', function () {
        eventChannel = ATT.utils.createEventChannel(channelConfig);
        expect(eventChannel.startListenning).to.be.a('function');
      });
      it('should fire the callback on message received');
      it('should publish event given a message');
      it('should call resourceManager.getEvents using (lp/ws)Config');
      it('should continue listening for messages on error or timeout');
      it('should call `addOperation` of the resourceManager', function () {
        channelConfig.resourceManager.addOperation = sinon.spy();
        expect(true === channelConfig.resourceManager.addOperation.called);
      });
    });
  });
});