/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/

describe('Phone', function () {
  'use strict';

  var getRTCManagerStub;

  before(function () {

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return {
        on: function (event, handler) {
          return {}
        },
        connectCall: function () {}
      }
    });
  });

  after(function () {
    getRTCManagerStub.restore();
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
        session,
        createEventEmitterSpy,
        sessionConstructorSpy,
        onSpy;

      before(function () {
        session = new ATT.rtc.Session();
        createEventEmitterSpy = sinon.spy(ATT.private.factories, 'createEventEmitter');
        sessionConstructorSpy = sinon.stub(ATT.rtc, 'Session', function () {
          return session;
        });
        onSpy = sinon.spy(session, 'on');
        phone = new ATT.private.Phone();
      });

      after(function () {
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

      it('should register for `call-incoming` event on session object', function () {
        expect(onSpy.calledWith('call-incoming')).to.equal(true);
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
          //todo check for error object details
          expect(phone.login.bind(phone)).to.throw('Mandatory fields can not be empty');
          //todo check for error object details
          expect(phone.login.bind(phone, {})).to.throw('Missing input parameter');
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
          callEstablishedHandlerSpy,
          callEndedHandlerSpy,
          callErrorHandlerSpy;

        beforeEach(function () {

          options = {
            destination: '12345',
            mediaType: 'video',
            localMedia: '#foo',
            remoteMedia: 'bar'
          };

          call = new ATT.rtc.Call({
            peer: '1234567',
            mediaType: 'video'
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
          callEstablishedHandlerSpy = sinon.spy();
          callEndedHandlerSpy = sinon.spy();
          callErrorHandlerSpy = sinon.spy();

          phone.on('call-dialing', callDialingHandlerSpy);
          phone.on('call-connecting', callConnectingHandlerSpy);
          phone.on('call-canceled', callCanceledHandlerSpy);
          phone.on('call-rejected', callRejectedHandlerSpy);
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
          expect(phone.dial.bind(phone, {
            localMedia: '#foo',
            remoteMedia: '#bar'
          })).to.throw('Destination not defined');
          expect(phone.dial.bind(phone, {
            localMedia: '#foo',
            destination: '1234'
          })).to.throw('remoteMedia not defined');
          expect(phone.dial.bind(phone, {
            destination: '1234',
            remoteMedia: '#foo'
          })).to.throw('localMedia not defined');
          expect(phone.dial.bind(phone, {
            destination: '12345',
            localMedia: '#foo',
            remoteMedia: '#bar'
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
          expect(callConnectStub.calledWith(options)).to.equal(true);
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

      describe('answer', function () {
        var session,
          options,
          call,
          onSpy,
          callConnectStub,
          callAnsweringHandlerSpy;

        beforeEach(function () {

          options = {
            localMedia: '#foo',
            remoteMedia: '#bar'
          };

          call = new ATT.rtc.Call({
            peer: '1234567',
            mediaType: 'video'
          });

          onSpy = sinon.spy(call, 'on');
          callAnsweringHandlerSpy = sinon.spy();

          session = phone.getSession();

          callConnectStub = sinon.stub(call, 'connect', function () {
            emitter.publish('answering');
          });
 
          session = phone.getSession();

          session.currentCall = call;

          phone.on('call-answering', callAnsweringHandlerSpy);
          phone.answer(options);
        });

        afterEach(function () {
          onSpy.restore();
          callConnectStub.restore();
        });

        it('should exist', function () {
          expect(phone.answer).to.be.a('function');
        });

        it('should throw an error if there is no current call', function () {
          session.currentCall = null;
          expect(phone.answer.bind(phone, options)).to.throw('Call object not defined');
        });

        it('should throw an error if called without valid options', function () {
          expect(phone.answer.bind(phone)).to.throw('Options not defined');
          expect(phone.answer.bind(phone, {
            localMedia: '#bar'
          })).to.throw('remoteMedia not defined');
          expect(phone.answer.bind(phone, {
            remoteMedia: '#foo'
          })).to.throw('localMedia not defined');
        });

        it('should register for `answering` event on the call object', function () {
          expect(onSpy.calledWith('answering')).to.equal(true);
        });

        it('should register for the `connecting` event on the call object', function () {
          expect(onSpy.calledWith('connecting')).to.equal(true);
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

        it('should trigger `call-answering` when call publishes `answering` event', function (done) {

          setTimeout(function () {
            try {
              expect(callAnsweringHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);
        });

        it('should call `call.connect` with optional params localMedia & remoteMedia', function () {
          phone.answer(options);
          expect(callConnectStub.calledWith(options)).to.equal(true);
        });
      });

      describe('mute & unmute', function () {

        var session,
          options,
          call,
          createCallStub,
          onSpy,
          callMuteStub,
          callUnmuteStub,
          callMutedHandlerSpy,
          callUnmutedHandlerSpy;

        beforeEach(function () {

          options = {
            destination: '12345',
            mediaType: 'video',
            localMedia: '#foo',
            remoteMedia: 'bar'
          };

          call = new ATT.rtc.Call({
            peer: '1234567',
            mediaType: 'video'
          });

          onSpy = sinon.spy(call, 'on');

          callMuteStub = sinon.stub(call, 'mute', function () {
            emitter.publish('muted');
          });

          callUnmuteStub = sinon.stub(call, 'unmute', function () {
            emitter.publish('unmuted');
          });
 
          session = phone.getSession();

          createCallStub = sinon.stub(session, 'createCall', function () {
            return call;
          });

          callMutedHandlerSpy = sinon.spy();
          callUnmutedHandlerSpy = sinon.spy();

          phone.on('call-muted', callMutedHandlerSpy);
          phone.on('call-unmuted', callUnmutedHandlerSpy);

          phone.dial(options);
        });

        afterEach(function () {
          onSpy.restore();
          callMuteStub.restore();
          callUnmuteStub.restore();
          createCallStub.restore();
        });

        describe('mute', function () {
          beforeEach(function () {
            phone.mute();
          });

          it('should exist', function () {
            expect(phone.mute).to.be.a('function');
          });

          it('should register for the `muted` event on the call object', function () {
            expect(onSpy.calledWith('muted')).to.equal(true);
          });

          it('should call `call.mute`', function () {
            expect(callMuteStub.called).to.equal(true);
          });

          it('should trigger `call-muted` when call publishes `muted` event', function (done) {
            setTimeout(function () {
              try {
                expect(callMutedHandlerSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });
        });

        describe('unmute', function () {
          beforeEach(function () {
            phone.unmute();
          });

          it('should exist', function () {
            expect(phone.unmute).to.be.a('function');
          });

          it('should register for the `unmuted` event on the call object', function () {
            expect(onSpy.calledWith('unmuted')).to.equal(true);
          });

          it('should call `call.unmute`', function () {
            expect(callUnmuteStub.called).to.equal(true);
          });

          it('should trigger `call-unmuted` when call publishes `unmuted` event', function (done) {
            setTimeout(function () {
              try {
                expect(callUnmutedHandlerSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });
        });
      });

      describe('hangup', function () {

        var session,
          options,
          call,
          onSpy,
          callDisconnectStub,
          createCallStub,
          callDisconnectingHandlerSpy,
          callDisconnectedSpy,
          sessionOnSpy;

        beforeEach(function () {

          options = {
            destination: '12345',
            mediaType: 'audio',
            localMedia: '#foo',
            remoteMedia: '#bar'
          };

          call = new ATT.rtc.Call({
            peer: '1234567',
            mediaType: 'audio'
          });

          onSpy = sinon.spy(call, 'on');

          session = phone.getSession();
          sessionOnSpy = sinon.spy(session, 'on');

          createCallStub = sinon.stub(session, 'createCall', function () {
            return call;
          });

          callDisconnectStub = sinon.stub(call, 'disconnect', function () {
            emitter.publish('disconnecting');

          });
          phone.dial(options);
          phone.hangup();
        });

        afterEach(function () {
          callDisconnectStub.restore();
          createCallStub.restore();
          sessionOnSpy.restore();
        });

        it('should exist', function () {
          expect(phone.hangup).to.be.a('function');
        });

        it('should register for the `disconnecting` event on the call object', function () {
          expect(onSpy.calledWith('disconnecting')).to.equal(true);
        });

        it('should register for the `disconnected` event on the session', function () {
          expect(sessionOnSpy.calledWith('call-disconnected')).to.equal(true);
        });

        it('should execute call.disconnect', function () {
          expect(callDisconnectStub.called).to.equal(true);
        });

        it('should trigger `call-disconnecting` when call publishes `disconnecting` event', function (done) {
          callDisconnectingHandlerSpy = sinon.spy();
          phone.on('call-disconnecting', callDisconnectingHandlerSpy);
          setTimeout(function () {
            try {
              expect(callDisconnectingHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);
        });

        it('should trigger `call-disconnected` when session publishes `disconnected` event', function (done) {
          emitter.publish('call-disconnected');
          callDisconnectedSpy = sinon.spy();
          phone.on('call-disconnected', callDisconnectedSpy);
          setTimeout(function () {
            try {
              expect(callDisconnectedSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);
        });
      });

      describe('hold/resume ', function () {

        var session,
          options,
          call,
          onSpy,
          callholdStub,
          callresumeStub,
          createCallStub,
          callHoldSpy,
          callresumeSpy,
          sessionOnSpy;

        beforeEach(function () {

          options = {
            destination: '12345',
            mediaType: 'audio',
            localMedia: '#foo',
            remoteMedia: '#bar'
          };

          call = new ATT.rtc.Call({
            peer: '1234567',
            mediaType: 'audio'
          });

          onSpy = sinon.spy(call, 'on');

          session = phone.getSession();
          sessionOnSpy = sinon.spy(session, 'on');

          createCallStub = sinon.stub(session, 'createCall', function () {
            return call;
          });

          callholdStub = sinon.stub(call, 'hold', function () {
            emitter.publish('hold');
          });

          callresumeStub = sinon.stub(call, 'resume', function () {
            emitter.publish('resume');
          });

          phone.dial(options);
          phone.hold();
          phone.resume();
        });

        afterEach(function () {
          callholdStub.restore();
          callresumeStub.restore();
          createCallStub.restore();
          sessionOnSpy.restore();
        });

        describe('hold', function () {

          it('should exist', function () {
            expect(phone.hold).to.be.a('function');
          });

          it('should register for the `hold` event on the call object', function () {
            expect(onSpy.calledWith('hold')).to.equal(true);
          });

          it('should execute call.disconnect', function () {
            expect(callresumeStub.called).to.equal(true);
          });

          it('should trigger `call-hold` when call publishes `call-hold` event', function (done) {
            callHoldSpy = sinon.spy();
            phone.on('call-hold', callHoldSpy);
            setTimeout(function () {
              try {
                expect(callHoldSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 300);
          });
        });

        describe('resume', function () {

          it('should exist', function () {
            expect(phone.resume).to.be.a('function');
          });

          it('should register for the `resume` event on the call object', function () {
            expect(onSpy.calledWith('resume')).to.equal(true);
          });

          it('should execute call.resume', function () {
            expect(callholdStub.called).to.equal(true);
          });

          it('should trigger `call-resume` when call publishes `call-resume` event', function (done) {
            callresumeSpy = sinon.spy();
            phone.on('call-resume', callresumeSpy);
            setTimeout(function () {
              try {
                expect(callresumeSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 300);
          });
        });

      });

      describe('getMediaType', function () {
        it('should Exist', function () {
          expect(phone.getMediaType).to.be.a('function');
        });

        it('should return the mediaType of the current call', function () {
          var options,
            mediaType;

          options = {
            destination: '42512345678',
            mediaType: 'audio',
            localMedia: '#foo',
            remoteMedia: '#bar'
          };

          phone.dial(options);

          mediaType = phone.getMediaType();
          expect(mediaType).to.equal('audio');
        });
      });
    });

    describe('Events', function () {

      describe('call-incoming', function () {

        var phone,
          session,
          emitterSession,
          createEmitterStub,
          sessionConstructorStub,
          onCallIncomingHandlerSpy;

        before(function () {
          emitterSession = ATT.private.factories.createEventEmitter();

          createEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
            return emitterSession;
          });

          session = new ATT.rtc.Session();

          createEmitterStub.restore();

          sessionConstructorStub = sinon.stub(ATT.rtc, 'Session', function () {
            return session;
          });

          onCallIncomingHandlerSpy = sinon.spy();

          phone = new ATT.private.Phone();

          phone.on('call-incoming', onCallIncomingHandlerSpy);
        });

        after(function () {
          sessionConstructorStub.restore();
        });

        it('should trigger `call-incoming` on getting a `call-incoming` from session', function (done) {

          emitterSession.publish('call-incoming');

          setTimeout(function () {
            try {
              expect(onCallIncomingHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });
      });

      describe('call-connected', function () {

        var phone,
          call,
          connectStub;

        beforeEach(function () {
          phone = new ATT.private.Phone();
          call = phone.getSession().createCall({
            peer: '123',
            mediaType: 'video'
          });
          // so that it will just register the event handlers
          connectStub = sinon.stub(call, 'connect', function () {
            return;
          });
        });
        afterEach(function () {
          connectStub.restore();
        });

        it('should publish `call-connected` when call publishes `connected` event', function (done) {
          var callConnectedspy = sinon.spy();

          phone.on('call-connected', callConnectedspy);

          phone.answer({
            localMedia: {},
            remoteMedia: {}
          });

          call.setState('connected');

          setTimeout(function () {
            try {
              expect(callConnectedspy.calledOnce).to.equal(true);
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