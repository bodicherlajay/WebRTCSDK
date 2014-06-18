/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL*/

describe('Event Manager', function () {
  var resourceManagerStub = {
    getLogger : function () {
      return {
        logDebug : function () {},
        logInfo: function () {}
      };
    }
  };

  it('Should export ATT.factories.createEventManager', function () {
    expect(ATT.factories.createEventManager).to.be.a('function');
  });

  describe('Method', function () {
    var sessionId = 'sessionid',
      options = {
        rtcEvent: {},
        errorManager: {},
        resourceManager: resourceManagerStub
      },
    eventManager = ATT.factories.createEventManager(options);

    describe('on', function () {

      it('Should exist', function () {
        expect(eventManager.on).to.be.a('function');
      });

      it('Should fail if event is not recognized', function () {
        expect(eventManager.on.bind(eventManager, 'unknown')).to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy(),
          subscribeSpy = sinon.spy(ATT.event, 'subscribe');

        expect(eventManager.on.bind(eventManager, 'listening', fn)).to.not.throw(Error);
        expect(subscribeSpy.called).to.equal(true);

        subscribeSpy.restore();
      });
    });

    describe('setup', function () {
      var subscribeSpy,
        createEvtChanStub,
        onListeningSpy;

      beforeEach(function () {

        ATT.appConfig = {
          EventChannelConfig: {
            endpoint: 'endpoint',
            type: 'longpolling'
          }
        };

        subscribeSpy = sinon.spy(ATT.event, 'subscribe');
        createEvtChanStub = sinon.stub(ATT.utils, 'createEventChannel', function () {
          return {
            startListening: function (options) {
              options.success();
            }
          }
        });
        onListeningSpy = sinon.spy();
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

      afterEach(function () {
        subscribeSpy.restore();
        createEvtChanStub.restore();
      })
    });

  });
});