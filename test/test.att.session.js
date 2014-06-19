/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, Env, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit*/

describe('Session', function () {
  'use strict';

  var options,
    session,
    rtcManagerStub,
    createRTCMgrStub,
    connectSessionStub;

  beforeEach(function() {
    options = {
      token: 'dsfgdsdf',
      e911Id: 'sdfghfds'
    };
  });

  afterEach(function() {
  });

  it('Should have a public constructor under ATT.rtc', function () {
    expect(ATT.rtc.Session).to.be.a('function');
  });

  describe('Constructor', function () {
    var createRTCManagerSpy,
      session;

    beforeEach(function () {
      createRTCManagerSpy = sinon.spy(ATT.factories, 'createRTCManager');
      session = new ATT.rtc.Session(options);
    });

    afterEach(function () {
      createRTCManagerSpy.restore();
    });

    it('Should create a session object', function () {
      expect(session instanceof ATT.rtc.Session).to.equal(true);
    });

    it('should call ATT.factories.createRTCManager', function () {
      expect(createRTCManagerSpy.called).to.equal(true);
    });
  });


  describe('method', function () {
    var call,
      secondCall,
      onConnectingSpy,
      onConnectedSpy,
      onUpdatingSpy,
      onReadySpy,
      onDisconnectingSpy,
      onDisconnectedSpy,
      resourceManagerStub,
      onSessionReadyData;

    beforeEach(function () {
      onSessionReadyData = {test: 'test'};
      resourceManagerStub = {
        doOperation: function (options) {
        },
        getLogger : function () {
          return {
            logDebug : function () {},
            logInfo: function () {}
          };
        }
      };
      rtcManagerStub = ATT.factories.createRTCManager({
        userMediaSvc: {},
        rtcEvent: {},
        errorManager: {},
        peerConnSvc: {},
        resourceManager: resourceManagerStub
      });

      connectSessionStub = sinon.stub(rtcManagerStub, 'connectSession', function (options) {
        options.onSessionConnected({
          sessionId: 'sessionid',
          timeout: 100
        });
        options.onSessionReady(onSessionReadyData);
      });
      createRTCMgrStub = sinon.stub(ATT.factories, 'createRTCManager', function() {
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
      createRTCMgrStub.restore();
      connectSessionStub.restore();
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
          subscribeSpy = sinon.spy(ATT.event, 'subscribe');

        expect(session.on.bind(session, 'connected', fn)).to.not.throw(Error);
        expect(session.on.bind(session, 'disconnected', fn)).to.not.throw(Error);
        expect(subscribeSpy.called).to.equal(true);

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

      it('Should execute the onConnecting callback immediately', function (done) {
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

      describe('Connect session callbacks', function () {
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

        describe('onSessionConnected', function () {
          it('Should execute the setId on session with newly created session id', function () {
            expect(setIdSpy.calledWith('sessionid')).to.equal(true);
          });

          it('Should execute the update on session with newly created timeout', function () {
            expect(updateSpy.calledWith({timeout: 100})).to.equal(true);
          });
        })

        describe('onSessionReady', function () {
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

    });

    describe('setId', function () {

      it('Should execute the onConnected callback', function (done) {
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
      var options;
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
      })
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

      beforeEach(function() {
        session.addCall(call);
      });

      it('Should exist', function() {
        expect(session.getCall).to.be.a('function');
      });

      it('Should return a call by id', function () {
        expect(session.getCall(call.id)).to.equal(call);
      });

      it('Should return undefined if the call doesn\'t exist', function () {
        expect(session.getCall('11111')).to.equal(undefined);
      });

    });

    describe('Disconnect', function () {

      it('Should exist', function () {
        expect(session.disconnect).to.be.a('function');
      });

      it('Should execute the onDisconnecting callback immediately', function (done) {
        session.disconnect();

        setTimeout(function () {
          try {
            expect(onDisconnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });

    describe('TerminateCalls', function () {

      beforeEach(function() {
        session.addCall(call);
        session.addCall(secondCall);
      });

      it('Should exist', function () {
        expect(session.terminateCalls).to.be.a('function');
      });

      it('Should call disconnect on all calls in the session', function () {
        var disconnectSpy1 = sinon.spy(call, 'disconnect');
        var disconnectSpy2 = sinon.spy(secondCall, 'disconnect');

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

    describe('NeedsRefresh', function () {

      it('Should be triggered 60 000 ms before timeout');

      it('Should be triggered exactly after `timeout` milliseconds if `timeout` is less that 60 000 ms');

    });

  });

});
