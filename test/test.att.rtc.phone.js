/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/

describe('Phone', function () {
  'use strict';

  var factories,
    eventData,
    error,
    errorData,
    confOpts,
    localVideo,
    remoteVideo,
    getRTCManagerStub,
    createPeerConnectionStub,
    restClientStub,
    ums,
    Phone;

  before(function () {
    ums = ATT.UserMediaService;
    factories = ATT.private.factories;
    confOpts = {
      breed: 'conference',
      peer: '123',
      type: 'abc',
      mediaType: 'video'
    };
    eventData = {
      abc: 'abc'
    };
    error = {
      ErrorMessage: 'Test Error'
    };
    errorData = {
      error: error
    };
  });

  beforeEach(function () {
    Phone = ATT.private.Phone;
    restClientStub = sinon.stub(RESTClient.prototype, 'ajax');

    localVideo = document.createElement('video');
    remoteVideo = document.createElement('video');

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return {
        on: function (event, handler) {
          return {};
        },
        connectCall: function () {},
        stopUserMedia: function () { return; }
      };
    });
    createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection', function () {
      return {};
    });
  });

  afterEach(function () {
    getRTCManagerStub.restore();
    restClientStub.restore();
    createPeerConnectionStub.restore();
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

	    it('should register for `call-disconnected` event on the session object', function() {
        expect(onSpy.calledWith('call-disconnected')).to.equal(true);
      });

      it('should register for `conference-disconnected` event on the session object', function() {
        expect(onSpy.calledWith('conference-disconnected')).to.equal(true);
      });

      it('should register for `conference-invite` event on session object', function () {
        expect(onSpy.calledWith('conference-invite')).to.equal(true);
      });

      it('should register for `error` event on session object', function () {
        expect(onSpy.calledWith('error')).to.equal(true);
      });

    });

    describe('Methods', function () {

      var phone,
        session,
        call,
        conference,
        emitter,
        emitterSession,
        emitterCall,
        emitterConference,
        createEventEmitterStub,
        callConstructorStub,
        sessionConstructorStub,
        onErrorHandlerSpy;

      beforeEach(function () {

        emitterCall = ATT.private.factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
          return emitterCall;
        });

        call = new ATT.rtc.Call({
          breed: 'call',
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
              expect(onSessionReadySpy.called).to.equal(true);
              expect(onSessionReadySpy.calledWith(data)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
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

            expect(ATT.errorDictionary.getSDKError('2002')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('2002')
            })).to.equal(true);

          });

          it('[2001] should be published with `error` event if no token in options', function () {

            phone.login({});

            expect(ATT.errorDictionary.getSDKError('2001')).to.be.an('object');
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

            expect(ATT.errorDictionary.getSDKError('2005')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('2005')
            })).to.equal(true);

          });

          it('[2004] should be published with `error` event if there is an unknown exception during the operation', function () {

            phone.login(options);

            expect(ATT.errorDictionary.getSDKError('2004')).to.be.an('object');
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
          session.setId('sessionid');
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
          }, 50);
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
            publishStub.restore();
            disconnectStub.restore();
          });

          it('[3001] should be published with `error` event if the session is not connected', function () {

            // clear out session id
            session.setId(null);

            phone.logout();

            expect(ATT.errorDictionary.getSDKError('3001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('3001')
            })).to.equal(true);

          });

          it('[3000] should be published with `error` event if there is an error during the operation', function () {

            phone.logout();

            expect(ATT.errorDictionary.getSDKError('3000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('3000')
            })).to.equal(true);

          });

        });

      });

      describe('[US225742, US221316, US198801] dial', function () {

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
            breed: 'call',
            mediaType: 'video',
            localMedia: localVideo,
            remoteMedia: remoteVideo,
            holdCurrentCall: true
          };

          onSpy = sinon.spy(call, 'on');

          callConnectStub = sinon.stub(call, 'connect', function () {
          });

          session.setId('1234');

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

        it('should trigger the `dialing` event with event data', function (done) {
          phone.dial(options);

          setTimeout(function () {
            expect(onDialingSpy.called).to.equal(true);
            expect(onDialingSpy.getCall(0).args[0]).to.be.an('object');
            expect(onDialingSpy.getCall(0).args[0].to).to.be.a('string');
            expect(onDialingSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(typeof onDialingSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 50);
        });

        it('should call session.createCall', function () {
          var createCallSpy = sinon.spy(session, 'createCall');
          phone.dial(options);

          expect(createCallSpy.called).to.equal(true);
          expect(createCallSpy.getCall(0).args[0].peer).to.be.a('string');
          expect(createCallSpy.getCall(0).args[0].type).to.be.a('string');
          expect(createCallSpy.getCall(0).args[0].breed).to.be.a('string');
          expect(createCallSpy.getCall(0).args[0].mediaType).to.be.a('string');
          expect(createCallSpy.getCall(0).args[0].localMedia).to.be.a('object');
          expect(createCallSpy.getCall(0).args[0].localMedia).to.be.a('object');

          createCallSpy.restore();
        });

        it('should register for the `connecting` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('connecting')).to.equal(true);
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
          var getUserMediaStub;

          beforeEach(function () {
            getUserMediaStub = sinon.stub(ums, 'getUserMedia');
          });

          afterEach(function (){
            getUserMediaStub.restore();
          });

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
            }, 50);
          });

          it('should trigger `call-rejected` with relevant data when call publishes `rejected` event', function (done) {
            phone.dial(options);

            emitterCall.publish('rejected', eventData);
            setTimeout(function () {
              try {
                expect(callRejectedHandlerSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
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
            }, 50);
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
            }, 50);
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
            }, 50);
          });

        });

        describe('Error Handling', function () {

          var publishStub;

          beforeEach(function () {

            publishStub = sinon.stub(emitter, 'publish', function () {});

            callConnectStub.restore();

            callConnectStub = sinon.stub(call, 'connect', function () {
              throw error;
            });

            phone.login({
              token: '1234'
            });

            session.setId('1234');

          });

          afterEach(function () {
            publishStub.restore();
            callConnectStub.restore();
          });

          it('[4002] should be published with `error` event if invalid mediaType in options', function () {

            phone.dial({
              destination: '1234',
              localMedia: 'foo',
              remoteMedia: 'bar',
              mediaType: 'foobar'
            });

            expect(ATT.errorDictionary.getSDKError('4002')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4002')
            })).to.equal(true);
          });

          it('[4003] should be published with `error` event if there is an unknown exception during the operation', function () {

            phone.dial({
              destination: '1234',
              localMedia: 'foo',
              remoteMedia: 'bar',
              mediaType: 'video'
            });

            expect(ATT.errorDictionary.getSDKError('4003')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4003')
            })).to.equal(true);
          });

          it('[4004] should be published with `error` event if the user is not logged in', function () {

            session.setId(null);

            phone.dial({
              destination: '1234',
              localMedia: 'foo',
              remoteMedia: 'bar',
              mediaType: 'video'
            });

            expect(ATT.errorDictionary.getSDKError('4004')).to.be.an('object');
            expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('4004')
            })).to.equal(true);
          });

          it('[4006] should be published with `error` event if localMedia is not defined', function () {

            phone.dial({
              destination: '1234',
              remoteMedia: 'bar',
              mediaType: 'audio'
            });

            expect(ATT.errorDictionary.getSDKError('4006')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4006')
            })).to.equal(true);
          });

          it('[4007] should be published with `error` event if remoteMedia is not defined', function () {

            phone.dial({
              destination: '1234',
              localMedia: 'bar',
              mediaType: 'audio'
            });

            expect(ATT.errorDictionary.getSDKError('4007')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4007')
            })).to.equal(true);
          });

          it('[4008] should be published with `error` event if destination is not defined', function () {

            phone.dial({
              localMedia: 'bar',
              remoteMedia: 'foo',
              mediaType: 'audio'
            });

            expect(ATT.errorDictionary.getSDKError('4008')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4008')
            })).to.equal(true);
          });

          it('[4009] should be published with `error` event if options are not defined', function () {

            phone.dial();

            expect(ATT.errorDictionary.getSDKError('4009')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4009')
            })).to.equal(true);
          });
        });
      });

      describe('[US198535] answer', function () {

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

          session.setId('ABC');
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

        it('[5004] should be published `error` event with error data if called without any options', function (done) {

          phone.answer();

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledOnce).to.equal(true);
            expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5004');
            done();
          }, 50);

        });

        it('[5001] should be published `error` event with error data if called without `localMedia`', function (done) {

          phone.answer({
            test: 'test'
          });

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledOnce).to.equal(true);
            expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5001');
            done();
          }, 50);

        });

        it('[5001] should be published `error` event with error data if called without `remoteMedia`', function (done) {

          phone.answer({
            localMedia: options.localMedia
          });

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledOnce).to.equal(true);
            expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5001');
            done();
          }, 50);
        });

        it('[5003] should publish `error` event with data if the user is not logged in', function (done) {


          session.setId(null);

          phone.answer(options);

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledOnce).to.equal(true);
            expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5003');
            done();
          }, 50);
        });

        it('[5000] should publish `error` event with error data if there is no current call', function (done) {

          session.currentCall = null;

          phone.answer(options);

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledOnce).to.equal(true);
            expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5000');
            done();
          }, 50);

        });

        it('[5002] should publish `error` with data when there\'s an uncaught exception', function (done) {

          session.currentCall = undefined;

          phone.answer(options);

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledOnce).to.equal(true);
            expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5002');
            done();
          }, 50);
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
          }, 50);
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
            }, 50);
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
            }, 50);
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
            }, 50);
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
            }, 50);
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
            }, 50);
          });

          it('[5002] should trigger `error` with relevant data when call publishes `error` event', function (done) {

            phone.answer(options);

            emitterCall.publish('error', eventData);

            setTimeout(function () {
              try {
                expect(onErrorHandlerSpy.calledOnce).to.equal(true);
                expect(onErrorHandlerSpy.getCall(0).args[0].data).to.be.an('object');
                expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5002');
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

          });

        });
      });

      describe('[US272608] joinConference', function () {

        var options,
          conferenceJoiningSpy,
          getUserMediaStub,
          onSpy;

        beforeEach(function () {

          options = {
            localMedia: localVideo,
            remoteMedia: remoteVideo,
            mediaType: 'video'
          };

          createEventEmitterStub.restore();

          emitterConference = ATT.private.factories.createEventEmitter();

          createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
            return emitterConference;
          });

          callConstructorStub.restore();

          conference = new ATT.rtc.Call({
            breed: 'conference',
            peer: '1234567',
            type: 'abc',
            mediaType: 'video'
          });

          callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
            return conference;
          });

          onSpy = sinon.spy(conference, 'on');


          conferenceJoiningSpy = sinon.spy();

          phone.on('conference-joining', conferenceJoiningSpy);

          session.setId('sessionId');

          session.currentCall = conference;
        });

        afterEach(function () {
          onSpy.restore();
        });

        it('should exists', function () {
          expect(phone.joinConference).to.be.a('function');
        });

        it('should publish `conference-joining` immediately with relevant data', function (done) {

          phone.joinConference(options);

          setTimeout(function () {
            try {
              expect(conferenceJoiningSpy.called).to.equal(true);
              expect(conferenceJoiningSpy.getCall(0).args[0]).to.be.an('object');
              expect(conferenceJoiningSpy.getCall(0).args[0].from).to.be.a('string');
              expect(conferenceJoiningSpy.getCall(0).args[0].mediaType).to.be.a('string');
              expect(conferenceJoiningSpy.getCall(0).args[0].codec).to.be.an('array');
              expect(typeof conferenceJoiningSpy.getCall(0).args[0].timestamp).to.equal('object');
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
        });

        it('should register for `connecting` event from call', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('connecting')).to.equal(true);
        });

        it('should register for `error` event from call', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('error')).to.equal(true);
        });

        it('should register for `connected` event from call', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('connected')).to.equal(true);
        });

        it('should execute userMedia.getUserMedia with correct input params', function () {
          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia');

          phone.joinConference(options);

          expect(getUserMediaStub.called).to.equal(true);
          expect(getUserMediaStub.getCall(0).args[0]).to.be.an('object');
          expect(getUserMediaStub.getCall(0).args[0].localMedia).to.be.an('object');
          expect(getUserMediaStub.getCall(0).args[0].remoteMedia).to.be.an('object');
          expect(getUserMediaStub.getCall(0).args[0].mediaType).to.be.an('string');
          expect(getUserMediaStub.getCall(0).args[0].onUserMedia).to.be.a('function');
          expect(getUserMediaStub.getCall(0).args[0].onMediaEstablished).to.be.a('function');
          expect(getUserMediaStub.getCall(0).args[0].onUserMediaError).to.be.a('function');

          getUserMediaStub.restore();
        });

        describe('getUserMedia Callbacks', function () {

          describe('onUserMedia', function () {

            var addStreamStub,
              connectStub,
              onUserMediaSpy,
              media;

            beforeEach(function() {
              media = {
                localStream: {
                  stream: 'stream'
                },
                mediaConstraints: {
                  audio: 'true',
                  video: 'true'
                }
              };

              connectStub = sinon.stub(conference, 'connect', function() {});
              addStreamStub = sinon.stub(conference, 'addStream', function () {});


              getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
                onUserMediaSpy = sinon.spy(options, 'onUserMedia');
                setTimeout(function () {
                  options.onUserMedia(media);
                }, 0);
              });

            });

            afterEach(function () {
              addStreamStub.restore();
              connectStub.restore();
              onUserMediaSpy.restore();
              getUserMediaStub.restore();
            });

            it('should execute Call.addStream with local stream', function (done) {
              phone.joinConference(options);

              setTimeout(function () {
                try {
                  expect(addStreamStub.calledAfter(onUserMediaSpy)).to.equal(true);
                  expect(addStreamStub.calledBefore(connectStub)).to.equal(true);
                  expect(addStreamStub.calledWith(media.localStream)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });

            it('should execute Call.connect', function (done) {
              phone.joinConference(options);

              setTimeout(function () {
                try {
                  expect(connectStub.calledAfter(onUserMediaSpy)).to.equal(true);
                  expect(connectStub.called).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });

            it('[20000] should be published with `error` event if there is an uncaught exception', function (done) {

              connectStub.restore();

              connectStub = sinon.stub(conference, 'connect', function () {
                throw error;
              });

              phone.joinConference(options);

              setTimeout(function () {
                try {
                  expect(ATT.errorDictionary.getSDKError('20000')).to.be.an('object');
                  expect(onErrorHandlerSpy.called).to.equal(true);
                  expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('20000');
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);

            });

          });

          describe('getUserMedia: onMediaEstablished', function () {

            it('should publish `media-established` when onMediaEstablished  is invoked', function (done) {
              var mediaEstablishedSpy = sinon.spy(),
                getUserMediaStub,
                userMediaService = ATT.UserMediaService;

              getUserMediaStub = sinon.stub(userMediaService, 'getUserMedia', function (options) {
                options.onMediaEstablished();
              });

              phone.on('media-established', mediaEstablishedSpy);

              phone.joinConference({
                localMedia : {},
                remoteMedia : {}
              });

              setTimeout(function () {
                try {
                  expect(mediaEstablishedSpy.calledOnce).to.equal(true);
                  expect(mediaEstablishedSpy.getCall(0).args[0].from).to.be.a('string');
                  expect(mediaEstablishedSpy.getCall(0).args[0].mediaType).to.be.a('string');
                  expect(mediaEstablishedSpy.getCall(0).args[0].codec).to.be.a('array');
                  expect(mediaEstablishedSpy.getCall(0).args[0].timestamp).to.be.a('date');
                  getUserMediaStub.restore();
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);

            });
          });

          describe('[20002] getUserMedia: onUserMediaError', function () {
            var getUserMediaStub, phone3,
              onErrorSpy;

            beforeEach(function () {
              onErrorSpy = sinon.spy();
              getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
                options.onUserMediaError();
              });
              phone3 = new Phone();
              phone3.on('error', onErrorSpy);

            });

            afterEach(function () {
              getUserMediaStub.restore();
            });

            it('should publish error', function (done) {
              phone3.joinConference({
                localMedia : {},
                remoteMedia : {}
              });
              setTimeout(function () {
                expect(onErrorSpy.called).to.equal(true);
                expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('20002');
                done();
              }, 50);
            });
          });

        });

        describe('joinConference events', function () {

          var onConfConnectingHandlerSpy,
            conferenceConnectedSpy,
            conferenceErrorSpy;

          beforeEach(function () {
            onConfConnectingHandlerSpy = sinon.spy();
            conferenceConnectedSpy = sinon.spy();
            conferenceErrorSpy = sinon.spy();

            phone.on('conference-connecting', onConfConnectingHandlerSpy);
            phone.on('conference-connected', conferenceConnectedSpy);
            phone.on('error', conferenceErrorSpy);

            phone.joinConference(options);
          });

          describe('connecting', function () {

            it('should publish `conference-connecting` with event data on getting a connecting event from call', function (done) {
              emitterConference.publish('connecting', eventData);

              setTimeout(function() {
                try {
                  expect(onConfConnectingHandlerSpy.calledWith(eventData)).to.equal(true);
                  done();
                } catch(e) {
                  done(e);
                }
              }, 50);
            });

            it('should publish `conference-connected` when call publishes `connected` event', function (done) {
              emitterConference.publish('connected', eventData);

              setTimeout(function () {
                try {
                  expect(conferenceConnectedSpy.calledWith(eventData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });
          });

          describe('error', function () {
            it('should publish `error` when call publishes `error` event', function (done) {
              emitterConference.publish('error', eventData);

              setTimeout(function () {
                try {
                  expect(conferenceErrorSpy.calledWith(eventData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });
          });
        });

        describe('Error Handling', function () {

          it('[20000] should be published with `error` event if there is an uncaught exception', function (done) {

            getUserMediaStub.restore();

            getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function () {
              throw error;
            });

            phone.joinConference(options);

            setTimeout(function () {
              try {
                expect(ATT.errorDictionary.getSDKError('20000')).to.be.an('object');
                expect(onErrorHandlerSpy.called).to.equal(true);
                expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('20000');
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

          });

          it('[20001] should be published with `error` event if the user is not logged in', function (done) {
            session.setId(null);

            phone.joinConference(options);

            setTimeout(function () {
              try {
                expect(ATT.errorDictionary.getSDKError('20001')).to.be.an('object');
                expect(onErrorHandlerSpy.called).to.equal(true);
                expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('20001');
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

          });

          it('[20002] should be published with `error` event if there is no incoming conference invite', function (done) {
            session.currentCall = null;

            phone.joinConference(options);

            setTimeout(function () {
              try {
                expect(ATT.errorDictionary.getSDKError('20002')).to.be.an('object');
                expect(onErrorHandlerSpy.called).to.equal(true);
                expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('20002');
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

          });

        });
      });

      describe('[US225737] addParticipant', function () {

        var publishStub,
          addParticipantStub,
          conference,
          onSpy,
          onErrorSpy,
          emitterConference,
          onParticipantPendingSpy;

        beforeEach(function () {

          createEventEmitterStub.restore();

          emitterConference = ATT.private.factories.createEventEmitter();

          createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
            return emitterConference;
          });

          callConstructorStub.restore();

          conference = new ATT.rtc.Call({
            breed: 'conference',
            peer: '1234567',
            type: 'abc',
            mediaType: 'video',
            id: '1234'
          });

          onSpy = sinon.spy(conference, 'on');
          onParticipantPendingSpy = sinon.spy();
          onErrorSpy = sinon.spy();

          addParticipantStub = sinon.stub(conference, 'addParticipant');
          publishStub = sinon.stub(emitter, 'publish');

          callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
            return conference;
          });

          session.currentCall = conference;

          session.setId('123456');

          phone.addParticipant('1234');
        });

        afterEach(function () {
          publishStub.restore();
          addParticipantStub.restore();
          onSpy.restore();
        });

        it('should exist', function () {
          expect(phone.addParticipant).to.be.a('function');
        });

        it('should register for `response-pending` event on the conference object', function () {
          expect(onSpy.called).to.equal(true);
          expect(onSpy.calledWith('response-pending')).to.equal(true);
        });

        it('should register for `invite-accepted` event on the conference object', function () {
          expect(onSpy.calledWith('invite-accepted')).to.equal(true);
          expect(onSpy.called).to.equal(true);
        });

        it('should register for `rejected` event on the conference object', function () {
          expect(onSpy.calledWith('rejected')).to.equal(true);
          expect(onSpy.called).to.equal(true);
        });

        it('should publish `conference:inviting` immediately', function () {
          expect(publishStub.calledWith('conference:inviting')).to.equal(true);
        });

        it('should execute call.addParticipant', function () {
          phone.addParticipant('1234');
          expect(addParticipantStub.calledWith('1234')).to.equal(true);
        });

        describe('addParticipant events', function () {

          describe('conference:response-pending', function () {

            it('should publish `response-pending` with event data on getting a `response-pending`', function (done) {
              emitterConference.publish('response-pending', eventData);

              setTimeout(function() {
                try {
                  expect(publishStub.calledWith('conference:response-pending', eventData)).to.equal(true);
                  done();
                } catch(e) {
                  done(e);
                }
              }, 100);
            });
          });

          describe('conference:invite-accepted', function () {

            it('should publish `conference:invite-accepted` with event data on getting a `invite-accepted`', function (done) {
              emitterConference.publish('invite-accepted', eventData);

              setTimeout(function() {
                try {
                  expect(publishStub.calledWith('conference:invite-accepted', eventData)).to.equal(true);
                  done();
                } catch(e) {
                  done(e);
                }
              }, 50);
            });
          });

          describe('conference:invite-rejected', function () {

            it('should publish `conference:invite-rejected` with event data on getting a `rejected`', function (done) {
              emitterConference.publish('rejected', eventData);

              setTimeout(function() {
                try {
                  expect(publishStub.calledWith('conference:invite-rejected', eventData)).to.equal(true);
                  done();
                } catch(e) {
                  done(e);
                }
              }, 50);
            });
          });
        });

        describe('Error Handling', function () {

          it('[19000] should be thrown if the user is not logged in', function () {
            session.setId(null);
            phone.addParticipant();

            expect(ATT.errorDictionary.getSDKError('19000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('19000')
            })).to.equal(true);
          });

          it('[19001] should be thrown if conference has not been started', function () {

            conference.breed = function () {
              return 'call';
            };

            phone.addParticipant('1234');

            expect(ATT.errorDictionary.getSDKError('19001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('19001')
            })).to.equal(true);
          });

          it('[19002] should be thrown if parameter `participant` is not passed in', function () {

            phone.addParticipant();

            expect(ATT.errorDictionary.getSDKError('19002')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('19002')
            })).to.equal(true);
          });

          it('[19003] should be thrown if internal error occurred', function () {
            addParticipantStub.restore();
            addParticipantStub = sinon.stub(conference, 'addParticipant', function() {
              throw error;
            });

            phone.addParticipant('12345');

            expect(ATT.errorDictionary.getSDKError('19003')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('19003')
            })).to.equal(true);

            addParticipantStub.restore();
          });
        });
      });

      describe.skip('[US233244] getParticipants', function () {

        var publishStub;

        beforeEach(function () {

          callConstructorStub.restore();

          conference = new ATT.rtc.Call({
            breed: 'conference',
            peer: '1234567',
            type: 'abc',
            mediaType: 'video',
            id: '1234'
          });

          publishStub = sinon.stub(emitter, 'publish');

          callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
            return conference;
          });

          session.currentCall = conference;
          session.setId('123456');

        });

        afterEach(function () {
          callConstructorStub.restore();
          publishStub.restore();

        });

        it('should exist', function () {
          expect(phone.getParticipants).to.be.a('function');
        });

        it('should call `conference.participants`', function () {
          var getParticipantsSpy;

          getParticipantsSpy = sinon.spy(conference, 'participants');

          phone.getParticipants();

          expect(getParticipantsSpy.called).to.equal(true);

          getParticipantsSpy.restore();
        });

        it('should return active `participants` list', function () {
          conference.setParticipant('456', 'invited', '123');
          conference.setParticipant('454', 'active', '124');

          var participants = phone.getParticipants();

          expect(participants).to.be.an('object');
          expect(participants['454']).to.be.an('object');
          expect(participants['454'].status).to.equal('active');

          expect(participants['456']).to.equal(undefined);
        });

        describe('Error Handling', function () {
          it('[21002] should be thrown if User not Logged In', function () {
            var sessiongetIdStub = sinon.stub(session , 'getId', function () {
              return null;
            });

            phone.getParticipants();

            expect(ATT.errorDictionary.getSDKError('21002')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('21002')
            })).to.equal(true);
            sessiongetIdStub.restore();
          });
          it('[21000] should be thrown if conference has not been started', function () {
            session.currentCall = null;

            phone.getParticipants();

            expect(ATT.errorDictionary.getSDKError('21000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('21000')
            })).to.equal(true);
          });

          it('[21000] should be thrown if `breed` is not equal to `conference`', function () {
            conference.breed = function () {
              return 'call';
            };

            phone.getParticipants();

            expect(ATT.errorDictionary.getSDKError('21000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('21000')
            })).to.equal(true);
          });

          it('[21001] should be thrown if internal error occurred', function () {
            var getParticipantsStub;

            getParticipantsStub = sinon.stub(conference, 'participants', function () {
              throw error;
            });

            phone.getParticipants();

            expect(ATT.errorDictionary.getSDKError('21001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('21001')
            })).to.equal(true);

            getParticipantsStub.restore();
          });

        });

      });

      describe('[US198615] mute & unmute', function () {

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

          call.setId('1234');

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
            }, 50);
          });

          describe('Error Handling', function () {

            var publishStub;

            beforeEach(function () {

              publishStub = sinon.stub(emitter, 'publish', function () {});

              callMuteStub.restore();

              callMuteStub = sinon.stub(call, 'mute', function () {
                throw error;
              });

            });

            afterEach(function () {
              publishStub.restore();
              callMuteStub.restore();
            });

            it('[9000] should be published if Session.currentCall does not exist or is not connected', function () {

              session.currentCall.id = null;

              phone.mute();

              expect(ATT.errorDictionary.getSDKError('9000')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('9000')
              })).to.equal(true);
            });

            it('[9001] should be published with `error` event if there is an error during the operation', function () {

              phone.mute();

              expect(ATT.errorDictionary.getSDKError('9001')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('9001')
              })).to.equal(true);

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
            }, 50);
          });


          describe('Error Handling', function () {
            var publishStub;

            beforeEach(function () {
              publishStub = sinon.stub(emitter, 'publish', function () {});
              callUnmuteStub.restore();

              callUnmuteStub = sinon.stub(call, 'unmute', function () {
                throw error;
              });

            });

            afterEach(function () {
              publishStub.restore();
              callUnmuteStub.restore();
            });

            it('[10000] should be published if Session.currentCall does not exist or is not connected', function () {
              session.currentCall.id = null;

              phone.unmute();

              expect(ATT.errorDictionary.getSDKError('10000')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('10000')
              })).to.equal(true);
            });

            it('[10001] should be published with `error` event if there is an error during the operation', function () {

              phone.unmute();

              expect(ATT.errorDictionary.getSDKError('10001')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('10001')
              })).to.equal(true);
            });

          });
        });
      });

      describe('[US198537] hangup', function () {

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
          call.setId('1234');
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
          call.setId('1234');

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
          }, 50);
        });

        describe('Error Handling', function () {

          var publishStub;

          beforeEach(function () {

            publishStub = sinon.stub(emitter, 'publish', function () {});

            callDisconnectStub.restore();

            callDisconnectStub = sinon.stub(call, 'disconnect', function () {
              throw error;
            });
          });

          afterEach(function () {
            publishStub.restore();
            callDisconnectStub.restore();
          });

          it('[6000] should be published with `error` event if call is not in progress', function () {
            call.setId(null);

            phone.hangup();

            expect(ATT.errorDictionary.getSDKError('6000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('6000')
            })).to.equal(true);
          });

          it('[6001] should be published with `error` event if there is an unknown exception during the operation', function () {

            phone.hangup();

            expect(ATT.errorDictionary.getSDKError('6001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('6001')
            })).to.equal(true);
          });
        });
      });

      describe('[US248581] cancel', function () {

        beforeEach(function () {
          session.currentCall = call;
        });

        it('should exist', function () {
          expect(phone.cancel).to.be.a('function');
        });

        it('should publish `call-canceled` immediately if [null == call.id]', function () {
          call.setId(null);
          var publishStub = sinon.stub(emitter, 'publish', function () {});

          phone.cancel();

          expect(publishStub.calledWith('call-canceled')).to.equal(true);
          expect(publishStub.getCall(0).args[1].to).to.equal(call.peer());
          expect(publishStub.getCall(0).args[1].mediaType).to.equal(call.mediaType());
          expect(typeof publishStub.getCall(0).args[1].timestamp).to.equal('object');

          publishStub.restore();
        });

        it('should follow up by calling session.deleteCurrentCall after publishing `call-canceled`', function () {
          var deleteCurrentCallStub = sinon.stub(session, 'deleteCurrentCall');
          call.setId(null);

          phone.cancel();

          expect(deleteCurrentCallStub.called).to.equal(true);

          deleteCurrentCallStub.restore();
        });

        it('should execute call.disconnect', function () {
          var callDisconnectStub = sinon.stub(call, 'disconnect');
          call.setId('123');
          phone.cancel();

          expect(callDisconnectStub.called).to.equal(true);
          callDisconnectStub.restore();
        });

        describe('Error Handling', function () {

          var publishStub,
            callCancelStub;

          beforeEach(function () {
            session.currentCall = call;
            call.setId('1234');
            publishStub = sinon.stub(emitter, 'publish', function () {});

            callCancelStub = sinon.stub(call, 'disconnect', function () {
              throw error;
            });

          });

          afterEach(function () {
            publishStub.restore();
            callCancelStub.restore();
          });

          it('[11000] should be published with `error` event if call has not been initiated', function () {
            session.currentCall = null;
            phone.cancel();
            expect(ATT.errorDictionary.getSDKError('11000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('11000')
            })).to.equal(true);
          });

          it('[11001] should be published with `error` event if there is an unknown exception during the operation', function () {
            call.setId('1234');
            session.currentCall = call;
            phone.cancel();

            expect(ATT.errorDictionary.getSDKError('11001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('11001')
            })).to.equal(true);
          });
        });


      });

      describe('[US248577] reject', function () {

        var onSpy,
          callRejectStub,
          callRejectedSpy;

        beforeEach(function () {

          onSpy = sinon.spy(call, 'on');
          callRejectStub = sinon.stub(call, 'reject', function () {
          });

          callRejectedSpy = sinon.spy();

          phone.on('call-disconnected', callRejectedSpy);

          call.setId('123');
          session.currentCall = call;
        });

        afterEach(function () {
          callRejectStub.restore();
        });

        it('should exist', function () {
          expect(phone.reject).to.be.a('function');
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
          }, 50);
        });
        describe('Error Handling', function () {

          var publishStub;

          beforeEach(function () {
            session.currentCall = call;
            call.setId('1234');
            publishStub = sinon.stub(emitter, 'publish', function () {});

            callRejectStub.restore();

            callRejectStub = sinon.stub(call, 'reject', function () {
              throw error;
            });

          });

          afterEach(function () {
            publishStub.restore();
            callRejectStub.restore();
          });

          it('[12000] should be published with `error` event if call has not been initiated', function () {
            session.currentCall = null;
            phone.reject();
            expect(ATT.errorDictionary.getSDKError('12000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('12000')
            })).to.equal(true);
          });

          it('[12001] should be published with `error` event if there is an unknown exception during the operation', function () {
            call.setId('1234');
            session.currentCall = call;
            phone.reject();

            expect(ATT.errorDictionary.getSDKError('12001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('12001')
            })).to.equal(true);
          });
        });
      });

      describe('[US272608] rejectConference', function () {

        var onSpy,
          rejectStub,
          onConfDisconnectedHandlerSpy;

        beforeEach(function () {
          session.setId('sessionId');

          createEventEmitterStub.restore();

          emitterConference = ATT.private.factories.createEventEmitter();

          createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
            return emitterConference;
          });

          callConstructorStub.restore();

          conference = new ATT.rtc.Call({
            breed: 'conference',
            peer: '1234567',
            type: 'abc',
            mediaType: 'video'
          });

          callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
            return conference;
          });

          onSpy = sinon.spy(conference, 'on');
          rejectStub = sinon.stub(conference, 'reject', function () {});

          session.currentCall = conference;

          onConfDisconnectedHandlerSpy = sinon.spy();
          phone.on('conference:disconnected', onConfDisconnectedHandlerSpy);
        });

        afterEach(function () {
          onSpy.restore();
          rejectStub.restore();
        });

        it('should exist', function () {
          expect(phone.rejectConference).to.be.a('function');
        });

        it('should invoke Call.reject', function () {
          phone.rejectConference();

          expect(rejectStub.called).to.equal(true);
        });

        describe('Error Handling', function () {

          it('[22000] should be published with `error` event when there is an uncaught exception', function (done) {
            rejectStub.restore();

            rejectStub = sinon.stub(conference, 'reject', function () {
              throw error;
            });

            phone.rejectConference();

            setTimeout(function () {
              try {
                expect(ATT.errorDictionary.getSDKError('22000')).to.be.an('object');
                expect(onErrorHandlerSpy.called).to.equal(true);
                expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('22000');
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

          it('[22001] should be published with `error` event if the user is not logged in', function (done) {
            session.setId(null);

            phone.rejectConference();

            setTimeout(function () {
              try {
                expect(ATT.errorDictionary.getSDKError('22001')).to.be.an('object');
                expect(onErrorHandlerSpy.called).to.equal(true);
                expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('22001');
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

          });

          it('[22002] should be published with `error` event if there is no incoming conference invite', function (done) {
            session.currentCall = null;

            phone.rejectConference();

            setTimeout(function () {
              try {
                expect(ATT.errorDictionary.getSDKError('22002')).to.be.an('object');
                expect(onErrorHandlerSpy.called).to.equal(true);
                expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('22002');
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

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

          call.setId('1234');

        });

        afterEach(function () {
          callHoldStub.restore();
          callResumeStub.restore();
        });

        describe('[US198538] hold', function () {

          it('should exist', function () {
            expect(phone.hold).to.be.a('function');
          });

          it('should execute call.hold', function () {
            phone.hold();

            expect(callHoldStub.called).to.equal(true);
          });

          describe('Error Handling', function () {

            var publishStub;

            beforeEach(function () {

              publishStub = sinon.stub(emitter, 'publish', function () {});

              callHoldStub.restore();

              callHoldStub = sinon.stub(call, 'hold', function () {
                throw error;
              });
            });

            afterEach(function () {
              publishStub.restore();
              callHoldStub.restore();
            });

            it('[7000] should be published with `error` event if call is not in progress', function () {
              call.setId(null);

              phone.hold();

              expect(ATT.errorDictionary.getSDKError('7000')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('7000')
              })).to.equal(true);
            });

            it('[7001] should be published with `error` event if there is an unknown exception during the operation', function () {

              phone.hold();

              expect(ATT.errorDictionary.getSDKError('7001')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('7001')
              })).to.equal(true);
            });
          });

        });

        describe('[US221385] resume', function () {

          it('should exist', function () {
            expect(phone.resume).to.be.a('function');
          });

          it('should execute call.resume', function () {
            call.setState('held');
            phone.resume();

            expect(callResumeStub.called).to.equal(true);
          });

          describe('Error Handling', function () {

            var publishStub;

            beforeEach(function () {

              publishStub = sinon.stub(emitter, 'publish', function () {});

              callResumeStub.restore();

              callResumeStub = sinon.stub(call, 'resume', function () {
                throw error;
              });

              call.setState('held');
            });

            afterEach(function () {
              publishStub.restore();
              callResumeStub.restore();
            });

            it('[8000] should be published with `error` event if call is not in progress', function () {
              call.setId(null);

              phone.resume();

              expect(ATT.errorDictionary.getSDKError('8000')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('8000')
              })).to.equal(true);
            });

            it('[8001] should be published with `error` event if the call is not on hold', function () {

              call.setState('foobar');

              phone.resume();

              expect(ATT.errorDictionary.getSDKError('8001')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('8001')
              })).to.equal(true);
            });

            it('[8002] should be published with `error` event if there is an unknown exception during the operation', function () {

              call.setState('held');

              phone.resume();

              expect(ATT.errorDictionary.getSDKError('8002')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('8002')
              })).to.equal(true);
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

      describe('[US245682] updateE911Id', function () {

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

          session.setId('12345');

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
          }, 50);
        });

        describe('Error Handling', function () {

          var publishStub;

          beforeEach(function () {

            publishStub = sinon.stub(emitter, 'publish', function () {});

            updateE911IdStub.restore();

            updateE911IdStub = sinon.stub(session, 'updateE911Id', function () {
              throw error;
            });

          });

          afterEach(function () {
            publishStub.restore();
            updateE911IdStub.restore();
          });

          it('[17000] should be published with `error` event if e911 parameter is missing', function () {
            phone.updateE911Id();
            expect(ATT.errorDictionary.getSDKError('17000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('17000')
            })).to.equal(true);
          });

          it('[17001] should be published with `error` event if there is an unknown exception during the operation', function () {

            session.setId('1234');

            phone.updateE911Id({e911Id : '123454'});

            expect(ATT.errorDictionary.getSDKError('17001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('17001')
            })).to.equal(true);
          });

          it('[17002] should be published with `error` event if user not logged in', function () {
            session.setId(null);

            phone.updateE911Id({e911Id : '123454'});

            expect(ATT.errorDictionary.getSDKError('17002')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('17002')
            })).to.equal(true);
          });
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
          deleteCurrentCallStub,
          onCallIncomingHandlerSpy,
		      onCallDisconnectedHandlerSpy,
          onConferenceDisconnectedHandlerSpy,
          onConferenceInviteHandlerSpy,
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

          deleteCurrentCallStub = sinon.stub(session, 'deleteCurrentCall');

          onCallIncomingHandlerSpy = sinon.spy();
		      onCallDisconnectedHandlerSpy = sinon.spy();
          onConferenceDisconnectedHandlerSpy = sinon.spy();
          onConferenceInviteHandlerSpy = sinon.spy();
          onErrorHandlerSpy = sinon.spy();

          phone = new ATT.private.Phone();

          phone.on('call-incoming', onCallIncomingHandlerSpy);
          phone.on('conference-invite', onConferenceInviteHandlerSpy);
          phone.on('call-disconnected', onCallDisconnectedHandlerSpy);
          phone.on('conference:disconnected', onConferenceDisconnectedHandlerSpy);
          phone.on('error', onErrorHandlerSpy);

        });

        afterEach(function () {
          sessionConstructorStub.restore();
          deleteCurrentCallStub.restore();
        });

        describe('call-incoming', function () {

          it('should trigger `call-incoming` with relevant data on getting a `call-incoming` from session', function (done) {

            emitterSession.publish('call-incoming', eventData);

            setTimeout(function () {
              try {
                expect(onCallIncomingHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });
        });

        describe('conference-invite', function () {

          it('should trigger `conference-invite` with relevant data on getting a `conference-invite` from session', function (done) {

            emitterSession.publish('conference-invite', eventData);

            setTimeout(function () {
              try {
                expect(onConferenceInviteHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });
        });

        describe('call-disconnected', function () {

          it('should trigger `call-disconnected` session publishes `call-disconnected`', function (done) {

            emitterSession.publish('call-disconnected', eventData);

            setTimeout(function () {
              try {
                expect(onCallDisconnectedHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

          it('should also execute session.deleteCurrentCall', function (done) {

            emitterSession.publish('call-disconnected', eventData);

            setTimeout(function () {
              try {
                expect(deleteCurrentCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });
        });

        describe('conference:disconnected', function () {

          it('should trigger `conference:disconnected` if session publishes `conference-disconnected`', function (done) {

            emitterSession.publish('conference-disconnected', eventData);

            setTimeout(function () {
              try {
                expect(onConferenceDisconnectedHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

          it('should also execute session.deleteCurrentCall', function (done) {

            emitterSession.publish('conference-disconnected', eventData);

            setTimeout(function () {
              try {
                expect(deleteCurrentCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
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
            }, 50);
          });
        });

      });

      describe('Call', function () {

        describe('call-connected', function () {

          var phone,
            call,
            connectStub,
            answerOptions,
            session;

          beforeEach(function () {
            answerOptions = {
              localMedia: localVideo,
              remoteMedia: remoteVideo
            };

            phone = new ATT.private.Phone();

            // just to log if there's any error on phone, because now there are no
            // exceptions thrown, ever
            phone.on('error', function (data) {
              console.error(JSON.stringify(data));
            });

            session = phone.getSession();
            session.setId('ZBC')

            call = phone.getSession().createCall({
              breed: 'call',
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
            var callConnectedSpy = sinon.spy();

            phone.on('call-connected', callConnectedSpy);

            phone.answer(answerOptions);

            call.setState('connected');

            setTimeout(function () {
              try {
                expect(callConnectedSpy.called).to.equal(true);
                expect(callConnectedSpy.calledOnce).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

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
              breed: 'call',
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

            session = new ATT.rtc.Session();

            sessionConstructorStub = sinon.stub(ATT.rtc, 'Session', function () {
              return session;
            });

            phone = new ATT.private.Phone();

            callRejectedSpy = sinon.spy();
            phone.on('call-rejected', callRejectedSpy);

            createCallStub = sinon.stub(phone.getSession(), 'createCall', function () {
              return call;
            });

            connectStub = sinon.stub(call, 'connect');
            deleteCurrentCallStub = sinon.stub(phone.getSession(), 'deleteCurrentCall');

            session.setId('1234');

            phone.dial(options);
          });

          afterEach(function () {
            sessionConstructorStub.restore();
            createCallStub.restore();
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
            }, 50);
          });
        });

        describe('error', function () {

          it('should publish `error` event with the error data on getting an `error` from call');

        });
      });
    });
  });
});