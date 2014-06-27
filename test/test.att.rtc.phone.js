/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert*/

describe('Phone', function () {
  'use strict';

  var getRTCMgrStub;

  beforeEach(function () {
    getRTCMgrStub = sinon.stub(ATT.private.RTCManager, 'getRTCManager', function () {
      return {};
    });
  });

  afterEach(function () {
    getRTCMgrStub.restore();
  });

  describe('Singleton', function () {
    var phone;

    it('should export ATT.rtc.Phone', function () {
      expect(ATT.rtc.Phone).to.be.a('object');
    });

    it('should have a method getPhone', function () {
      expect(ATT.rtc.Phone.getPhone).to.be.a('function');
    });

    it('should return an instance of ATT.private.Phone', function () {
      phone = ATT.rtc.Phone.getPhone();
      expect(phone instanceof ATT.private.Phone).to.equal(true);
    });

    it('should always return the same instance', function () {
      var phone1 = ATT.rtc.Phone.getPhone(),
        phone2 = ATT.rtc.Phone.getPhone();
      expect(phone1 === phone2).to.equal(true);
    });

  });

  describe('Pseudo Class', function () {

    it('should export ATT.private.Phone', function () {
      expect(ATT.private.Phone).to.be.a('function');
    });

    describe('ATT.private.Phone Constructor', function () {
      var phone,
        createEventEmitterSpy,
        sessionConstructorSpy;

      beforeEach(function () {
        createEventEmitterSpy = sinon.spy(ATT.private, 'createEventEmitter');
        sessionConstructorSpy = sinon.spy(ATT.rtc, 'Session');

        phone = new ATT.private.Phone();

      });

      afterEach(function () {
        createEventEmitterSpy.restore();
        sessionConstructorSpy.restore();
      });

      it('should create a Phone object', function () {
        expect(phone instanceof ATT.private.Phone).to.equal(true);
      });

      it('should create an instance of event emitter', function () {
        expect(createEventEmitterSpy.called).to.equal(true);
      });

      it('should create a session on the Phone object', function () {
        expect(sessionConstructorSpy.called).to.equal(true);
      });

    });

    describe('Methods', function () {

      var phone,
        emitter,
        createEventEmitterStub;

      beforeEach(function () {
        emitter = ATT.private.factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
          return emitter;
        });

        phone = new ATT.private.Phone();
      });

      afterEach(function () {
        createEventEmitterStub.restore();
      });

      describe('getSession', function () {

        it('should exist', function () {
          expect(phone.getSession).to.be.a('function');
        });

        it('should return an instance of ATT.rtc.Session', function () {
          var session = phone.getSession();
          expect(session instanceof ATT.rtc.Session).to.equal(true);
        });

      });

      describe('on', function () {

        it('should exist', function () {
          expect(phone.on).to.be.a('function');
        });

        it('Should fail if event is not recognized', function () {
          expect(phone.on.bind(phone, 'unknown')).to.throw(Error);
        });

        it('Should register callback for known events', function () {
          var fn = sinon.spy(),
            unsubscribeSpy = sinon.spy(emitter, 'unsubscribe'),
            subscribeSpy = sinon.spy(emitter, 'subscribe');

          expect(phone.on.bind(phone, 'session-ready', fn)).to.not.throw(Error);
          expect(unsubscribeSpy.called).to.equal(true);
          expect(subscribeSpy.called).to.equal(true);

          unsubscribeSpy.restore();
          subscribeSpy.restore();
        });
      });

      describe('login', function () {
        var session,
          onSpy,
          connectStub,
          options,
          data,
          onSessionReadySpy;

        beforeEach(function () {
          onSessionReadySpy = sinon.spy();

          options = {
            token: '123',
            e911Id: '123'
          };

          phone = new ATT.private.Phone();

          phone.on('session-ready', onSessionReadySpy);
          session = phone.getSession();

          data = {
            test: 'test'
          };

          onSpy = sinon.spy(session, 'on');

          connectStub = sinon.stub(session, 'connect', function () {
            emitter.publish('ready', data);
          });

          phone.login(options);
        });

        afterEach(function () {
          onSpy.restore();
          connectStub.restore();
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
          expect(onSpy.calledWith('ready')).to.equal(true);
        });

        it('should execute Session.connect', function () {
          expect(connectStub.called).to.equal(true);
        });

        it('should trigger `session-ready` event with data on receiving the `ready` event from Session', function (done) {
          setTimeout(function () {
            try {
              expect(onSessionReadySpy.calledWith(data)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

      });

      describe('logout', function () {

        var session,
          onSpy,
          disconnectStub,
          onSessionDisconnectedSpy;

        beforeEach(function () {
          phone = new ATT.private.Phone();
          session = phone.getSession();

          onSessionDisconnectedSpy = sinon.spy();
          onSpy = sinon.spy(session, 'on');

          disconnectStub = sinon.stub(session, 'disconnect', function () {
            emitter.publish('disconnected');
          });

          phone.on('session-disconnected', onSessionDisconnectedSpy);

          // logout checks for session id
          session.id = 'sessionid';

          phone.logout();
        });

        afterEach(function () {
          onSpy.restore();
          disconnectStub.restore();
        });

        it('Should exist', function () {
          expect(phone.logout).to.be.a('function');
        });

        it('should register for event `disconnected` from Session', function () {
          expect(onSpy.calledWith('disconnected')).to.equal(true);
        });

        it('Should execute Session.disconnect', function () {
          expect(disconnectStub.called).to.equal(true);
        });

        it('Should publish event `session-disconnected` on receiving a `disconnected` event from Session', function (done) {
          setTimeout(function () {
            try {
              expect(onSessionDisconnectedSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

      });

      describe('dial', function () {

        var session,
          options,
          call,
          createCallStub,
          onSpy,
          callConnectStub,
          callDialingHandlerSpy,
          callConnectingHandlerSpy,
          callCanceledHandlerSpy,
          callRejectedHandlerSpy,
          callConnectedHandlerSpy,
          callEstablishedHandlerSpy,
          callEndedHandlerSpy,
          callErrorHandlerSpy;

        beforeEach(function () {

          options = {
            destination: '12345',
            mediaType: 'audio'
          };

          call = new ATT.rtc.Call({
            peer: '1234567'
          });

          onSpy = sinon.spy(call, 'on');

          callConnectStub = sinon.stub(call, 'connect', function () {
            emitter.publish('dialing');
            emitter.publish('connecting');
            emitter.publish('canceled');
            emitter.publish('rejected');
            emitter.publish('connected');
            emitter.publish('established');
            emitter.publish('ended');
            emitter.publish('error');
          });

          session = phone.getSession();

          createCallStub = sinon.stub(session, 'createCall', function () {
            return call;
          });

          callDialingHandlerSpy = sinon.spy();
          callConnectingHandlerSpy = sinon.spy();
          callCanceledHandlerSpy = sinon.spy();
          callRejectedHandlerSpy = sinon.spy();
          callConnectedHandlerSpy = sinon.spy();
          callEstablishedHandlerSpy = sinon.spy();
          callEndedHandlerSpy = sinon.spy();
          callErrorHandlerSpy = sinon.spy();

          phone.on('call-dialing', callDialingHandlerSpy);
          phone.on('call-connecting', callConnectingHandlerSpy);
          phone.on('call-canceled', callCanceledHandlerSpy);
          phone.on('call-rejected', callRejectedHandlerSpy);
          phone.on('call-connected', callConnectedHandlerSpy);
          phone.on('call-established', callEstablishedHandlerSpy);
          phone.on('call-ended', callEndedHandlerSpy);
          phone.on('call-error', callErrorHandlerSpy);

          phone.dial(options);
        });

        afterEach(function () {
          onSpy.restore();
          callConnectStub.restore();
          createCallStub.restore();
        });

        it('should exist', function () {
          expect(phone.dial).to.be.a('function');
        });

        it('should throw an error if options are invalid', function () {
          expect(phone.dial).to.throw('Options not defined');
          expect(phone.dial.bind(phone, {})).to.throw('Destination not defined');
          expect(phone.dial.bind(phone, {
            destination: '12345'
          })).to.not.throw(Error);
        });

        it('should call session.createCall', function () {
          expect(createCallStub.called).to.equal(true);
        });

        it('should register for the `dialing` event on the call object', function () {
          expect(onSpy.calledWith('dialing')).to.equal(true);
        });

        it('should register for the `connecting` event on the call object', function () {
          expect(onSpy.calledWith('connecting')).to.equal(true);
        });

        it('should register for the `canceled` event on the call object', function () {
          expect(onSpy.calledWith('canceled')).to.equal(true);
        });

        it('should register for the `rejected` event on the call object', function () {
          expect(onSpy.calledWith('rejected')).to.equal(true);
        });

        it('should register for the `connected` event on the call object', function () {
          expect(onSpy.calledWith('connected')).to.equal(true);
        });

        it('should register for the `established` event on the call object', function () {
          expect(onSpy.calledWith('established')).to.equal(true);
        });

        it('should register for the `ended` event on the call object', function () {
          expect(onSpy.calledWith('ended')).to.equal(true);
        });

        it('should register for the `error` event on the call object', function () {
          expect(onSpy.calledWith('error')).to.equal(true);
        });

        it('should execute Call.connect', function () {
          expect(callConnectStub.called).to.equal(true);
        });

        it('should trigger `call-dialing` when call publishes `dialing` event', function (done) {
          setTimeout(function () {
            try {
              expect(callDialingHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);
        });

        it('should trigger `call-connecting` when call publishes `connecting` event', function (done) {
          setTimeout(function () {
            try {
              expect(callConnectingHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });

        it('should trigger `call-canceled` when call publishes `canceled` event', function (done) {
          setTimeout(function () {
            try {
              expect(callCanceledHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });

        it('should trigger `call-rejected` when call publishes `rejected` event', function (done) {
          setTimeout(function () {
            try {
              expect(callRejectedHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });

        it('should trigger `call-connected` when call publishes `connected` event', function (done) {
          setTimeout(function () {
            try {
              expect(callConnectedHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });

        it('should trigger `call-established` when call publishes `established` event', function (done) {
          setTimeout(function () {
            try {
              expect(callEstablishedHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });

        it('should trigger `call-ended` when call publishes `ended` event', function (done) {
          setTimeout(function () {
            try {
              expect(callEndedHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });

        it('should trigger `call-error` when call publishes `error` event', function (done) {
          setTimeout(function () {
            try {
              expect(callErrorHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });

      });

    });
  });
});
