/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert*/

describe.only('Phone', function () {
  'use strict';

  var resourceManager = Env.resourceManager.getInstance(),
    doOperation,
    requests,
    phone;

  beforeEach(function () {

  });

  it('should export ATT.factories.createPhone', function () {
    expect(ATT.factories.createPhone).to.be.a('function');
  });

  describe('createPhone', function (){
    var sessionConstructorSpy;

    beforeEach(function () {
      sessionConstructorSpy = sinon.spy(ATT.private, 'Session');
      phone = ATT.factories.createPhone();
    });
    it('should create a Phone object', function () {
      expect(phone).to.be.an('object');
    });

    it('should create a session on the Phone object', function () {
      expect(sessionConstructorSpy.called).to.equal(true);
    });

    afterEach(function () {
      sessionConstructorSpy.restore();
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
      })
    });

    describe('login', function () {
      var session, options;

      beforeEach(function () {
        options = {
          token: '123',
          e911Id: '123'
        };
        session = phone.getSession();
      });
      it('should exist', function () {
        expect(phone.login).to.be.a('function');
      });

      it('should throw error if no token in options', function () {
        expect(phone.login.bind(phone)).to.throw('Options not defined');
        expect(phone.login.bind(phone, {})).to.throw('Token not defined');
        expect(phone.login.bind(phone, {token: '123'})).to.not.throw('Token not defined');
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
      it('should respond to `connected` event from Session', function () {
        var onConnectedSpy = sinon.spy();

        phone.login(options);

        setTimeout(function () {
          try {
            expect(onConnectedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
      it('should execute onSessionReady on getting `ready` event from Session');
    });
  });


});
