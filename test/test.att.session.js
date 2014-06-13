/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit*/

describe.only('Session', function () {
  
  it('Should have a public constructor under ATT.private', function () {
    expect(ATT.private.Session).to.be.a('function');
  });

  it('Should fail if no input options specified a session object', function () {
    var fn = function (options) {
      new ATT.private.Session(options);
    };
    expect(fn).to.throw('No input provided');
    expect(fn.bind(null, {})).to.throw('No access token provided');

  });

  it('Should create a session object', function () {
    var session = new ATT.private.Session({
      token: 'dsfgdsdf',
      e911Id: 'sdfghfds'
    });
    expect(session).to.be.an('object');
  });

  describe('method', function () {
    var session,
      call,
      secondCall,
      onConnectingSpy,
      onConnectedSpy,
      onDisconnectingSpy,
      onDisconnectedSpy;

    beforeEach(function () {
      session = new ATT.private.Session({
        token: 'dsfgdsdf',
        e911Id: 'sdfghfds'
      });

      call = new ATT.private.Call({
        id: '12345',
        peer: '12345',
        mediaType: 'audio'
      });

      secondCall = new ATT.private.Call({
        id: '98765',
        peer: '12452',
        mediaType: 'video'
      });

      onConnectingSpy = sinon.spy();
      onConnectedSpy = sinon.spy();
      onDisconnectingSpy = sinon.spy();
      onDisconnectedSpy = sinon.spy();

      session.on('connecting', onConnectingSpy);
      session.on('connected', onConnectedSpy);
      session.on('disconnecting', onDisconnectingSpy);
      session.on('disconnected', onDisconnectedSpy);

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

      it('Should execute the onConnecting callback immediately', function (done) {
        session.connect();

        setTimeout(function () {
          try {
            expect(onConnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);

      });

      it('Should execute the onConnected callback on updating the session id and expiration', function (done) {
        var sessionId = '12345',
          expiration = '10000';

        session.update({
          sessionId: sessionId,
          expiration: expiration
        });

        setTimeout(function () {
          try {
            expect(session.id).to.equal(sessionId);
            expect(session.expiration).to.equal(expiration);
            expect(onConnectedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
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

});
