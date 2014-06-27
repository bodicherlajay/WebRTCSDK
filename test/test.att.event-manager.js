/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL*/

'use strict';

describe.only('Event Manager', function () {
  var resourceManagerStub = {
    getLogger : function () {
      return {
        logDebug : function () {},
        logInfo: function () {}
      };
    }
  };

  it('Should export ATT.private.factories.createEventManager', function () {
    expect(ATT.private.factories.createEventManager).to.be.a('function');
  });

  describe('Method', function () {
    var sessionId = 'sessionid',
      options,
      eventManager,
      eventChannelStub,
      createEvtChanStub,
      stopListeningSpy,
      factories,
      emitter;

    beforeEach(function () {
      factories = ATT.private.factories;
      stopListeningSpy = sinon.spy();

      eventChannelStub = {
        startListening: function (options) {
          options.success();
        },
        stopListening: stopListeningSpy
      };

      createEvtChanStub = sinon.stub(ATT.utils, 'createEventChannel', function () {
        return eventChannelStub;
      });

      emitter = factories.createEventEmitter();
      options = {
        emitter: emitter,
        rtcEvent: {},
        errorManager: {},
        resourceManager: resourceManagerStub
      };
      eventManager = ATT.private.factories.createEventManager(options);

    });

    afterEach(function () {
      createEvtChanStub.restore();
    });

    describe('on', function () {

      it('Should exist', function () {
        expect(eventManager.on).to.be.a('function');
      });

      it('Should fail if event is not recognized', function () {
        expect(eventManager.on.bind(eventManager, 'unknown')).to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy(),
          subscribeSpy;

        subscribeSpy = sinon.spy(emitter, 'subscribe');

        expect(eventManager.on.bind(eventManager, 'listening', fn)).to.not.throw(Error);
        expect(subscribeSpy.called).to.equal(true);

        subscribeSpy.restore();
      });
    });

    describe('setup', function () {
      var subscribeSpy,
        onListeningSpy;

      beforeEach(function () {
        ATT.appConfig = {
          EventChannelConfig: {
            endpoint: 'endpoint',
            type: 'longpolling'
          }
        };

        subscribeSpy = sinon.spy(emitter, 'subscribe');

        onListeningSpy = sinon.spy();
      });

      afterEach(function () {
        subscribeSpy.restore();
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

        expect(subscribeSpy.called).to.equal(true);
        expect(subscribeSpy.getCall(0).args[0]).to.equal(sessionId + '.responseEvent');
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
        }, 100);

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
        eventManager.stop();

        expect(stopListeningSpy.called).to.equal(true);
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
        }, 100);
      });
    });
  });
});