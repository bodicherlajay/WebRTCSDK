/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/

describe('Phone', function () {
  'use strict';

  var factories,
    eventData,
    error,
    outgoingCallOpts,
    localVideo,
    remoteVideo,
    getRTCManagerStub,
    createPeerConnectionStub,
    restClientStub,
    ums,
    Phone,
    Call;

  before(function () {
    ATT.private.pcv = 1;
    ums = ATT.UserMediaService;
    factories = ATT.private.factories;
    Phone = ATT.private.Phone;
    Call = ATT.rtc.Call;

    eventData = {
      abc: 'abc'
    };

    error = {
      ErrorMessage: 'Test Error'
    };

    outgoingCallOpts = {
      breed: 'call',
      peer: '1234567',
      type: 'outgoing',
      mediaType: 'video'
    };
  });

  after(function () {
    ATT.private.pcv = 2;
  });

  beforeEach(function () {
    restClientStub = sinon.stub(RESTClient.prototype, 'ajax');

    localVideo = document.createElement('video');
    remoteVideo = document.createElement('video');

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return {
        on: function () {
          return {};
        },
        connectCall: function () {},
        stopUserMedia: function () { return; }
      };
    });
    createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function () {
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
      expect(phone instanceof Phone).to.equal(true);
    });

    it('should always return the same instance', function () {
      var phone1 = ATT.rtc.Phone.getPhone(),
        phone2 = ATT.rtc.Phone.getPhone();
      expect(phone1 === phone2).to.equal(true);
    });

  });

  describe('Pseudo Class', function () {

    it('should export ATT.private.Phone', function () {
      expect(Phone).to.be.a('function');
    });

    describe('ATT.private.Phone Constructor', function () {

      var phone,
        session,
        createEventEmitterSpy,
        sessionConstructorSpy,
        onSpy;

      beforeEach(function () {
        session = new ATT.rtc.Session();
        createEventEmitterSpy = sinon.spy(factories, 'createEventEmitter');
        sessionConstructorSpy = sinon.stub(ATT.rtc, 'Session', function () {
          return session;
        });
        onSpy = sinon.spy(session, 'on');
        phone = new Phone();
      });

      afterEach(function () {
        createEventEmitterSpy.restore();
        sessionConstructorSpy.restore();
      });

      it('should create a Phone object', function () {
        expect(phone instanceof Phone).to.equal(true);
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

      it('should register for `conference-invite` event on session object', function () {
        expect(onSpy.calledWith('conference-invite')).to.equal(true);
      });

      it('should register for `notification` event on session object', function () {
        expect(onSpy.calledWith('notification')).to.equal(true);
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

        emitterCall = factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
          return emitterCall;
        });

        call = new Call(outgoingCallOpts);

        callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
          return call;
        });

        createEventEmitterStub.restore();

        emitterSession = factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
          return emitterSession;
        });

        session = new ATT.rtc.Session();

        sessionConstructorStub = sinon.stub(ATT.rtc, 'Session', function () {
          return session;
        });

        createEventEmitterStub.restore();

        emitter = factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
          return emitter;
        });

        phone = new Phone();

        createEventEmitterStub.restore();

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

          expect(phone.on.bind(phone, 'session:ready', fn)).to.not.throw(Error);

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

          phone.on('session:ready', onSessionReadySpy);

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

        it('should create a session object if session is not defined', function () {
          phone.setSession(undefined);
          phone.login(options);

          expect(phone.getSession()).not.to.be.an('undefined');
        });

        it('should register for event `ready` from Session', function () {
          phone.login(options);

          expect(onSpy.calledWith('ready')).to.equal(true);
        });

        it('should execute Session.connect', function () {
          phone.login(options);

          expect(connectStub.called).to.equal(true);
        });

        it('should trigger `session:ready` event with data on receiving the `ready` event from Session', function (done) {
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
            expect(publishStub.calledWithMatch('error', {
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

          phone.on('session:disconnected', onSessionDisconnectedSpy);

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

        it('Should publish event `session:disconnected` on receiving a `disconnected` event from Session', function (done) {
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

        it('Should unsubscribe on event `disconnected` on receiving a `disconnected` event from Session', function (done) {
          var sessionOffStub = sinon.stub(session, 'off');

          phone.logout();

          emitterSession.publish('disconnected');

          setTimeout(function () {
            try {
              expect(sessionOffStub.calledWith('disconnected')).to.equal(true);
              sessionOffStub.restore();
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
        });

        it('Should unsubscribe on event `ready` on receiving a `disconnected` event from Session', function (done) {
          var sessionOffStub = sinon.stub(session, 'off');

          phone.logout();

          emitterSession.publish('disconnected');

          setTimeout(function () {
            try {
              expect(sessionOffStub.calledWith('ready')).to.equal(true);
              sessionOffStub.restore();
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
        });

        xit('should delete the current session object', function () {
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
            expect(publishStub.calledWithMatch('error', {
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
          callDisconnectedHandlerSpy,
          notificationHandlerSpy,
          callRejectedHandlerSpy,
          mediaEstablishedHandlerSpy,
          callHoldHandlerSpy,
          callResumeHandlerSpy,
          onDialingSpy;

        beforeEach(function () {

          options = {
            destination: '1234561528',
            breed: 'call',
            mediaType: 'video',
            localMedia: localVideo,
            remoteMedia: remoteVideo
          };

          onSpy = sinon.spy(call, 'on');

          callConnectStub = sinon.stub(call, 'connect');

          session.setId('1234');

          onDialingSpy = sinon.spy();
          callConnectingHandlerSpy = sinon.spy();
          callDisconnectedHandlerSpy = sinon.spy();
          notificationHandlerSpy = sinon.spy();
          callRejectedHandlerSpy = sinon.spy();
          mediaEstablishedHandlerSpy = sinon.spy();
          callHoldHandlerSpy = sinon.spy();
          callResumeHandlerSpy = sinon.spy();

          phone.on('dialing', onDialingSpy);
          phone.on('call-connecting', callConnectingHandlerSpy);
          phone.on('call-disconnected', callDisconnectedHandlerSpy);
          phone.on('notification', notificationHandlerSpy);
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

        it('should clean the `destination` if possible', function () {
          options = {
            destination: '(425)123-4567',
            breed: 'call',
            mediaType: 'video',
            localMedia: localVideo,
            remoteMedia: remoteVideo
          };

          phone.dial(options);
          expect(options.destination).to.equal('14251234567');
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
          expect(createCallSpy.getCall(0).args[0].remoteMedia).to.be.a('object');

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

        it('should register for the `notification` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('notification')).to.equal(true);
        });

        it('should register for the `error` event on the call object', function () {
          phone.dial(options);

          expect(onSpy.calledWith('error')).to.equal(true);
        });

        it('should execute `call.connect`', function () {
          phone.dial(options);

          expect(callConnectStub.calledWith(options)).to.equal(true);
        });

        describe('Events for Dial', function () {
          var deletePendingCallStub,
            deleteCurrentCallStub;

          beforeEach(function () {
            deletePendingCallStub = sinon.stub(session, 'deletePendingCall');
            deleteCurrentCallStub = sinon.stub(session, 'deleteCurrentCall');

            phone.dial(options);
          });

          afterEach(function () {
            deletePendingCallStub.restore();
            deleteCurrentCallStub.restore();
          });

          it('should trigger `call-connecting` with relevant data when call publishes `connecting` event', function (done) {
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

          // TODO: ignore because it uses PCV1
          xit('should trigger `call-disconnected` with relevant data when call publishes `disconnected` event', function (done) {
            var unsubscribeSpy = sinon.spy(emitterCall, 'unsubscribe');

            console.log('pcv:', ATT.private.pcv);
            emitterCall.publish('disconnected', eventData);

            setTimeout(function () {
              try {
                expect(unsubscribeSpy.calledWith('media-established')).to.equal(true);
                expect(callDisconnectedHandlerSpy.calledWith(eventData)).to.equal(true);
                expect(deleteCurrentCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

          it('should trigger `notification` with relevant data when call publishes `notification` event', function (done) {
            emitterCall.publish('notification', eventData);

            setTimeout(function () {
              try {
                expect(notificationHandlerSpy.calledWith(eventData)).to.equal(true);
                expect(deletePendingCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

          it('should trigger `call-rejected` with relevant data when call publishes `rejected` event', function (done) {
            emitterCall.publish('rejected', eventData);

            setTimeout(function () {
              try {
                expect(callRejectedHandlerSpy.called).to.equal(true);
                expect(deletePendingCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

          it('should trigger `media-established` with relevant data when call publishes `media-established` event', function (done) {
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

            publishStub = sinon.stub(emitter, 'publish');

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
          });

          it('[4000] should be published with `error` event if invalid phone number in options', function () {

            phone.dial({
              destination: '129934',
              localMedia: 'foo',
              remoteMedia: 'bar',
              mediaType: 'video'
            });

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4000')
            })).to.equal(true);
          });

          it('[4001] should be published with `error` event if invalid SIP URI in options', function () {

            phone.dial({
              destination: 'john@johnnyfoo@.com',
              localMedia: 'foo',
              remoteMedia: 'bar',
              mediaType: 'video'
            });

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4001')
            })).to.equal(true);
          });

          it('[4002] should be published with `error` event if invalid mediaType in options', function () {

            phone.dial({
              destination: '14251234567',
              localMedia: 'foo',
              remoteMedia: 'bar',
              mediaType: 'foobar'
            });

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('4002')
            })).to.equal(true);
          });

          it('[4003] should be published with `error` event if there is an unknown exception during the operation', function () {
            phone.dial({
              destination: '14251234567',
              localMedia: 'foo',
              remoteMedia: 'bar',
              mediaType: 'video'
            });

            expect(ATT.errorDictionary.getSDKError('4003')).to.be.an('object');
            expect(publishStub.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('4003')
            })).to.equal(true);

          });

          it('[4004] should be published with `error` event if the user is not logged in', function () {

            session.setId(null);

            phone.dial({
              destination: '14251234567',
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
              destination: '14251234567',
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
              destination: '14251234567',
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

        var answerOptions,
          holdAndAnswerOptions,
          onSpy,
          callConnectStub,
          onAnsweringSpy,
          callConnectingHandlerSpy,
          callConnectedHandlerSpy,
          callSwitchedHandlerSpy,
          callDisconnectedHandlerSpy,
          notificationHandlerSpy,
          callCanceledHandlerSpy,
          callRejectedHandlerSpy,
          mediaEstablishedHandlerSpy,
          callHoldHandlerSpy,
          callResumeHandlerSpy;

        beforeEach(function () {

          answerOptions = {
            localMedia: localVideo,
            remoteMedia: remoteVideo
          };

          holdAndAnswerOptions = {
            localMedia: localVideo,
            remoteMedia: remoteVideo,
            action: 'hold'
          };

          onAnsweringSpy = sinon.spy();
          callConnectingHandlerSpy = sinon.spy();
          callConnectedHandlerSpy = sinon.spy();
          callSwitchedHandlerSpy = sinon.spy();
          callDisconnectedHandlerSpy = sinon.spy();
          notificationHandlerSpy = sinon.spy();
          callCanceledHandlerSpy = sinon.spy();
          callRejectedHandlerSpy = sinon.spy();
          mediaEstablishedHandlerSpy = sinon.spy();
          callHoldHandlerSpy = sinon.spy();
          callResumeHandlerSpy = sinon.spy();

          session.setId('ABC');

          call.setId('incomingCallId');

          session.pendingCall = call;

          call.setRemoteSdp('abc');

          onSpy = sinon.spy(call, 'on');

          callConnectStub = sinon.stub(call, 'connect');

          phone.on('answering', onAnsweringSpy);
          phone.on('call-connecting', callConnectingHandlerSpy);
          phone.on('call-connected', callConnectedHandlerSpy);
          phone.on('call-switched', callSwitchedHandlerSpy);
          phone.on('call-disconnected', callDisconnectedHandlerSpy);
          phone.on('notification', notificationHandlerSpy);
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
            localMedia: answerOptions.localMedia
          });

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledOnce).to.equal(true);
            expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5001');
            done();
          }, 50);
        });

        it('[5003] should publish `error` event with data if the user is not logged in', function (done) {

          session.setId(null);

          phone.answer(answerOptions);

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledOnce).to.equal(true);
            expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5003');
            done();
          }, 50);
        });

        it('[5000] should publish `error` event with error data if there is NO pending call', function (done) {

          session.pendingCall = null;

          phone.answer(answerOptions);

          setTimeout(function () {
            try {
              expect(onErrorHandlerSpy.calledOnce).to.equal(true);
              expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5000');
              done();
            } catch (e) {
              done(e);
            }
          }, 50);

        });

        it('[5002] should publish `error` with data when there\'s an uncaught exception', function (done) {

          session.pendingCall = undefined;

          phone.answer(answerOptions);

          setTimeout(function () {
            try {
              expect(onErrorHandlerSpy.calledOnce).to.equal(true);
              expect(onErrorHandlerSpy.getCall(0).args[0].error.ErrorCode).to.equal('5002');
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
        });

        it('should trigger `answering` with event data', function (done) {
          phone.answer(answerOptions);

          setTimeout(function () {
            try {
              expect(onAnsweringSpy.called).to.equal(true);
              expect(onAnsweringSpy.getCall(0).args[0]).to.be.an('object');
              expect(onAnsweringSpy.getCall(0).args[0].from).to.be.a('string');
              expect(onAnsweringSpy.getCall(0).args[0].mediaType).to.be.a('string');
              expect(onAnsweringSpy.getCall(0).args[0].codec).to.be.an('array');
              expect(onAnsweringSpy.getCall(0).args[0].timestamp).to.be.a('date');
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
        });

        it('should register for the `connecting` event on the call object', function () {
          phone.answer(answerOptions);

          expect(onSpy.calledWith('connecting')).to.equal(true);
        });

        it('should register for the `connected` event on the call object', function () {
          phone.answer(answerOptions);

          expect(onSpy.calledWith('connected')).to.equal(true);
        });

        it('should register for the `disconnected` event on the call object', function () {
          phone.answer(answerOptions);

          expect(onSpy.calledWith('disconnected')).to.equal(true);
        });


        it('should register for the `notification` event on the call object', function () {
          phone.answer(answerOptions);

          expect(onSpy.calledWith('notification')).to.equal(true);
        });


        it('should register for the `media-established` event on the call object', function () {
          phone.answer(answerOptions);

          expect(onSpy.calledWith('media-established')).to.equal(true);
        });

        it('should register for the `held` event on the call object', function () {
          phone.answer(answerOptions);

          expect(onSpy.calledWith('held')).to.equal(true);
        });

        it('should register for the `resumed` event on the call object', function () {
          phone.answer(answerOptions);

          expect(onSpy.calledWith('resumed')).to.equal(true);
        });

        it('should register for the `error` event on the call object', function () {
          phone.answer(answerOptions);

          expect(onSpy.calledWith('error')).to.equal(true);
        });

        it('should call `call.connect` with optional params localMedia & remoteMedia', function () {
          phone.answer(answerOptions);

          expect(callConnectStub.calledWith(answerOptions)).to.equal(true);
        });

        describe('Answer Events', function () {

          var deleteCurrentCallStub;

          beforeEach(function () {
            deleteCurrentCallStub = sinon.stub(session, 'deleteCurrentCall');

            phone.answer(answerOptions);
          });

          afterEach(function () {
            deleteCurrentCallStub.restore();
          });

          it('should trigger `call-connecting` with relevant data when call publishes `connecting` event', function (done) {
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

          it('should trigger `call-connected` when call publishes `connected` event', function (done) {
            emitterCall.publish('connected', eventData);

            setTimeout(function () {
              try {
                expect(callConnectedHandlerSpy.called).to.equal(true);
                expect(callConnectedHandlerSpy.calledOnce).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

          });

          it('should not trigger `call-switched` when call publishes `connected` event and if there is only one call under session', function (done) {

            emitterCall.publish('connected', eventData);

            setTimeout(function () {
              try {
                expect(callSwitchedHandlerSpy.called).to.equal(false);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

          });


          // TODO: ignore because it uses PCV1
          xit('should trigger `call-disconnected` with relevant data when call publishes `disconnected` event', function (done) {
            emitterCall.publish('disconnected', eventData);

            setTimeout(function () {
              try {
                expect(callDisconnectedHandlerSpy.calledWith(eventData)).to.equal(true);
                expect(deleteCurrentCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

          it('should trigger `notification` with relevant data when call publishes `notification` event', function (done) {
            emitterCall.publish('notification', eventData);

            setTimeout(function () {
              try {
                expect(notificationHandlerSpy.calledWith(eventData)).to.equal(true);
                expect(deleteCurrentCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

          it('should trigger `media-established` with relevant data when call publishes `media-established` event', function (done) {
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
            emitterCall.publish('error', eventData);

            setTimeout(function () {
              try {
                expect(onErrorHandlerSpy.calledOnce).to.equal(true);
                expect(onErrorHandlerSpy.getCall(0).args[0].data).not.to.be.an('undefined');
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

          emitterConference = factories.createEventEmitter();

          createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
            return emitterConference;
          });

          callConstructorStub.restore();

          conference = new Call({
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

          phone.on('conference:joining', conferenceJoiningSpy);

          session.setId('sessionId');

          session.pendingCall = conference;

          getUserMediaStub = sinon.stub(ums, 'getUserMedia');
        });

        afterEach(function () {
          onSpy.restore();
          getUserMediaStub.restore();
        });

        it('should exists', function () {
          expect(phone.joinConference).to.be.a('function');
        });

        it('should publish `conference:joining` immediately with relevant data', function (done) {

          phone.joinConference(options);

          setTimeout(function () {
            try {
              expect(conferenceJoiningSpy.called).to.equal(true);
              expect(conferenceJoiningSpy.getCall(0).args[0]).to.be.an('object');
              expect(conferenceJoiningSpy.getCall(0).args[0].from).to.be.a('string');
              expect(conferenceJoiningSpy.getCall(0).args[0].mediaType).to.be.a('string');
              expect(conferenceJoiningSpy.getCall(0).args[0].codec).to.be.an('array');
              expect(conferenceJoiningSpy.getCall(0).args[0].timestamp).to.be.a('date');
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
        });

        it('should register for `connecting` event from conference', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('connecting')).to.equal(true);
        });

        it('should register for `error` event from conference', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('error')).to.equal(true);
        });

        it('should register for `connected` event from conference', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('connected')).to.equal(true);
        });

        it('should register for `held` event from conference', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('held')).to.equal(true);
        });

        it('should register for `resumed` event from conference', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('resumed')).to.equal(true);
        });

        it('should register for `disconnected` event from conference', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('disconnected')).to.equal(true);
        });

        it('should register for `notification` event from conference', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('notification')).to.equal(true);
        });

        it('should register for `stream-added` event from conference', function () {
          phone.joinConference(options);

          expect(onSpy.calledWith('stream-added')).to.equal(true);
        });

        it('should execute userMedia.getUserMedia with correct input params', function () {
          phone.joinConference(options);

          expect(getUserMediaStub.called).to.equal(true);
          expect(getUserMediaStub.getCall(0).args[0]).to.be.an('object');
          expect(getUserMediaStub.getCall(0).args[0].localMedia).to.be.an('object');
          expect(getUserMediaStub.getCall(0).args[0].remoteMedia).to.be.an('object');
          expect(getUserMediaStub.getCall(0).args[0].mediaType).to.be.an('string');
          expect(getUserMediaStub.getCall(0).args[0].onUserMedia).to.be.a('function');
          expect(getUserMediaStub.getCall(0).args[0].onMediaEstablished).to.be.a('function');
          expect(getUserMediaStub.getCall(0).args[0].onUserMediaError).to.be.a('function');
        });

        describe('getUserMedia: onUserMedia', function () {

          var addStreamStub,
            connectStub,
            onUserMediaSpy,
            media;

          beforeEach(function () {
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

            getUserMediaStub.restore();
            getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
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

        describe('[13005] getUserMedia: onUserMediaError', function () {
          var onErrorSpy;

          beforeEach(function () {
            onErrorSpy = sinon.spy();

            getUserMediaStub.restore();
            getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
              options.onUserMediaError();
            });

            phone.on('error', onErrorSpy);
          });

          afterEach(function () {
            getUserMediaStub.restore();
          });

          it('should publish error', function (done) {
            phone.joinConference({
              localMedia : {},
              remoteMedia : {}
            });
            setTimeout(function () {
              try {
                expect(onErrorSpy.called).to.equal(true);
                expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('13005');
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });
        });

        describe('getUserMedia: onMediaEstablished', function () {

          var mediaEstablishedSpy;

          beforeEach(function () {
            mediaEstablishedSpy = sinon.spy();

            getUserMediaStub.restore();
            getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
              options.onMediaEstablished();
            });

            phone.on('media-established', mediaEstablishedSpy);
          });

          it('should publish `media-established` when onMediaEstablished  is invoked', function (done) {

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

        describe('joinConference events', function () {

          var confConnectingHandlerSpy,
            confConnectedHandlerSpy,
            confHeldHandlerSpy,
            confResumedHandlerSpy,
            confDisconnectedHandlerSpy,
            notificationHandlerSpy,
            confErrorHandlerSpy,
            deleteCurrentCallStub;

          beforeEach(function () {
            confConnectingHandlerSpy = sinon.spy();
            confConnectedHandlerSpy = sinon.spy();
            confHeldHandlerSpy = sinon.spy();
            confResumedHandlerSpy = sinon.spy();
            confDisconnectedHandlerSpy = sinon.spy();
            notificationHandlerSpy = sinon.spy();
            confErrorHandlerSpy = sinon.spy();

            phone.on('conference:connecting', confConnectingHandlerSpy);
            phone.on('conference:connected', confConnectedHandlerSpy);
            phone.on('conference:held', confConnectedHandlerSpy);
            phone.on('conference:resumed', confResumedHandlerSpy);
            phone.on('conference:ended', confDisconnectedHandlerSpy);
            phone.on('notification', notificationHandlerSpy);
            phone.on('error', confErrorHandlerSpy);

            deleteCurrentCallStub = sinon.stub(session, 'deleteCurrentCall');

            phone.joinConference(options);
          });

          afterEach(function () {
            deleteCurrentCallStub.restore();
          });

          describe('connecting', function () {

            it('should publish `conference:connecting` with event data on getting a connecting event from call', function (done) {
              emitterConference.publish('connecting', eventData);

              setTimeout(function () {
                try {
                  expect(confConnectingHandlerSpy.calledWith(eventData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });
          });

          describe('connected', function () {

            it('should publish `conference:connected` when call publishes `connected` event', function (done) {
              emitterConference.publish('connected', eventData);

              setTimeout(function () {
                try {
                  expect(confConnectedHandlerSpy.calledWith(eventData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });
          });

          describe('held', function () {

            it('should publish `conference:held` when call publishes `held` event', function (done) {
              emitterConference.publish('held', eventData);

              setTimeout(function () {
                try {
                  expect(confConnectedHandlerSpy.calledWith(eventData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });
          });

          describe('resumed', function () {

            it('should publish `conference:resumed` when call publishes `resumed` event', function (done) {
              emitterConference.publish('resumed', eventData);

              setTimeout(function () {
                try {
                  expect(confResumedHandlerSpy.calledWith(eventData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });
          });

          describe('disconnected', function () {

            it('should publish `conference:ended` with event data on getting a `disconnected` event from conference', function (done) {
              emitterConference.publish('disconnected', eventData);

              setTimeout(function () {
                try {
                  expect(confDisconnectedHandlerSpy.calledWith(eventData)).to.equal(true);
                  expect(deleteCurrentCallStub.called).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });

          });

          describe('notification', function () {

            it('should publish `notification` with event data on getting a `notification` event from conference', function (done) {
              emitterConference.publish('notification', eventData);

              setTimeout(function () {
                try {
                  expect(notificationHandlerSpy.calledWith(eventData)).to.equal(true);
                  expect(deleteCurrentCallStub.called).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 50);
            });

          });

          describe('stream-added', function () {

            it('should execute `ums.showStream` with the stream', function (done) {
              var stream = {},
                showStreamStub = sinon.stub(ums, 'showStream');

              emitterConference.publish('stream-added', {
                stream: stream
              });

              setTimeout(function () {
                try {
                  expect(showStreamStub.calledWith({
                    localOrRemote: 'remote',
                    stream: stream
                  })).to.equal(true);
                  showStreamStub.restore();
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
                  expect(confErrorHandlerSpy.calledWith(eventData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 100);
            });
          });
        });

        describe('Error Handling', function () {

          it('[20000] should be published with `error` event if there is an uncaught exception', function (done) {
            getUserMediaStub.restore();

            getUserMediaStub = sinon.stub(ums, 'getUserMedia', function () {
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
              } finally {
                getUserMediaStub.restore();
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
            session.pendingCall = null;

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

        var publishStub;

        beforeEach(function () {
          publishStub = sinon.stub(emitter, 'publish');
        });

        afterEach(function () {
          publishStub.restore();
        });

        it('should exist', function () {
          expect(phone.addParticipant).to.be.a('function');
        });

        it('should call `phone.addParticipants` with correct data', function () {
          var addParticipantsSpy;

          addParticipantsSpy = sinon.spy(phone, 'addParticipants');

          phone.addParticipant('4250000001');

          expect(addParticipantsSpy.called).to.equal(true);
          expect(addParticipantsSpy.calledWith(['4250000001'])).to.equal(true);

          addParticipantsSpy.restore();
        });

        describe('Error Handling', function () {
          it('[19000] should be thrown if parameter `participant` is not passed in', function () {
            phone.addParticipant();

            expect(ATT.errorDictionary.getSDKError('19000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('19000')
            })).to.equal(true);
          });

          it('[19001] should be thrown if internal error occurred', function () {
            var addParticipantsStub = sinon.stub(phone, 'addParticipants', function () {
              throw error;
            });

            phone.addParticipant('4250000001');

            expect(ATT.errorDictionary.getSDKError('19001')).to.be.an('object');
            expect(publishStub.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('19001')
            })).to.equal(true);

            addParticipantsStub.restore();
          });
        });

      });

      describe('[US288156] addParticipants', function () {

        var onSpy,
          addParticipantStub,
          publishStub;

        beforeEach(function () {
          callConstructorStub.restore();
          createEventEmitterStub.restore();

          emitterConference = factories.createEventEmitter();

          createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
            return emitterConference;
          });

          conference = new Call({
            breed: 'conference',
            peer: '14251234567',
            type: 'abc',
            mediaType: 'video',
            id: '1234'
          });

          session.setId('1234');
          session.currentCall = conference;

          onSpy = sinon.spy(conference, 'on');
          addParticipantStub = sinon.stub(conference, 'addParticipant');

          callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
            return conference;
          });
        });

        afterEach(function () {
          createEventEmitterStub.restore();
          onSpy.restore();
          addParticipantStub.restore();
          callConstructorStub.restore();
        });

        it('should exist', function () {
          expect(phone.addParticipants).to.be.a('function');
        });

        it('should publish `conference:invitation-sending` immediately', function (done) {
          var onInvitationSendingHandlerSpy = sinon.spy();

          phone.on('conference:invitation-sending', onInvitationSendingHandlerSpy);

          phone.addParticipants(['johnny@foo.com']);

          setTimeout(function () {
            try {
              expect(onInvitationSendingHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
        });

        it('should clean the `participant` if possible', function () {
          var participants = ['(425)456-4122'];

          phone.addParticipants(participants);
          expect(addParticipantStub.calledWith('14254564122')).to.equal(true);
        });

        it('should execute call.addParticipant', function () {
          phone.addParticipants(['johnny@foo.com']);
          expect(addParticipantStub.called).to.equal(true);
        });

        it('should call `conference.addParticipant` with relevant parameters', function () {
          var participants = [
            '4250000001',
            '4250000002',
            '4250000003'
          ];

          phone.addParticipants(participants);

          expect(addParticipantStub.callCount).to.equal(participants.length);
        });

        describe('addParticipants Events', function () {
          var publishStub;

          beforeEach(function () {
            eventData = {
              abc: 'abc'
            };

            publishStub = sinon.stub(emitter, 'publish');
          });

          afterEach(function () {
            publishStub.restore();
          });
        });

        describe('Error Handling', function () {

          var publishStub;

          beforeEach(function () {
            conference = new Call({
              breed: 'conference',
              peer: '1234567',
              type: 'abc',
              mediaType: 'video',
              id: '1234'
            });
            publishStub = sinon.stub(emitter, 'publish');
          });

          afterEach(function () {
            publishStub.restore();
          });

          it('[24000] should throw an error if parameter `participants` is not passed in', function () {
            phone.addParticipants();

            expect(ATT.errorDictionary.getSDKError('24000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('24000')
            })).to.equal(true);
          });

          it('[24001] should throw an error if parameter `participants` is incorrect', function () {
            phone.addParticipants([]);

            expect(ATT.errorDictionary.getSDKError('24001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('24001')
            })).to.equal(true);

            phone.addParticipants(null);

            expect(ATT.errorDictionary.getSDKError('24001')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('24001')
            })).to.equal(true);
          });

          it('[24002] should be thrown if the user is not logged in', function () {
            session.setId(null);
            phone.addParticipants(['4250000001']);

            expect(ATT.errorDictionary.getSDKError('24002')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('24002')
            })).to.equal(true);

          });

          it('[24003] should be thrown if conference has not been started', function () {
            session.currentCall = conference;

            conference.breed = function () {
              return 'call';
            };

            phone.addParticipants(['4250000001']);

            expect(ATT.errorDictionary.getSDKError('24003')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('24003')
            })).to.equal(true);
          });

          it('[24004] should be thrown if internal error occurred', function () {
            addParticipantStub.restore();
            addParticipantStub = sinon.stub(conference, 'addParticipant', function () {
              throw error;
            });

            session.currentCall = conference;

            phone.addParticipants(['4250000001']);

            expect(ATT.errorDictionary.getSDKError('24004')).to.be.an('object');
            expect(publishStub.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('24004')
            })).to.equal(true);

            addParticipantStub.restore();
          });

          it('[24005] should be thrown if the invitee is already a participant', function () {

            session.currentCall = conference;

            conference.participants = function () {
              return {
                4521234567: {
                  participant: 'johnny',
                  status: 'active'
                },
                14521234567: {
                  participant: 'sally',
                  status: 'active'
                }
              }
            };

            phone.addParticipants(['4521234567']);

            expect(ATT.errorDictionary.getSDKError('24005')).to.be.an('object');
            expect(publishStub.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('24005')
            })).to.equal(true);
          });

          it('[24006] should be published with `error` event if invalid phone number', function () {

            phone.addParticipants(['129934']);

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('24006')
            })).to.equal(true);
          });

          it('[24007] should be published with `error` event if invalid SIP URI in options', function () {

            phone.addParticipants(['foo@bar@123.com']);

            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('24007')
            })).to.equal(true);
          });
        });
      });

      describe('[US233244] getParticipants', function () {

        var publishStub;

        beforeEach(function () {

          callConstructorStub.restore();

          conference = new Call({
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

        it('should return `participants` list', function () {
          var getParticipantsConfStub,
            participantsMock,
            participants;

          participantsMock = {
            johnny: {
              participant: 'johnny',
              status: 'active'
            },
            sally: {
              participant: 'sally',
              status: 'active'
            }
          };
          getParticipantsConfStub = sinon.stub(conference, 'participants', function () {
            return participantsMock;
          });

          participants = phone.getParticipants();

          expect(participants).to.equal(conference.participants());

          getParticipantsConfStub.restore();
        });

        describe('Error Handling', function () {
          it('[21002] should be thrown if User not Logged In', function () {
            var sessiongetIdStub = sinon.stub(session, 'getId', function () {
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
            expect(publishStub.calledWithMatch('error', {
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


          it('should not call `call.mute` and publish warning if state is already muted', function (done) {
            var onWarning = sinon.spy(), state;
            state = call.getState();
            call.setState('muted');
            phone.on('warning', onWarning);

            phone.mute();

            expect(callMuteStub.called).not.to.equal(true);
            setTimeout(function () {
              expect(onWarning.calledWith({message : 'Already muted'})).to.equal(true);
              call.setState(state);
              done();
            }, 50);

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
              expect(publishStub.calledWithMatch('error', {
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

          it('should not call `call.unmute` and publish warning if state is already unmuted', function (done) {
            var onWarning = sinon.spy(),
            state;
            state = call.getState();
            call.setState('unmuted');
            phone.on('warning', onWarning);

            phone.unmute();

            expect(callMuteStub.called).not.to.equal(true);
            setTimeout(function () {
              expect(onWarning.calledWith({message : 'Already unmuted'})).to.equal(true);
              call.setState(state);
              done();
            }, 50);

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
              expect(publishStub.calledWithMatch('error', {
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
            expect(publishStub.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('6001')
            })).to.equal(true);
          });
        });
      });

      describe('[US248581] cancel', function () {

        var onSpy,
          callCanceledHandlerSpy,
          deletePendingCallStub,
          callDisconnectStub,
          publishSpy;

        beforeEach(function () {
          onSpy = sinon.spy(call, 'on');
          callDisconnectStub = sinon.stub(call, 'disconnect');

          call.setId('1234');

          session.pendingCall = call;

          callCanceledHandlerSpy = sinon.spy();
          deletePendingCallStub = sinon.stub(session, 'deletePendingCall');

          publishSpy = sinon.spy(emitter, 'publish');

          phone.on('call-canceled', callCanceledHandlerSpy);
        });

        afterEach(function () {
          onSpy.restore();
          deletePendingCallStub.restore();
          callDisconnectStub.restore();
          publishSpy.restore();
        });

        it('should exist', function () {
          expect(phone.cancel).to.be.a('function');
        });

        it('should register for the `canceled` event on the call object', function () {
          phone.cancel();

          expect(onSpy.calledWith('canceled')).to.equal(true);
        });

        it('should execute call.disconnect', function () {
          call.setId('123');

          phone.cancel();

          expect(callDisconnectStub.called).to.equal(true);
        });

        describe('Error Handling', function () {

          beforeEach(function () {
            callDisconnectStub.restore();
            callDisconnectStub = sinon.stub(call, 'disconnect', function () {
              throw error;
            });

          });

          it('[11000] should be published with `error` event if call has not been initiated', function () {
            session.pendingCall = null;

            phone.cancel();

            expect(ATT.errorDictionary.getSDKError('11000')).to.be.an('object');
            expect(publishSpy.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('11000')
            })).to.equal(true);
          });

          it('[11001] should be published with `error` event if there is an unknown exception during the operation', function () {
            phone.cancel();

            expect(ATT.errorDictionary.getSDKError('11001')).to.be.an('object');
            expect(publishSpy.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('11001')
            })).to.equal(true);
          });
        });

        describe('Canceled Events', function () {

          beforeEach(function () {
            phone.cancel();
          });

          it('should publish `call-canceled` when call publishes `canceled`', function (done) {
            emitterCall.publish('canceled', eventData);

            setTimeout(function () {
              try {
                expect(callCanceledHandlerSpy.calledWith(eventData)).to.equal(true);
                expect(deletePendingCallStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 100);
          });
        });
      });

      describe('[US248577] reject', function () {

        var onSpy,
          callRejectStub,
          callRejectedSpy,
          deletePendingCallStub;

        beforeEach(function () {

          onSpy = sinon.spy(call, 'on');

          callRejectStub = sinon.stub(call, 'reject', function () {
          });

          callRejectedSpy = sinon.spy();

          phone.on('call-rejected', callRejectedSpy);

          call.setId('123');

          session.pendingCall = call;

          deletePendingCallStub = sinon.stub(session, 'deletePendingCall');
        });

        afterEach(function () {
          callRejectStub.restore();
          deletePendingCallStub.restore();
        });

        it('should exist', function () {
          expect(phone.reject).to.be.a('function');
        });

        it('should execute call.reject', function () {
          phone.reject();

          expect(callRejectStub.called).to.equal(true);
        });

        it('should register for the `rejected` event on the call object', function () {
          phone.reject();

          expect(onSpy.calledOnce).to.equal(true);
          expect(onSpy.calledWith('rejected')).to.equal(true);
        });

        it('should trigger `call-rejected` with data when call publishes `rejected` event', function (done) {
          var data = {
            data: 'test'
          };

          phone.reject();

          emitterCall.publish('rejected', data);

          setTimeout(function () {
            try {
              expect(callRejectedSpy.calledWith(data)).to.equal(true);
              expect(deletePendingCallStub.called).to.equal(true);
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
            session.pendingCall = null;

            phone.reject();

            expect(ATT.errorDictionary.getSDKError('12000')).to.be.an('object');
            expect(publishStub.calledWith('error', {
              error: ATT.errorDictionary.getSDKError('12000')
            })).to.equal(true);
          });

          it('[12001] should be published with `error` event if there is an unknown exception during the operation', function () {
            call.setId('1234');

            session.pendingCall = call;

            phone.reject();

            expect(ATT.errorDictionary.getSDKError('12001')).to.be.an('object');
            expect(publishStub.calledWithMatch('error', {
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

          emitterConference = factories.createEventEmitter();

          createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
            return emitterConference;
          });

          callConstructorStub.restore();

          conference = new Call({
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

          session.pendingCall = conference;

          onConfDisconnectedHandlerSpy = sinon.spy();
          phone.on('conference:ended', onConfDisconnectedHandlerSpy);
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
            session.pendingCall = null;

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

          callHoldStub = sinon.stub(call, 'hold');

          callResumeStub = sinon.stub(call, 'resume');

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

          it('should NOT execute call.hold if [state===held]', function () {
            call.setState('held');

            phone.hold();

            expect(callHoldStub.called).to.equal(false);
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
              expect(publishStub.calledWithMatch('error', {
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
              expect(publishStub.calledWithMatch('error', {
                error: ATT.errorDictionary.getSDKError('8001')
              })).to.equal(true);
            });

            it('[8002] should be published with `error` event if there is an unknown exception during the operation', function () {

              call.setState('held');

              phone.resume();

              expect(ATT.errorDictionary.getSDKError('8002')).to.be.an('object');
              expect(publishStub.calledWithMatch('error', {
                error: ATT.errorDictionary.getSDKError('8002')
              })).to.equal(true);
            });
          });

        });

      });

      describe('[US221390] move', function () {

        var publishStub,
          callMoveStub;

        beforeEach(function () {

          session.currentCall = call;
          session.setId('123');
          call.setId('1234');

          publishStub = sinon.stub(emitter, 'publish', function () {});
          callMoveStub = sinon.stub(call, 'hold', function () {
            throw error;
          });
        });

        afterEach(function () {
          publishStub.restore();
          callMoveStub.restore();
        });

        it('should exist', function () {
          expect(phone.move).to.be.a('function');
        });

        it('should execute call.hold(true)', function () {
          phone.move();

          expect(callMoveStub.calledWith(true)).to.equal(true);
        });

        describe('Error handling', function () {
          it('[28000] should be thrown if user is not logged in', function () {
            session.setId(null);

            phone.move();

            expect(ATT.errorDictionary.getSDKError('28000')).to.be.an('object');
            expect(publishStub.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('28000')
            })).to.equal(true);
          });

          it('[28001] should be thrown if the call is not in progress', function () {

            session.setId('123');
            session.currentCall = null;

            phone.move();

            expect(ATT.errorDictionary.getSDKError('28001')).to.be.an('object');
            expect(publishStub.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('28001')
            })).to.equal(true);

          });

          it('[28002] should be thrown if an internal error occurs', function () {

            phone.move();

            expect(ATT.errorDictionary.getSDKError('28002')).to.be.an('object');
            expect(publishStub.calledWithMatch('error', {
              error: ATT.errorDictionary.getSDKError('28002')
            })).to.equal(true);

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

      describe('isCallInProgress', function () {
        var currentCall;

        beforeEach(function () {
          currentCall = session.currentCall;
        });

        afterEach(function () {
          session.currentCall = currentCall;
        });

        it('should exist', function () {
          expect(phone.isCallInProgress).to.be.a('function');
        });

        it('should return `true` if session.currentCall !== null', function () {
          session.currentCall = {
            call: 'i am a call'
          };

          expect(phone.isCallInProgress()).to.equal(true);
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
            expect(publishStub.calledWithMatch('error', {
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

      describe('formatNumber', function () {
        it('should exists', function () {
          expect(phone.formatNumber).to.be.an('function');
        });

        it('[26001] should be published with `error` event if there is an unknown exception during the operation', function () {
          var publishStub = sinon.stub(emitter, 'publish'),
            cleannumberStub = sinon.stub(ATT.phoneNumber, 'cleanPhoneNumber', function () {
              throw new Error;
            });
          phone.formatNumber('12sdD3');

          expect(ATT.errorDictionary.getSDKError('26001')).to.be.an('object');
          expect(publishStub.calledWithMatch('error', {
            error: ATT.errorDictionary.getSDKError('26001')
          })).to.equal(true);

          publishStub.restore();
          cleannumberStub.restore();
        });
      });

      describe('cleanPhoneNumber', function () {
        it('should exists', function () {
          expect(phone.cleanPhoneNumber).to.be.an('function');
        });

        it('[26001] should be published with `error` event if there is an unknown exception during the operation', function () {
          var publishStub = sinon.stub(emitter, 'publish'),
            getCallableStub = sinon.stub(ATT.phoneNumber, 'getCallable', function () {
              throw new Error;
            });
          phone.cleanPhoneNumber('12sdD3');

          expect(ATT.errorDictionary.getSDKError('26001')).to.be.an('object');
          expect(publishStub.calledWithMatch('error', {
            error: ATT.errorDictionary.getSDKError('26001')
          })).to.equal(true);

          publishStub.restore();
          getCallableStub.restore();
        });
      });

    });

    describe('Events', function () {

      describe('Session', function () {

        var incomingCall,
          session,
          phone,
          callOnSpy,
          emitterCall,
          emitterSession,
          createEventEmitterStub,
          sessionConstructorStub,
          deletePendingCallStub,
          onCallIncomingHandlerSpy,
          onCallDisconnectedHandlerSpy,
          onCallCanceledHandlerSpy,
          onConferenceDisconnectedHandlerSpy,
          onConferenceInviteHandlerSpy,
          notificationHandlerSpy,
          onErrorHandlerSpy;

        beforeEach(function () {

          emitterCall = factories.createEventEmitter();

          createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
            return emitterCall;
          });

          incomingCall = new Call({
            breed: 'call',
            peer: '12345',
            type: ATT.CallTypes.INCOMING,
            mediaType: 'video',
            remoteSdp: 'remoteSdp'
          });

          createEventEmitterStub.restore();

          callOnSpy = sinon.spy(incomingCall, 'on');

          emitterSession = factories.createEventEmitter();

          createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
            return emitterSession;
          });

          session = new ATT.rtc.Session();

          createEventEmitterStub.restore();

          sessionConstructorStub = sinon.stub(ATT.rtc, 'Session', function () {
            return session;
          });

          deletePendingCallStub = sinon.stub(session, 'deletePendingCall');

          session.pendingCall = incomingCall;

          onCallIncomingHandlerSpy = sinon.spy();
          onCallDisconnectedHandlerSpy = sinon.spy();
          onCallCanceledHandlerSpy = sinon.spy();
          onConferenceDisconnectedHandlerSpy = sinon.spy();
          onConferenceInviteHandlerSpy = sinon.spy();
          notificationHandlerSpy = sinon.spy();
          onErrorHandlerSpy = sinon.spy();

          phone = new Phone();

          phone.on('call-incoming', onCallIncomingHandlerSpy);
          phone.on('conference:invitation-received', onConferenceInviteHandlerSpy);
          phone.on('call-canceled', onCallCanceledHandlerSpy);
          phone.on('call-disconnected', onCallDisconnectedHandlerSpy);
          phone.on('conference:ended', onConferenceDisconnectedHandlerSpy);
          phone.on('notification', notificationHandlerSpy);
          phone.on('error', onErrorHandlerSpy);
        });

        afterEach(function () {
          callOnSpy.restore();
          sessionConstructorStub.restore();
          deletePendingCallStub.restore();
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

          it('should register for `canceled` event on the incoming pending call', function (done) {

            emitterSession.publish('call-incoming', eventData);

            setTimeout(function () {
              try {
                expect(callOnSpy.calledWith('canceled')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          it('should register for `disconnected` event on the incoming pending call', function (done) {

            emitterSession.publish('call-incoming', eventData);

            setTimeout(function () {
              try {
                expect(callOnSpy.calledWith('disconnected')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          describe('Events on incoming call', function () {

            beforeEach(function () {
              emitterSession.publish('call-incoming', eventData);
            });

            describe('canceled', function () {
              it('should publish `call-canceled` when call publishes `canceled` with relevant data', function (done) {

                setTimeout(function () {
                  emitterCall.publish('canceled', eventData);

                  setTimeout(function () {
                    try {
                      expect(onCallCanceledHandlerSpy.calledWith(eventData)).to.equal(true);
                      expect(deletePendingCallStub.called).to.equal(true);
                      done();
                    } catch (e) {
                      done(e);
                    }
                  }, 10);
                }, 10);
              });
            });

            describe('disconnected', function () {
              it('should publish `call-disconnected` when call publishes `disconnected` with relevant data', function (done) {
                setTimeout(function () {
                  emitterCall.publish('disconnected', eventData);

                  setTimeout(function () {
                    try {
                      expect(onCallDisconnectedHandlerSpy.calledWith(eventData)).to.equal(true);
//                      expect(deletePendingCallStub.called).to.equal(true);
                      done();
                    } catch (e) {
                      done(e);
                    }
                  }, 10);
                }, 10);
              });
            });

          });
        });

        describe('conference:invitation-received', function () {

          it('should trigger `conference:invitation-received` with relevant data on getting a `conference-invite` from session', function (done) {

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

        describe('notification', function () {

          it('should publish `notification` event with the relevant data on getting an `notificaiton` from session', function (done) {

            emitterSession.publish('notification', eventData);

            setTimeout(function () {
              try {
                expect(notificationHandlerSpy.calledWith(eventData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

        });

        describe('error', function () {

          it('should publish `error` event with the error data on getting an `error` from session', function (done) {
            var errorData = {
              error: 'error'
            };

            emitterSession.publish('error', errorData);

            setTimeout(function () {
              try {
                expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);
          });

        });

      });

    });
  });
});