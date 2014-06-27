/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, Env, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit*/

describe.only('Session', function () {
  'use strict';

  var options;

  beforeEach(function () {
    options = {
      token: 'dsfgdsdf',
      e911Id: 'sdfghfds'
    };
  });

  it('Should have a public constructor under ATT.rtc', function () {
    expect(ATT.rtc.Session).to.be.a('function');
  });

  describe('Constructor', function () {
    var session,
      createEventEmitterSpy,
      getRTCManagerStub;

    beforeEach(function () {
      createEventEmitterSpy = sinon.spy(ATT.private.factories, 'createEventEmitter');
      getRTCManagerStub = sinon.stub(ATT.private.RTCManager, 'getRTCManager', function () {
        return {};
      });
      session = new ATT.rtc.Session(options);
    });

    afterEach(function () {
      createEventEmitterSpy.restore();
      getRTCManagerStub.restore();
      session = null;
    });

    it('Should create a session object', function () {
      expect(session instanceof ATT.rtc.Session).to.equal(true);
    });

    it('should create an instance of event emitter', function () {
      expect(createEventEmitterSpy.called).to.equal(true);
    });

    it('should call ATT.private.RTCManager.getRTCManager', function () {
      expect(getRTCManagerStub.called).to.equal(true);
    });
  });

  describe('Methods', function () {
    var session,
      call,
      secondCall,
      emitter,
      onConnectingSpy,
      onConnectedSpy,
      onUpdatingSpy,
      onReadySpy,
      onDisconnectingSpy,
      onDisconnectedSpy,
      onSessionReadyData,
      createEventEmitterStub,
      createEventMgrStub,
      rtcManagerStub,
      createRTCMgrStub,
      connectSessionStub,
      disconnectSessionStub;

    beforeEach(function () {
      onSessionReadyData = {test: 'test'};

      emitter = ATT.private.factories.createEventEmitter();

      createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitter;
      });

      createEventMgrStub = sinon.stub(ATT.private.factories, 'createEventManager');

      rtcManagerStub = ATT.private.RTCManager.getRTCManager();

      connectSessionStub = sinon.stub(rtcManagerStub, 'connectSession', function (options) {
        options.onSessionConnected({
          sessionId: 'sessionid',
          timeout: 120000
        });
        options.onSessionReady(onSessionReadyData);
      });

      disconnectSessionStub = sinon.stub(rtcManagerStub, 'disconnectSession', function (options) {
        options.onSessionDisconnected();
      });

      createRTCMgrStub = sinon.stub(ATT.private.RTCManager, 'getRTCManager', function () {
        return rtcManagerStub;
      });

      session = new ATT.rtc.Session(options);

      call = new ATT.rtc.Call({
        id: '12345',
        peer: '12345',
        mediaType: 'audio'
      });

      secondCall = new ATT.rtc.Call({
        id: '98765',
        peer: '12452',
        mediaType: 'video'
      });

      onConnectingSpy = sinon.spy();
      onConnectedSpy = sinon.spy();
      onUpdatingSpy = sinon.spy();
      onReadySpy = sinon.spy();
      onDisconnectingSpy = sinon.spy();
      onDisconnectedSpy = sinon.spy();

      session.on('connecting', onConnectingSpy);
      session.on('connected', onConnectedSpy);
      session.on('updating', onUpdatingSpy);
      session.on('ready', onReadySpy);
      session.on('disconnecting', onDisconnectingSpy);
      session.on('disconnected', onDisconnectedSpy);
    });

    afterEach(function () {
      createEventEmitterStub.restore();
      createEventMgrStub.restore();
      createRTCMgrStub.restore();
      connectSessionStub.restore();
      disconnectSessionStub.restore();
    });

    describe('On', function () {

      it('Should exist', function () {
        expect(session.on).to.be.a('function');
      });

      it('Should fail if event is not recognized', function () {
        expect(session.on.bind(session, 'unknown')).to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy(),
          unsubscribeSpy = sinon.spy(emitter, 'unsubscribe'),
          subscribeSpy = sinon.spy(emitter, 'subscribe');

        expect(session.on.bind(session, 'connected', fn)).to.not.throw(Error);
        expect(session.on.bind(session, 'disconnected', fn)).to.not.throw(Error);

        expect(unsubscribeSpy.called).to.equal(true);
        expect(subscribeSpy.called).to.equal(true);

        unsubscribeSpy.restore();
        subscribeSpy.restore();
      });
    });

    describe('Connect', function () {

      it('Should exist', function () {
        expect(session.connect).to.be.a('function');
      });

      it('Should fail if no input options specified', function () {
        expect(session.connect.bind(session)).to.throw('No input provided');
        expect(session.connect.bind(session, {})).to.throw('No access token provided');
        expect(session.connect.bind(session, {token: '123'})).to.not.throw('No access token provided');
      });

      it('Should publish the `connecting` event immediately', function (done) {
        session.connect(options);

        setTimeout(function () {
          try {
            expect(onConnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);

      });

      it('should call connectSession on RTC Manager', function () {
        session.connect(options);

        expect(connectSessionStub.called).to.equal(true);
      });

      describe('Success on session.connect', function () {
        var setIdSpy,
          updateSpy;

        beforeEach(function () {
          setIdSpy = sinon.spy(session, 'setId');
          updateSpy = sinon.spy(session, 'update');

          session.connect(options);
        });

        afterEach(function () {
          setIdSpy.restore();
          updateSpy.restore();
        });

        it('Should set the id on session with newly created session id', function () {
          expect(setIdSpy.calledWith('sessionid')).to.equal(true);
        });

        it('Should execute the update on session with newly created timeout', function () {
          expect(updateSpy.calledWith({
            timeout: 120000
          })).to.equal(true);
        });

        it('should publish the ready event with data on session', function (done) {
          setTimeout(function () {
            try {
              expect(onReadySpy.calledWith(onSessionReadyData)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

      });

    });

    describe('Disconnect', function () {
      var onSetIdSpy;

      beforeEach(function () {
        onSetIdSpy = sinon.spy(session, 'setId');
        session.disconnect();
      });

      it('Should exist', function () {
        expect(session.disconnect).to.be.a('function');
      });

      it('Should trigger the disconnecting event immediately', function (done) {
        setTimeout(function () {
          try {
            expect(onDisconnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('Should execute RTCManager.disconnectSession', function () {
        expect(disconnectSessionStub.called).to.equal(true);
      });
      describe('Success on session.disconnect', function () {
        it('should execute setId(null) if successful', function () {
          expect(onSetIdSpy.called).to.equal(true);
          expect(onSetIdSpy.calledWith(null)).to.equal(true);
        });
      });

    });

    describe('setId', function () {

      it('Should publish the `connected` event', function (done) {
        var sessionId = '12345';

        session.setId(sessionId);

        setTimeout(function () {
          try {
            expect(onConnectedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('Should publish `disconnected` event if id is null', function (done) {

        session.setId(null);
        setTimeout(function () {
          try {
            expect(onDisconnectedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);

      });

    });

    describe('getId', function () {

      it('Should exist', function () {
        expect(session.getId).to.be.a('function');
      });

      it('Should return the session id', function () {
        session.setId('12345');
        expect(session.getId()).to.equal('12345');
      });
    });

    describe('Update', function () {
      beforeEach(function () {
        options = { timeout : 123};
      });

      it('Should exist', function () {
        expect(session.update).to.be.a('function');
      });

      it('Should throw and error if no options', function () {
        expect(session.update.bind(session)).to.throw('No options provided');
      });

      it('Should trigger onUpdating callback with options', function (done) {

        session.update(options);

        setTimeout(function () {
          try {
            expect(onUpdatingSpy.calledWith(options)).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      describe('timeout', function () {

        it('Should throw an error if the timeout value is not a number', function () {

          options.timeout = '123';
          expect(session.update.bind(session, options)).to.throw('Timeout is not a number.');

        });

        it('Should set the timeout', function () {
          session.update(options);
          expect(session.timeout).to.equal(123);
        });

        it('Should set an interval to publish `needs-refresh` event 60000 ms before timeout', function (done) {
          var onNeedsRefreshSpy = sinon.spy();
          options.timeout = 60200;
          session.on('needs-refresh', onNeedsRefreshSpy);
          session.update(options);
          expect(session.timer).to.be.a('number');
          setTimeout(function () {
            try {
              expect(onNeedsRefreshSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);

        });

      });
    });

    describe('createCall', function () {
      var callOpts;

      beforeEach(function () {
        callOpts = {
          peer: '12345'
        };
      });

      it('should exist', function () {
        expect(session.createCall).to.be.a('function');
      });

      it('should call ATT.rtc.Call', function () {
        var callConstructorSpy = sinon.spy(ATT.rtc, 'Call');

        session.createCall(callOpts);

        expect(callConstructorSpy.called).to.equal(true);

        callConstructorSpy.restore();
      });

      it('should return the newly created call object', function () {
        call = session.createCall(callOpts);
        expect(call instanceof ATT.rtc.Call).to.equal(true);
      });

      it('should set the currentCall as the newly created call', function () {
        call = session.createCall(callOpts);

        expect(session.currentCall).to.equal(call);
      });
    });

    describe('AddCall', function () {

      it('Should exist', function () {
        expect(session.addCall).to.be.a('function');
      });

      it('Should add a call to the session', function () {
        session.addCall(call);

        expect(session.getCall(call.id)).to.equal(call);
      });

    });

    describe('GetCall', function () {

      beforeEach(function () {
        session.addCall(call);
      });

      it('Should exist', function () {
        expect(session.getCall).to.be.a('function');
      });

      it('Should return a call by id', function () {
        expect(session.getCall(call.id)).to.equal(call);
      });

      it('Should return undefined if the call doesn\'t exist', function () {
        expect(session.getCall('11111')).to.equal(undefined);
      });

    });

    describe('TerminateCalls', function () {

      beforeEach(function () {
        session.addCall(call);
        session.addCall(secondCall);
      });

      it('Should exist', function () {
        expect(session.terminateCalls).to.be.a('function');
      });

      it('Should call disconnect on all calls in the session', function () {
        var disconnectSpy1 = sinon.spy(call, 'disconnect'),
          disconnectSpy2 = sinon.spy(secondCall, 'disconnect');

        session.terminateCalls();

        expect(disconnectSpy1.called).to.equal(true);
        expect(disconnectSpy2.called).to.equal(true);

        disconnectSpy1.restore();
        disconnectSpy2.restore();
      });

    });

    describe('DeleteCall', function () {

      beforeEach(function () {
        session.addCall(call);
      });

      it('Should exist', function () {
        expect(session.deleteCall).to.be.a('function');
      });

      it('Should throw an error if the call doesn\'t exist', function () {
        expect(session.deleteCall.bind(session, '00000')).to.throw('Call not found');
      });

      it('Should delete the call from the session', function () {
        var callId = call.id;
        session.deleteCall(callId);
        expect(session.getCall(callId)).to.equal(undefined);
      });

      it('Should fire oncallsterminated after the last call is deleted', function (done) {
        var onAllCallsTerminated = sinon.spy();

        session.on('allcallsterminated', onAllCallsTerminated);

        session.deleteCall(call.id);

        setTimeout(function () {
          try {
            expect(onAllCallsTerminated.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);

      });

    });

  });

  describe('Event', function () {
    var session2;

    beforeEach(function () {
      session2 = new ATT.rtc.Session(options);
    });

    afterEach(function () {
      session2 = null;
    });

    describe('NeedsRefresh', function () {

      xit('Should be triggered every 60000 ms before timeout', function (done) {

        var onNeedsRefreshSpy = sinon.spy();

        session2.on('needs-refresh', onNeedsRefreshSpy);
        options.timeout = 60200;
//        session2.update({
//          timeout: timeout
//        });
       // expect(onNeedsRefreshSpy.called).to.equal(false);

        setTimeout(function () {
          try {
           // for (i = 0; i < count; i++) {
            expect(onNeedsRefreshSpy.called).to.equal(true);
            //}
            done();
          } catch (e) {
            done(e);
          }
        }, 300);

        setTimeout(function () {
          try {
            // for (i = 0; i < count; i++) {
            expect(onNeedsRefreshSpy.calledTwice).to.equal(true);
            //}
            done();
          } catch (e) {
            done(e);
          }
        }, 600);

      });

      it('Should be triggered exactly after `timeout` milliseconds if `timeout` is less that 60 000 ms');

    });

  });

});
