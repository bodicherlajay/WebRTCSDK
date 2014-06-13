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
      onConnectingSpy,
      onConnectedSpy,
      onDisconnectedSpy;

    beforeEach(function () {
      session = new ATT.private.Session({
        token: 'dsfgdsdf',
        e911Id: 'sdfghfds'
      });

      onConnectingSpy = sinon.spy();
      onConnectedSpy = sinon.spy();
      onDisconnectedSpy = sinon.spy();

      session.on('connecting', onConnectingSpy);
      session.on('connected', onConnectedSpy);
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

    describe('Disconnect', function () {

      it('Should exist', function () {
        expect(session.disconnect).to.be.a('function');
      });

      it('Should execute the onDisconnected callback if no error', function () {
        session.disconnect();

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
  });
});
