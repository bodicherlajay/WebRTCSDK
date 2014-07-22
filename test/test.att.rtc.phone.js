/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/

describe('Phone', function () {
  'use strict';

  var getRTCManagerStub;

  beforeEach(function () {

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return {
        on: function (event, handler) {
          return {};
        },
        connectCall: function () {}
      };
    });
  });

  afterEach(function () {
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

      beforeEach(function () {
        session = new ATT.rtc.Session();
        createEventEmitterSpy = sinon.spy(ATT.private.factories, 'createEventEmitter');
        sessionConstructorSpy = sinon.stub(ATT.rtc, 'Session', function () {
          return session;
        });
        onSpy = sinon.spy(session, 'on');
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

      it('should register for `call-incoming` event on session object', function () {
        expect(onSpy.calledWith('call-incoming')).to.equal(true);
      });

      it('should register for `error` event on session object', function () {
        expect(onSpy.calledWith('error')).to.equal(true);
      });

    });

    describe('Methods', function () {

      var phone,
        session,
        call,
        emitter,
        emitterSession,
        emitterCall,
        createEventEmitterStub,
        callConstructorStub,
        sessionConstructorStub,
        remoteVideo,
        localVideo,
        onErrorHandlerSpy,
        eventData,
        error,
        errorData;

      beforeEach(function () {

        eventData = { abc: 'abc' };

        error = {
          ErrorMessage: 'Test Error'
        };

        errorData = {
          error: error
        };

        localVideo = document.createElement('video');
        remoteVideo = document.createElement('video');

        emitterCall = ATT.private.factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
          return emitterCall;
        });

        call = new ATT.rtc.Call({
          peer: '1234567',
          type: 'abc',
          mediaType: 'video'
        });

        callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
          return call;
        });

        createEventEmitterStub.restore();

        emitterSession = ATT.private.factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
          return emitterSession;
        });

        session = new ATT.rtc.Session();

        sessionConstructorStub = sinon.stub(ATT.rtc, 'Session', function () {
          return session;
        });

        createEventEmitterStub.restore();

        emitter = ATT.private.factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
          return emitter;
        });

        phone = new ATT.private.Phone();

        onErrorHandlerSpy = sinon.spy();

        phone.on('error', onErrorHandlerSpy);
      });

      afterEach(function () {
        createEventEmitterStub.restore();
        callConstructorStub.restore();
        sessionConstructorStub.restore();
      });

      describe('getSession', function () {

        it('should exist', function () {
          expect(phone.getSession).to.be.a('function');
        });

        it('should return an instance of ATT.rtc.Session', function () {
          sessionConstructorStub.restore();
          // we are recreating phone since the session is stubbed out as part pf setup
          var phone = ATT.rtc.Phone.getPhone();

          expect(phone.getSession() instanceof ATT.rtc.Session).to.equal(true);
        });

        it('should return the session object inside the phone instance', function () {
          expect(phone.getSession()).to.equal(session);
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

      describe('[US226847, US226648] login', function () {

        var onSpy,
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

          phone.on('session-ready', onSessionReadySpy);

          data = {
            test: 'test'
          };

          onSpy = sinon.spy(session, 'on');

          connectStub = sinon.stub(session, 'connect', function () {
          });

        });

        afterEach(function () {
          onSpy.restore();
          connectStub.restore();
        });

        it('should exist', function () {
          expect(phone.login).to.be.a('function');
        });

        it('should register for event `ready` from Session', function () {
          phone.login(options);

          expect(onSpy.calledWith('ready')).to.equal(true);
        });

        it('should execute Session.connect', function () {
          phone.login(options);

          expect(connectStub.called).to.equal(true);
        });

        it('should trigger `session-ready` event with data on receiving the `ready` event from Session', function (done) {
          phone.login(options);

          emitterSession.publish('ready', data);

          setTimeout(function () {
            try {
              expect(onSessionReadySpy.calledWith(data)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

        describe('Error Handling', function () {

          var publishStub;

          beforeEach(function () {

            publishStub = sinon.stub(emitter, 'publish', function () {});

            connectStub.restore();

            connectStub = sinon.stub(session, 'connect', function () {
              throw error;
            });
          });

          afterEach(function () {
            publishStub.restore();
            connectStub.restore();
          });

          it('[2002] should be published with `error` event if no options', function () {

            phone.login();

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('2002')
            })).to.equal(true);

          });

          it('[2001] should be published with `error` event if no token in options', function () {

            phone.login({});

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('2001')
            })).to.equal(true);


            expect(phone.login.bind(phone, {
              token: '123'
            })).to.not.throw(Error);

          });

          it('[2005] should be published with `error` event if session id already exists', function () {
            session.setId('123');

            phone.login({
              token: '123'
            });

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('2005')
            })).to.equal(true);

          });

          it('[2004] should be published with `error` event if there is an unknown exception during the operation', function () {

            phone.login(options);

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('2004')
            })).to.equal(true);
          });

        });

      });

      describe('[US198837, US197999] logout', function () {

        var onSpy,
          disconnectStub,
          onSessionDisconnectedSpy;

        beforeEach(function () {

          onSessionDisconnectedSpy = sinon.spy();
          onSpy = sinon.spy(session, 'on');

          disconnectStub = sinon.stub(session, 'disconnect', function () {
          });

          phone.on('session-disconnected', onSessionDisconnectedSpy);

          // logout checks for session id
          session.id = 'sessionid';
        });

        afterEach(function () {
          onSpy.restore();
          disconnectStub.restore();
        });

        it('Should exist', function () {
          expect(phone.logout).to.be.a('function');
        });

        it('should register for event `disconnected` from Session', function () {
          phone.logout();

          expect(onSpy.calledWith('disconnected')).to.equal(true);
        });

        it('Should execute Session.disconnect', function () {
          phone.logout();

          expect(disconnectStub.called).to.equal(true);
        });

        it('Should publish event `session-disconnected` on receiving a `disconnected` event from Session', function (done) {
          phone.logout();

          emitterSession.publish('disconnected');

          setTimeout(function () {
            try {
              expect(onSessionDisconnectedSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

        it('should delete the current session object', function () {
          phone.logout();

          expect(phone.getSession()).to.equal(undefined);
        });

        describe('Error Handling', function () {
          var publishStub;

          beforeEach(function () {
            publishStub = sinon.stub(emitter, 'publish', function () {

            });

            disconnectStub.restore();

            disconnectStub = sinon.stub(session, 'disconnect', function () {
              throw error;
            });

          });

          afterEach(function () {
            publishStub.restore()
            disconnectStub.restore();
          });

          it('[3000] should be published with `error` event if there is an error during the operation', function (done) {

            phone.logout();

            setTimeout(function () {
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('3000')
              })).to.equal(true);
              done();
            }, 100);
          });

        });

      });

      describe('dial', function () {

        var options,
          onSpy,
          callConnectStub,
          callConnectingHandlerSpy,
          callCanceledHandlerSpy,
          callRejectedHandlerSpy,
          mediaEstablishedHandlerSpy,
          callHoldHandlerSpy,
          callResumeHandlerSpy,
          callErrorHandlerSpy,
          onDialingSpy;

        beforeEach(function () {

          options = {
            destination: '12345',
            mediaType: 'video',
            localMedia: localVideo,
            remoteMedia: remoteVideo
          };

          onSpy = sinon.spy(call, 'on');

          callConnectStub = sinon.stub(call, 'connect', function () {
          });

          onDialingSpy = sinon.spy();
          callConnectingHandlerSpy = sinon.spy();
          callCanceledHandlerSpy = sinon.spy();
          callRejectedHandlerSpy = sinon.spy();
          mediaEstablishedHandlerSpy = sinon.spy();
          callErrorHandlerSpy = sinon.spy();
          callHoldHandlerSpy = sinon.spy();
          callResumeHandlerSpy = sinon.spy();

          phone.on('dialing', onDialingSpy);
          phone.on('call-connecting', callConnectingHandlerSpy);
          phone.on('call-canceled', callCanceledHandlerSpy);
          phone.on('call-rejected', callRejectedHandlerSpy);
          phone.on('media-established', mediaEstablishedHandlerSpy);
          phone.on('call-held', callHoldHandlerSpy);
          phone.on('call-resumed', callResumeHandlerSpy);

        });

        afterEach(function () {
          createEventEmitterStub.restore();
          onSpy.restore();
          callConnectStub.restore();
        });

        it('should exist', function () {
          expect(phone.dial).to.be.a('function');
        });

        it('should publish `error` event with error data if options are invalid', function () {

          var publishStub = sinon.stub(emitter, 'publish', function (event, data) {
            //throw data.error.ErrorMessage;
            throw data.error.message; // since not using Error codes yet
          });

          expect(phone.dial).to.throw('Options not defined');
          expect(phone.dial.bind(phone, {
            localMedia: localVideo,
            remoteMedia: remoteVideo
          })).to.throw('Destination not defined');
          expect(phone.dial.bind(phone, {
            localMedia: localVideo,
            destination: '1234'
          })).to.throw('remoteMedia not defined');
          expect(phone.dial.bind(phone, {
            destination: '1234',
            remoteMedia: localVideo
          })).to.throw('localMedia not defined');
          expect(phone.dial.bind(phone, {
            destination: '12345',
            localMedia: localVideo,
            remoteMedia: remoteVideo
          })).to.not.throw(Error);

          publishStub.restore();
        });

        it('should trigger the `dialing` event with event data', function (done) {
          phone.dial(options);

          setTimeout(function () {
            expect(onDialingSpy.called).to.equal(true);
            expect(onDialingSpy.getCall(0).args[0]).to.be.an('object');
            expect(onDialingSpy.getCall(0).args[0].to).to.be.a('string');
            expect(onDialingSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(typeof onDialingSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
        });

        it('should call session.createCall', function () {
          var createCallSpy = sinon.spy(session, 'createCall');
          phone.dial(options);

          expect(createCallSpy.called).to.equal(true);

          createCallSpy.restore();
        });

        it('should register for the `connecting` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('connecting')).to.equal(true);
        });

        it('should register for the `canceled` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('canceled')).to.equal(true);
        });

        it('should register for the `connected` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('connected')).to.equal(true);
        });

        it('should register for the `media-established` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('media-established')).to.equal(true);
        });

        it('should register for the `held` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('held')).to.equal(true);
        });

        it('should register for the `resumed` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('resumed')).to.equal(true);
        });

        it('should register for the `disconnected` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('disconnected')).to.equal(true);
        });

        it('should register for the `rejected` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('rejected')).to.equal(true);
        });


        it('should register for the `error` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('error')).to.equal(true);
        });

        it('should execute call.connect', function () {
          phone.dial(options);

          expect(callConnectStub.calledWith(options)).to.equal(true);
        });

        describe('Events for Dial', function () {

          it('should trigger `call-connecting` with relevant data when call publishes `connecting` event', function (done) {
            phone.dial(options);

            emitterCall.publish('connecting', eventData);

            setTimeout(function () {
              try {
                expect(callConnectingHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

          it('should trigger `call-canceled` with relevant data when call publishes `canceled` event', function (done) {
            phone.dial(options);

            emitterCall.publish('canceled', eventData);

            setTimeout(function () {
              try {
                expect(callCanceledHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

          it('should trigger `call-rejected` with relevant data when call publishes `rejected` event', function (done) {
            phone.dial(options);

            emitterCall.publish('rejected', eventData);
            setTimeout(function () {
              try {
                expect(callRejectedHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

          it('should trigger `media-established` with relevant data when call publishes `media-established` event', function (done) {
            phone.dial(options);

            emitterCall.publish('media-established', eventData);

            setTimeout(function () {
              try {
                expect(mediaEstablishedHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

          it('should trigger `call-held` with relevant data when call publishes `call-held` event', function (done) {
            phone.dial(options);

            emitterCall.publish('held', eventData);

            setTimeout(function () {
              try {
                expect(callHoldHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 300);
          });

          it('should trigger `call-resumed` with relevant data when call publishes `call-resumed` event', function (done) {
            phone.dial(options);

            emitterCall.publish('resumed', eventData);

            setTimeout(function () {
              try {
                expect(callResumeHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 300);
          });

        });

        describe('Error Handling', function () {

          beforeEach(function () {

            callConnectStub.restore();

            callConnectStub = sinon.stub(call, 'connect', function () {
              throw error;
            })

          });

          afterEach(function () {
            callConnectStub.restore();
          });

          it('should publish `error` event with error data if there is an error during the operation', function (done) {

            phone.dial(options);

            setTimeout(function () {
              expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
              done();
            }, 100);
          });

          it('should publish `error` event with error data when call publishes `error` event', function (done) {
            phone.dial(options);

            emitterCall.publish('error', eventData);

            setTimeout(function () {
              try {
                expect(onErrorHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

        });
      });

      describe('answer', function () {

        var options,
          createCallOptions,
          call,
          onSpy,
          callConnectStub,
          onAnsweringSpy,
          callConnectingHandlerSpy,
          callCanceledHandlerSpy,
          callRejectedHandlerSpy,
          mediaEstablishedHandlerSpy,
          callHoldHandlerSpy,
          callResumeHandlerSpy,
          callErrorHandlerSpy;

        beforeEach(function () {

          options = {
            localMedia: localVideo,
            remoteMedia: remoteVideo
          };

          createCallOptions = {
            id: '123',
            peer: '1234567',
            type: 'abc',
            mediaType: 'video'
          };

          onAnsweringSpy = sinon.spy();
          callConnectingHandlerSpy = sinon.spy();
          callCanceledHandlerSpy = sinon.spy();
          callRejectedHandlerSpy = sinon.spy();
          mediaEstablishedHandlerSpy = sinon.spy();
          callErrorHandlerSpy = sinon.spy();
          callHoldHandlerSpy = sinon.spy();
          callResumeHandlerSpy = sinon.spy();

          call = session.createCall(createCallOptions);

          call.setRemoteSdp('abc');

          onSpy = sinon.spy(call, 'on');

          callConnectStub = sinon.stub(call, 'connect', function () {
          });

          phone.on('answering', onAnsweringSpy);
          phone.on('call-connecting', callConnectingHandlerSpy);
          phone.on('call-canceled', callCanceledHandlerSpy);
          phone.on('call-rejected', callRejectedHandlerSpy);
          phone.on('media-established', mediaEstablishedHandlerSpy);
          phone.on('call-held', callHoldHandlerSpy);
          phone.on('call-resumed', callResumeHandlerSpy);

        });

        afterEach(function () {
          onSpy.restore();
          callConnectStub.restore();
        });

        it('should exist', function () {
          expect(phone.answer).to.be.a('function');
        });

        it('should publish `error` event with error data if there is no current call', function () {
          session.currentCall = null;

          var publishStub = sinon.stub(emitter, 'publish', function (event, data) {
            //throw data.error.ErrorMessage;
            throw data.error.message; // since not using Error codes yet
          });

          expect(phone.answer.bind(phone, options)).to.throw('Call object not defined');

          publishStub.restore();
        });

        it('should publish `error` event with error data if called without valid options', function () {

          var publishStub = sinon.stub(emitter, 'publish', function (event, data) {
            //throw data.error.ErrorMessage;
            throw data.error.message; // since not using Error codes yet
          });

          expect(phone.answer.bind(phone)).to.throw('Options not defined');
          expect(phone.answer.bind(phone, {
            localMedia: remoteVideo
          })).to.throw('remoteMedia not defined');
          expect(phone.answer.bind(phone, {
            remoteMedia: localVideo
          })).to.throw('localMedia not defined');

          publishStub.restore();
        });

        it('should trigger `answering` with event data', function (done) {
          phone.answer(options);

          setTimeout(function () {
            expect(onAnsweringSpy.called).to.equal(true);
            expect(onAnsweringSpy.getCall(0).args[0]).to.be.an('object');
            expect(onAnsweringSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onAnsweringSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onAnsweringSpy.getCall(0).args[0].codec).to.be.an('array');
            expect(typeof onAnsweringSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
        });

        it('should register for the `connecting` event on the call object', function () {
          phone.answer(options);

          expect(onSpy.calledWith('connecting')).to.equal(true);
        });

        it('should register for the `connected` event on the call object', function () {
          phone.answer(options);

          expect(onSpy.calledWith('connected')).to.equal(true);
        });

        it('should register for the `media-established` event on the call object', function () {
          phone.answer(options);

          expect(onSpy.calledWith('media-established')).to.equal(true);
        });

        it('should register for the `held` event on the call object', function () {
          phone.answer(options);

          expect(onSpy.calledWith('held')).to.equal(true);
        });

        it('should register for the `resumed` event on the call object', function () {
          phone.answer(options);

          expect(onSpy.calledWith('resumed')).to.equal(true);
        });

        it('should register for the `error` event on the call object', function () {
          phone.answer(options);

          expect(onSpy.calledWith('error')).to.equal(true);
        });

        it('should call `call.connect` with optional params localMedia & remoteMedia', function () {
          phone.answer(options);

          expect(callConnectStub.calledWith(options)).to.equal(true);
        });

        describe('Answer Events', function () {

          it('should trigger `call-connecting` with relevant data when call publishes `connecting` event', function (done) {
            phone.answer(options);

            emitterCall.publish('connecting', eventData);

            setTimeout(function () {
              try {
                expect(callConnectingHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

          it('should trigger `call-rejected` with relevant data when call publishes `rejected` event', function (done) {
            phone.answer(options);

            emitterCall.publish('rejected', eventData);

            setTimeout(function () {
              try {
                expect(callRejectedHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

          it('should trigger `media-established` with relevant data when call publishes `media-established` event', function (done) {
            phone.answer(options);

            emitterCall.publish('media-established', eventData);

            setTimeout(function () {
              try {
                expect(mediaEstablishedHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

          it('should trigger `call-held` with relevant data when call publishes `call-held` event', function (done) {
            phone.answer(options);

            emitterCall.publish('held', eventData);

            setTimeout(function () {
              try {
                expect(callHoldHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 300);
          });

          it('should trigger `call-resumed` with relevant data when call publishes `call-resumed` event', function (done) {
            phone.answer(options);

            emitterCall.publish('resumed', eventData);

            setTimeout(function () {
              try {
                expect(callResumeHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 300);
          });

        });

        describe('Error Handling', function () {

          beforeEach(function () {

            callConnectStub.restore();

            callConnectStub = sinon.stub(call, 'connect', function () {
              throw error;
            })

          });

          afterEach(function () {
            callConnectStub.restore();
          });

          it('should publish `error` event if there is an error during the operation', function (done) {

            phone.answer(options);

            setTimeout(function () {
              expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
              done();
            }, 100);
          });

          it('should trigger `error` with relevant data when call publishes `error` event', function (done) {
            phone.answer(options);

            emitterCall.publish('error', eventData);

            setTimeout(function () {
              try {
                expect(onErrorHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

        });

      });

      describe('mute & unmute', function () {

        var onSpy,
          callMuteStub,
          callUnmuteStub,
          callMutedHandlerSpy,
          callUnmutedHandlerSpy;

        beforeEach(function () {

          onSpy = sinon.spy(call, 'on');

          callMuteStub = sinon.stub(call, 'mute', function () {
          });

          callUnmuteStub = sinon.stub(call, 'unmute', function () {
          });
 
          callMutedHandlerSpy = sinon.spy();
          callUnmutedHandlerSpy = sinon.spy();

          phone.on('call-muted', callMutedHandlerSpy);
          phone.on('call-unmuted', callUnmutedHandlerSpy);

          session.currentCall = call;
        });

        afterEach(function () {
          onSpy.restore();
          callMuteStub.restore();
          callUnmuteStub.restore();
        });

        describe('mute', function () {

          it('should exist', function () {
            expect(phone.mute).to.be.a('function');
          });

          it('should register for the `muted` event on the call object', function () {
            phone.mute();

            expect(onSpy.calledWith('muted')).to.equal(true);
          });

          it('should call `call.mute`', function () {
            phone.mute();

            expect(callMuteStub.called).to.equal(true);
          });

          it('should trigger `call-muted` with relevant data when call publishes `muted` event', function (done) {
            var eventData = {
              abc: 'abc'
            };

            phone.mute();

            emitterCall.publish('muted', eventData);

            setTimeout(function () {
              try {
                expect(callMutedHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });

          describe('Error Handling', function () {

            beforeEach(function () {

              callMuteStub.restore();

              callMuteStub = sinon.stub(call, 'mute', function () {
                throw error;
              })

            });

            it('should publish `error` event if there is an error during the operation', function (done) {

              phone.mute();

              setTimeout(function () {
                expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
                done();
              }, 100);
            });

          });
        });

        describe('unmute', function () {

          it('should exist', function () {
            expect(phone.unmute).to.be.a('function');
          });

          it('should register for the `unmuted` event on the call object', function () {
            phone.unmute();

            expect(onSpy.calledWith('unmuted')).to.equal(true);
          });

          it('should call `call.unmute`', function () {
            phone.unmute();

            expect(callUnmuteStub.called).to.equal(true);
          });

          it('should trigger `call-unmuted` with relevant data when call publishes `unmuted` event', function (done) {
            var eventData = {
              abc: 'abc'
            };

            phone.unmute();

            emitterCall.publish('unmuted', eventData);

            setTimeout(function () {
              try {
                expect(callUnmutedHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });


          describe('Error Handling', function () {

            beforeEach(function () {

              callUnmuteStub.restore();

              callUnmuteStub = sinon.stub(call, 'unmute', function () {
                throw error;
              })

            });

            it('should publish `error` event if there is an error during the operation', function (done) {

              phone.unmute();

              setTimeout(function () {
                expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
                done();
              }, 100);
            });

          });
        });
      });

      describe('hangup', function () {

        var onSpy,
          callDisconnectStub,
          callDisconnectingHandlerSpy,
          callDisconnectedSpy,
          deleteCurrentCallStub;

        beforeEach(function () {

          onSpy = sinon.spy(call, 'on');
          callDisconnectStub = sinon.stub(call, 'disconnect', function () {
          });

          deleteCurrentCallStub = sinon.stub(session, 'deleteCurrentCall');

          callDisconnectingHandlerSpy = sinon.spy();
          callDisconnectedSpy = sinon.spy();

          phone.on('call-disconnecting', callDisconnectingHandlerSpy);
          phone.on('call-disconnected', callDisconnectedSpy);

          session.currentCall = call;
        });

        afterEach(function () {
          callDisconnectStub.restore();
          deleteCurrentCallStub.restore();
        });

        it('should exist', function () {
          expect(phone.hangup).to.be.a('function');
        });

        it('should register for the `disconnecting` event on the call object', function () {
          phone.hangup();

          expect(onSpy.calledWith('disconnecting')).to.equal(true);
        });

        it('should execute call.disconnect', function () {
          phone.hangup();

          expect(callDisconnectStub.called).to.equal(true);
        });

        it('should trigger `call-disconnecting` with relevant data when call publishes `disconnecting` event', function (done) {

          phone.hangup();

          emitterCall.publish('disconnecting', eventData);

          setTimeout(function () {
            try {
              expect(callDisconnectingHandlerSpy.calledWith(eventData)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);
        });

        describe('Error Handling', function () {

          beforeEach(function () {

            callDisconnectStub.restore();

            callDisconnectStub = sinon.stub(call, 'disconnect', function () {
              throw error;
            })

          });

          it('should publish `error` event with error data if there is an error during the operation', function (done) {

            phone.hangup();

            setTimeout(function () {
              expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
              done();
            }, 100);
          });

        });

      });

      describe('cancel', function () {
        it('should exist', function () {
          expect(phone.cancel).to.be.a('function');
        });

        it('should execute call.disconnect', function () {
          var callDisconnectStub = sinon.stub(call, 'disconnect');
          session.currentCall = call;

          phone.cancel();

          expect(callDisconnectStub.called).to.equal(true);
          callDisconnectStub.restore();
        });

      });

      describe('reject', function () {

        var onSpy,
          callRejectStub,
          callRejectedSpy;

        beforeEach(function () {

          onSpy = sinon.spy(call, 'on');
          callRejectStub = sinon.stub(call, 'reject', function () {
          });

          callRejectedSpy = sinon.spy();

          phone.on('call-disconnected', callRejectedSpy);

          session.currentCall = call;
        });

        afterEach(function () {
          callRejectStub.restore();
        });

        it('should exist', function () {
          expect(phone.reject).to.be.a('function');
        });

        it('should publish `error` with error data when there is no current call', function () {
          session.currentCall = null;

          var publishStub = sinon.stub(emitter, 'publish', function (event, data) {
            //throw data.error.ErrorMessage;
            throw data.error.message; // since not using Error codes yet
          });

          expect(phone.reject.bind(phone)).to.throw('Call object not defined');

          publishStub.restore();
        });

        it('should execute call.reject', function () {
          phone.reject();

          expect(callRejectStub.called).to.equal(true);
        });

        it('should register for the `disconnected` event on the call object', function () {
          phone.reject();

          expect(onSpy.calledOnce).to.equal(true);
          expect(onSpy.calledWith('disconnected')).to.equal(true);
        });

        it('should trigger `call-disconnected` with data when call publishes `disconnected` event', function (done) {
          var data = {
            data: 'test'
          };

          phone.reject();

          emitterCall.publish('disconnected', data);

          setTimeout(function () {
            try {
              expect(callRejectedSpy.calledWith(data)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);
        });

        describe('Error Handling', function () {

          beforeEach(function () {

            callRejectStub.restore();

            callRejectStub = sinon.stub(call, 'reject', function () {
              throw error;
            });

          });

          it('should publish `error` event with error data if there is an error during the operation', function (done) {

            phone.reject();

            setTimeout(function () {
              expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
              done();
            }, 100);
          });

        });
      });

      describe('hold/resume ', function () {

        var callHoldStub,
          callResumeStub;

        beforeEach(function () {

          callHoldStub = sinon.stub(call, 'hold', function () {
          });

          callResumeStub = sinon.stub(call, 'resume', function () {
          });

          session.currentCall = call;
        });

        afterEach(function () {
          callHoldStub.restore();
          callResumeStub.restore();
        });

        describe('hold', function () {

          it('should exist', function () {
            expect(phone.hold).to.be.a('function');
          });

          it('should execute call.hold', function () {
            phone.hold();

            expect(callHoldStub.called).to.equal(true);
          });

          describe('Error Handling', function () {

            beforeEach(function () {

              callHoldStub.restore();

              callHoldStub = sinon.stub(call, 'hold', function () {
                throw error;
              })

            });

            it('should publish `error` event with error data if there is an error during the operation', function (done) {

              phone.hold();

              setTimeout(function () {
                expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
                done();
              }, 100);
            });

          });

        });

        describe('resume', function () {

          it('should exist', function () {
            expect(phone.resume).to.be.a('function');
          });

          it('should execute call.resume', function () {
            phone.resume();

            expect(callResumeStub.called).to.equal(true);
          });

          describe('Error Handling', function () {

            beforeEach(function () {

              callResumeStub.restore();

              callResumeStub = sinon.stub(call, 'resume', function () {
                throw error;
              });

            });

            it('should publish `error` event with error data if there is an error during the operation', function (done) {

              phone.resume();

              setTimeout(function () {
                expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
                done();
              }, 100);
            });

          });

        });

      });

      describe('getMediaType', function () {

        it('should Exist', function () {
          expect(phone.getMediaType).to.be.a('function');
        });

        it('should return the mediaType of the current call', function () {
          session.currentCall = call;

          expect(phone.getMediaType()).to.equal('video');
        });
      });

      describe('updateE911Id', function () {

        var optionsUpdateE911Id,
          updateE911IdStub,
          updateE911IdHandlerSpy,
          sessionOnSpy;

        beforeEach(function () {

          optionsUpdateE911Id = {
            e911Id: '12345'
          };

          sessionOnSpy = sinon.spy(session, 'on');

          updateE911IdStub = sinon.stub(session, 'updateE911Id', function () {
          });

          updateE911IdHandlerSpy = sinon.spy();

          phone.on('address-updated', updateE911IdHandlerSpy);

        });

        afterEach(function () {
          updateE911IdStub.restore();
          sessionOnSpy.restore();
        });

        it('should Exist', function () {
          expect(phone.updateE911Id).to.be.a('function');
        });

        it('should register for the `updateE911Id` event on the session', function () {
          phone.updateE911Id(optionsUpdateE911Id);

          expect(sessionOnSpy.calledWith('address-updated')).to.equal(true);
        });

        it('should execute session.updateE911Id', function () {
          phone.updateE911Id(optionsUpdateE911Id);

          expect(updateE911IdStub.called).to.equal(true);
        });

        it('should trigger `address-updated` when session publishes `address-updated` event', function (done) {
          phone.updateE911Id(optionsUpdateE911Id);

          emitterSession.publish('address-updated');

          setTimeout(function () {
            try {
              expect(updateE911IdHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);
        });
      });

    });

    describe('Events', function () {

      describe('Session', function () {

        var phone,
          session,
          emitterSession,
          createEmitterStub,
          sessionConstructorStub,
          onCallIncomingHandlerSpy,
          onErrorHandlerSpy;

        beforeEach(function () {
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
          onErrorHandlerSpy = sinon.spy();

          phone = new ATT.private.Phone();

          phone.on('call-incoming', onCallIncomingHandlerSpy);
          phone.on('error', onErrorHandlerSpy);

        });

        afterEach(function () {
          sessionConstructorStub.restore();
        });

        describe('call-incoming', function () {

          it('should trigger `call-incoming` with relevant data on getting a `call-incoming` from session', function (done) {

            var eventData = {
              abc: 'abc'
            };

            emitterSession.publish('call-incoming', eventData);

            setTimeout(function () {
              try {
                expect(onCallIncomingHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 300);
          });
        });

        describe('error', function () {

          it('should publish `error` event with the error data on getting an `error` from session', function (done) {
            var eventData = {
              error: 'error'
            };

            emitterSession.publish('error', eventData);

            setTimeout(function () {
              try {
                expect(onErrorHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 300);
          });
        });

      });

      describe('Call', function () {

        describe('call-connected', function () {

          var phone,
            call,
            connectStub;

          beforeEach(function () {
            phone = new ATT.private.Phone();

            call = phone.getSession().createCall({
              peer: '123',
              type: 'abc',
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

        describe('call-rejected', function () {

          var factories,
            emitterCall,
            phone,
            callRejectedSpy,
            options,
            call,
            createEmitterStub,
            createCallStub,
            sessionConstructorStub,
            session,
            connectStub,
            deleteCurrentCallStub;

          beforeEach(function () {

            factories = ATT.private.factories;
            emitterCall = factories.createEventEmitter();

            createEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
              return emitterCall;
            });

            call = new ATT.rtc.Call({
              type: 'abc',
              peer: '123',
              mediaType: 'video'
            });
            createEmitterStub.restore();

            options = {
              destination: '12345',
              mediaType: 'video',
              localMedia: {},
              remoteMedia: {}
            };

            phone = new ATT.private.Phone();

            callRejectedSpy = sinon.spy();
            phone.on('call-rejected', callRejectedSpy);


            session = new ATT.rtc.Session();

            sessionConstructorStub = sinon.stub(ATT.rtc, 'Session', function () {
              return session;
            });

            createCallStub = sinon.stub(phone.getSession(), 'createCall', function () {
              return call;
            });

            connectStub = sinon.stub(call, 'connect');
            deleteCurrentCallStub = sinon.stub(phone.getSession(), 'deleteCurrentCall');

            phone.dial(options);

            sessionConstructorStub.restore();
            createCallStub.restore();

          });

          afterEach(function () {
            deleteCurrentCallStub.restore();
            connectStub.restore();
          });

          it('should trigger `call-rejected` when call publishes `rejected` event', function (done) {

            emitterCall.publish('rejected');

            setTimeout(function () {
              try {
                expect(callRejectedSpy.called).to.equal(true);
                expect(deleteCurrentCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 200);
          });
        });

        describe('error', function () {

          it('should publish `error` event with the error data on getting an `error` from call');

        });
      });
    });
  });
});