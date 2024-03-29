/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 180 */
/*global Env, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, after, URL*/

'use strict';

describe('Event Manager', function () {
  var resourceManagerStub = {
    getLogger : function () {
      return {
        logDebug : function () { return; },
        logInfo: function () { return; }
      };
    }
  },
    factories;

  before(function () {
    factories = ATT.private.factories;
  });

  it('Should export factories.createEventManager', function () {
    expect(factories.createEventManager).to.be.a('function');
  });

  describe('Factory method', function () {
    it('should throw an error if `options` are invalid', function () {
      expect(factories.createEventManager.bind(factories, undefined)).to.throw('Invalid options');
      expect(factories.createEventManager.bind(factories, {})).to.throw('Invalid options');
      expect(factories.createEventManager.bind(factories, {
        dummy: 'test'
      })).to.throw('Must pass `options.resourceManager`');
      expect(factories.createEventManager.bind(factories, {
        resourceManager: {}
      })).to.throw('Must pass `options.channelConfig`');
      expect(factories.createEventManager.bind(factories, {
        resourceManager: {},
        channelConfig: {}
      })).to.not.throw(Error);
    });
  });

  describe('Methods', function () {
    var sessionId = 'sessionid',
      options,
      eventManager,
      eventChannel,
      createEvtChanStub,
      stopListeningSpy,
      emitterEM,
      createEventEmitterStub;

    before(function () {

      var channelConfig = {
        accessToken: 'abc',
        endpoint: '/events',
        sessionId: '123',
        resourceManager: {
          doOperation: function () {return; }
        },
        publicMethodName: 'getEvents',
        usesLongPolling: true
      };

      eventChannel = ATT.private.factories.createEventChannel(channelConfig);

      createEvtChanStub = sinon.stub(factories, 'createEventChannel', function () {
        return eventChannel;
      });

      emitterEM = factories.createEventEmitter();

      createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
        return emitterEM;
      });

      options = {
        resourceManager: resourceManagerStub,
        channelConfig: {
          type: 'test',
          endpoint: 'url'
        }
      };

      eventManager = factories.createEventManager(options);
    });

    after(function () {
      createEventEmitterStub.restore();
      createEvtChanStub.restore();
      createEventEmitterStub.restore();
    });

    describe('On', function () {

      it('Should exist', function () {
        expect(eventManager.on).to.be.a('function');
      });

      it('Should fail if event named in the topic is not recognized', function () {
        expect(eventManager.on.bind(eventManager, 'unknown')).to.throw(Error);
        expect(eventManager.on.bind(eventManager, 'unknown:12345')).to.throw(Error);
        expect(eventManager.on.bind(eventManager, 'session-open:12345')).not.to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy(),
          subscribeSpy,
          unsubscribeSpy;

        subscribeSpy = sinon.spy(emitterEM, 'subscribe');
        unsubscribeSpy = sinon.spy(emitterEM, 'unsubscribe');

        expect(eventManager.on.bind(eventManager, 'listening', fn)).to.not.throw(Error);
        expect(unsubscribeSpy.called).to.equal(true);
        expect(subscribeSpy.calledAfter(unsubscribeSpy)).to.equal(true);

        unsubscribeSpy.restore();
        subscribeSpy.restore();
      });

    });

    describe('off', function () {
      it('should exist', function () {
        expect(eventManager.off).to.be.a('function');
      });
      it('should call `emitter.unsubscribe` with the given `handler` and `event`', function () {
        var offUnsubscribeSpy = sinon.spy(emitterEM, 'unsubscribe'),
          name = 'topic',
          handler = function () { return; };

        eventManager.off(name, handler);

        expect(offUnsubscribeSpy.calledWith(name, handler)).to.equal(true);

        offUnsubscribeSpy.restore();
      });
    });

    describe('setup', function () {
      var onSpy,
        startListeningStub,
        onListeningSpy;

      before(function () {
        startListeningStub = sinon.stub(eventChannel, 'startListening', function () { return; });

        onSpy = sinon.spy(eventChannel, 'on');

        onListeningSpy = sinon.spy();
      });

      after(function () {
        startListeningStub.restore();
        onSpy.restore();
      });

      it('Should exist', function () {
        expect(eventManager.setup).to.be.a('function');
      });

      it('Should should throw and error if no session information', function () {
        expect(eventManager.setup.bind(eventManager, {})).to.throw(Error);
      });

      it('Should subscribe to events from the event channel', function () {
        eventManager.setup({
          sessionId: sessionId,
          token: 'token'
        });

        expect(onSpy.calledWith('api-event')).to.equal(true);
      });

      it('Should create event channel', function () {
        eventManager.setup({
          sessionId: sessionId,
          token: 'token'
        });

        expect(createEvtChanStub.called).to.equal(true);
      });

      it('Should publish `listening` after starting the event channel', function (done) {
        eventManager.on('listening', onListeningSpy);

        eventManager.setup({
          sessionId: sessionId,
          token: 'token'
        });

        setTimeout(function () {
          try {
            expect(onListeningSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);

      });

    });

    describe('stop', function () {

      beforeEach(function () {
        eventManager.setup({
          sessionId: sessionId,
          token: 'token'
        });
      });

      it('Should exist', function () {
        expect(eventManager.stop).to.be.a('function');
      });

      it('Should execute eventChannel.stopListening', function () {

        stopListeningSpy = sinon.spy(eventChannel, 'stopListening');

        eventManager.stop();

        expect(stopListeningSpy.called).to.equal(true);

        stopListeningSpy.restore();
      });

      it('Should publish stop-listening after stopping the event channel', function (done) {
        var onStopListeningSpy = sinon.spy();

        eventManager.on('stop-listening', onStopListeningSpy);

        eventManager.stop();

        setTimeout(function () {
          try {
            expect(onStopListeningSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });
    });

  });

  describe('Events', function () {

    var emitterEM,
      emitterEC,
      options,
      createEventEmitterStub,
      eventManager,
      eventChannel,
      createEvtChanStub,
      startListeningStub,
      publishSpy;

    beforeEach(function () {
      emitterEM = ATT.private.factories.createEventEmitter();
      createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
        return emitterEM;
      });

      publishSpy = sinon.spy(emitterEM, 'publish');

      options = {
        resourceManager: resourceManagerStub,
        channelConfig: {
          endpoint: '/events',
          type: 'longpolling'
        }
      };

      eventManager = factories.createEventManager(options);

      createEventEmitterStub.restore();

      emitterEC = factories.createEventEmitter();

      createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
        return emitterEC;
      });

      var channelConfig = {
        accessToken: 'abc',
        endpoint: '/events',
        sessionId: '123',
        resourceManager: {
          doOperation: function () { return; }
        },
        publicMethodName: 'getEvents',
        usesLongPolling: true
      };

      eventChannel = ATT.private.factories.createEventChannel(channelConfig);

      startListeningStub = sinon.stub(eventChannel, 'startListening', function () { return; });

      createEvtChanStub = sinon.stub(factories, 'createEventChannel', function () {
        return eventChannel;
      });

      eventManager.setup({
        sessionId: '1234',
        token: 'token'
      });

    });

    afterEach(function () {
      createEventEmitterStub.restore();
      createEvtChanStub.restore();
      startListeningStub.restore();
      publishSpy.restore();
    });


    describe('invitation-received', function () {

      var event,
        codecParser,
        codecStub;

      before(function () {
        codecParser = ATT.sdpFilter.getInstance();

        codecStub = sinon.stub(codecParser, 'getCodecfromSDP', function () {
          return [];
        });

        event = {
          from: 'sip:1111@icmn.api.att.net',
          resourceURL: '/RTC/v1/sessions/11111/calls/1234',
          state: 'invitation-received',
          sdp: 'abcd'
        };
      });

      after(function () {
        codecStub.restore();
      });

      it('should publish `invitation-received` with call information extracted from the event', function (done) {

        var invitationReceivedSpy = sinon.spy();

        eventManager.on('invitation-received:11111', invitationReceivedSpy);
        event.type = 'conferences';

        emitterEC.publish('api-event', event);

        setTimeout(function () {
          try {
            expect(invitationReceivedSpy.called).to.equal(true);
            expect(invitationReceivedSpy.getCall(0).args[0].type).to.equal('conference');
            expect(invitationReceivedSpy.getCall(0).args[0].id).to.equal('1234');
            expect(invitationReceivedSpy.getCall(0).args[0].from).to.equal('1111');
            expect(invitationReceivedSpy.getCall(0).args[0].mediaType).to.equal('video');
            expect(invitationReceivedSpy.getCall(0).args[0].sdp).to.equal(event.sdp);
            done();
          } catch (e) {
            done(e);
          }
        }, 50);
      });

    });

    describe('mod-received', function () {

      it('should publish event `media-modifications` with `remoteDescription` and `modificationId`', function (done) {
        var event = {
          'type': 'calls',
          'from': 'sip:1234@icmn.api.att.net',
          'resourceURL': '/RTC/v1/sessions/00000/calls/1111',
          'modId': '12345',
          'state': 'mod-received',
          'sdp': 'abc'
        };

        emitterEC.publish('api-event', event);

        setTimeout(function () {
          try {
            expect(publishSpy.calledWith('mod-received:1111', {
              id: '1111',
              remoteSdp: 'abc',
              modificationId: '12345'
            })).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });
    });

    describe('mod-terminated', function () {
      var event;

      describe('mod-terminated [Conference]', function () {
        it('should publish event `mod-terminated` with `type` conference, `remoteDescription`, `modificationId` for conference event', function (done) {
          event = {
            'type': 'conferences',
            'from': 'sip:1234@icmn.api.att.net',
            'resourceURL': '/RTC/v1/sessions/00000/conferences/1111',
            'modId': '12345',
            'state': 'mod-terminated',
            'sdp': 'abcdefg',
            'reason': 'success'
          };

          emitterEC.publish('api-event', event);

          setTimeout(function () {
            expect(publishSpy.calledWith('mod-terminated:1111', {
              id: '1111',
              type: 'conference',
              remoteSdp: 'abcdefg',
              modificationId: '12345',
              reason: 'success',
              from: event.from
            })).to.equal(true);
            done();
          }, 10);
        });
      });
      describe('mod-terminated [Call]', function () {

        it('should publish event `mod-terminated` with `type` call and `remoteDescription` and `modificationId` for calls event', function (done) {
          event = {
            'type': 'calls',
            'from': 'sip:1234@icmn.api.att.net',
            'resourceURL': '/RTC/v1/sessions/00000/calls/1111',
            'modId': '12345',
            'state': 'mod-terminated',
            'sdp': 'abcdefg',
            'reason': 'success'
          };

          emitterEC.publish('api-event', event);

          setTimeout(function () {
            expect(publishSpy.called).to.equal(true);
            expect(publishSpy.calledWith('mod-terminated:1111', {
              id : '1111',
              type: 'call',
              remoteSdp: 'abcdefg',
              modificationId: '12345',
              reason: 'success',
              from: event.from
            }
              )).to.equal(true);
            done();
          }, 10);
        });

      });
    });

    describe('session-open', function () {
      var event;

      it('should publish `session-open` event with the call id and type `call` and remoteDescription for a calls event', function (done) {

        event = {
          type: 'calls',
          from: 'sip:1234@icmn.api.att.net',
          resourceURL: '/RTC/v1/sessions/0000/calls/1111',
          state: 'session-open',
          sdp: 'abc'
        };

        emitterEC.publish('api-event', event);

        setTimeout(function () {
          expect(publishSpy.calledWith('session-open:1111', {
            type: 'call',
            id: '1111',
            remoteSdp: event.sdp
          })).to.equal(true);
          done();
        }, 10);
      });

      it('should publish `session-open` event with type `conferences` and remoteDescription for a conferences event', function (done) {

        event = {
          type: 'conferences',
          from: 'sip:1234@icmn.api.att.net',
          resourceURL: '/RTC/v1/sessions/0000/conferences/1111',
          state: 'session-open',
          sdp: 'abc'
        };

        emitterEC.publish('api-event', event);

        setTimeout(function () {
          expect(publishSpy.calledWith('session-open:1111', {
            type: 'conference',
            id: '1111',
            remoteSdp: event.sdp
          })).to.equal(true);
          done();
        }, 10);
      });
    });

    describe('session-terminated', function () {
      var event;

      it('should publish `session-terminated` with call information extracted from the event', function (done) {
        event = {
          type: 'calls',
          from: 'sip:1111@icmn.api.att.net',
          resourceURL: '/RTC/v1/sessions/ccccc/calls/1234',
          state: 'session-terminated',
          reason: 'session-terminated'
        };

        emitterEC.publish('api-event', event);

        setTimeout(function () {
          try {
            expect(publishSpy.calledWith('session-terminated:1234')).to.equal(true);
            expect(publishSpy.getCall(1).args[1].id).to.equal('1234');
            expect(publishSpy.getCall(1).args[1].from).to.equal('1111');
            expect(publishSpy.getCall(1).args[1].reason).to.equal('session-terminated');
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });
    });
  });
});
