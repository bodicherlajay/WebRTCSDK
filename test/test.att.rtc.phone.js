/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert*/

describe('Phone', function () {
  'use strict';

  var phone;

  it('should export ATT.private.Phone', function () {
    expect(ATT.private.Phone).to.be.a('function');
  });


  describe('Constructor', function () {
    var sessionConstructorStub;

    beforeEach(function () {
      sessionConstructorStub = sinon.stub(ATT.private, 'Session');
      phone = new ATT.private.Phone();
    });

    it('should create a Phone object', function () {
      expect(phone instanceof ATT.private.Phone).to.equal(true);
    });

    it('should create a session on the Phone object', function () {
      expect(sessionConstructorStub.called).to.equal(true);
    });

    afterEach(function () {
      sessionConstructorStub.restore();
    });

  });

  describe('Methods', function () {

    describe('getSession', function () {

      it('should exist', function () {
        expect(phone.getSession).to.be.a('function');
      });

      it('should return an instance of ATT.private.Session', function () {
        var session = phone.getSession();
        expect(session instanceof ATT.private.Session).to.equal(true);
      });

    });

    describe('login', function () {
      var session,
        options,
        onReadySpy;

      beforeEach(function () {
        onReadySpy = sinon.spy();
        options = {
          token: '123',
          e911Id: '123',
          onReady: onReadySpy
        };
        session = phone.getSession();
      });

      it('should exist', function () {
        expect(phone.login).to.be.a('function');
      });

      it('should throw error if no token in options', function () {
        expect(phone.login.bind(phone)).to.throw('Options not defined');
        expect(phone.login.bind(phone, {})).to.throw('Token not defined');
        expect(phone.login.bind(phone, {
          token: '123'
        })).to.not.throw('Token not defined');
      });

      it('should register for event `ready` from Session', function () {
        var  onSpy = sinon.spy(session, 'on');

        phone.login(options);

        expect(onSpy.getCall(0).args[0]).to.equal('ready');

        onSpy.restore();
      });

      it('should execute Session.connect', function () {
        var connectSpy = sinon.spy(session, 'connect');

        phone.login(options);

        expect(connectSpy.called).to.equal(true);

        connectSpy.restore();
      });

      it('should trigger `onReady` callback on receiving the `ready` event from Session', function (done) {
        phone.login(options);

        setTimeout(function () {
          try {
            expect(onReadySpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

    });
  });

});
