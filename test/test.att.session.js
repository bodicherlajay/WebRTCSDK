/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, Env, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit*/

describe('Session', function () {
  'use strict';

  var factories,
    apiConfig,
    options,
    optionsforRTCM,
    resourceManager,
    doOperationStub,
    createResourceManagerStub,
    createPeerConnectionStub,
    restClientStub;

  beforeEach(function () {
    restClientStub = sinon.stub(RESTClient.prototype, 'ajax');
    factories = ATT.private.factories;
    apiConfig = ATT.private.config.api;

    resourceManager = factories.createResourceManager(apiConfig);

    doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) {
      options.success({
        getResponseHeader: function () {
          return;
        }
      });
    });

    createResourceManagerStub = sinon.stub(factories, 'createResourceManager', function () {
      return resourceManager;
    });

    options = {
      token: 'dsfgdsdf',
      e911Id: 'sdfghfds'
    };

    optionsforRTCM = {
      resourceManager: resourceManager,
      userMediaSvc: ATT.UserMediaService,
      peerConnSvc: ATT.PeerConnectionService
    };

    createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection', function () {
      return {};
    });

  });

  afterEach(function () {
    createResourceManagerStub.restore();
    doOperationStub.restore();
    restClientStub.restore();
    createPeerConnectionStub.restore();
  });

  it('Should have a public constructor under ATT.rtc', function () {
    expect(ATT.rtc.Session).to.be.a('function');
  });

  describe('Constructor', function () {
    var session,
      rtcManager,
      createEventEmitterSpy,
      rtcManagerOnSpy,
      getRTCManagerStub;

    beforeEach(function () {
      createEventEmitterSpy = sinon.spy(ATT.private.factories, 'createEventEmitter');
      rtcManager = {
        on: function () {}
      };
      rtcManagerOnSpy = sinon.spy(rtcManager, 'on');
      getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
        return rtcManager;
      });
      session = new ATT.rtc.Session();
    });

    afterEach(function () {
      createEventEmitterSpy.restore();
      getRTCManagerStub.restore();
      rtcManagerOnSpy.restore();
      session = null;
    });

    it('Should create a session object', function () {
      expect(session instanceof ATT.rtc.Session).to.equal(true);
    });

    it('should create an instance of event emitter', function () {
      expect(createEventEmitterSpy.called).to.equal(true);
    });

    it('should call ATT.private.rtcManager.getRTCManager', function () {
      expect(getRTCManagerStub.called).to.equal(true);
    });

    it('should register for `invitation-received` event on RTCManager', function () {
      expect(rtcManagerOnSpy.calledWith('invitation-received')).to.equal(true);
    });

    it('should register for `call-disconnected` event on RTCManager', function () {
      expect(rtcManagerOnSpy.calledWith('call-disconnected')).to.equal(true);
    });
  });

  describe('Methods', function () {
    var session,
      call,
      secondCall,
      emitterEM,
      emitter,
      onConnectingSpy,
      onConnectedSpy,
      onUpdatingSpy,
      onReadyHandlerSpy,
      onDisconnectingSpy,
      onDisconnectedSpy,
      onErrorHandlerSpy,
      onSessionReadyData,
      createEventEmitterStub,
      rtcManager,
      getRTCMgrStub,
      getTokenStub,
      error,
      errorData;

    beforeEach(function () {

      error = 'Test Error';
      errorData = {
        error: error
      };

      onSessionReadyData = {
        test: 'test'
      };

      emitterEM = ATT.private.factories.createEventEmitter();

      createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitterEM;
      });

      rtcManager = new ATT.private.RTCManager(optionsforRTCM);

      getRTCMgrStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
        return rtcManager;
      });

      createEventEmitterStub.restore();

      emitter = ATT.private.factories.createEventEmitter();

      createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitter;
      });

      session = new ATT.rtc.Session(options);

      createEventEmitterStub.restore();

      getTokenStub = sinon.stub(session, 'getToken', function () {
        return 'dsfgdsdf';
      });

      call = new ATT.rtc.Call({
        breed: 'call',
        id: '12345',
        peer: '12345',
        type: 'abc',
        mediaType: 'audio'
      });

      secondCall = new ATT.rtc.Call({
        breed: 'call',
        id: '98765',
        peer: '12452',
        type: 'abc',
        mediaType: 'video'
      });

      onConnectingSpy = sinon.spy();
      onConnectedSpy = sinon.spy();
      onUpdatingSpy = sinon.spy();
      onReadyHandlerSpy = sinon.spy();
      onDisconnectingSpy = sinon.spy();
      onDisconnectedSpy = sinon.spy();
      onErrorHandlerSpy = sinon.spy();

      session.on('connecting', onConnectingSpy);
      session.on('connected', onConnectedSpy);
      session.on('updating', onUpdatingSpy);
      session.on('ready', onReadyHandlerSpy);
      session.on('disconnecting', onDisconnectingSpy);
      session.on('disconnected', onDisconnectedSpy);
      session.on('error', onErrorHandlerSpy);
    });

    afterEach(function () {
      createEventEmitterStub.restore();
      getRTCMgrStub.restore();
      getTokenStub.restore();
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
          unsubscribeSpy = sinon.spy(emitter, 'unsubscribe'),
          subscribeSpy = sinon.spy(emitter, 'subscribe');

        expect(session.on.bind(session, 'connected', fn)).to.not.throw(Error);
        expect(session.on.bind(session, 'disconnected', fn)).to.not.throw(Error);

        expect(unsubscribeSpy.called).to.equal(true);
        expect(subscribeSpy.called).to.equal(true);

        unsubscribeSpy.restore();
        subscribeSpy.restore();
      });
    });

    describe('Connect', function () {

      var connectSessionStub;

      beforeEach(function () {

        connectSessionStub = sinon.stub(rtcManager, 'connectSession', function (options) {
        });

      });

      afterEach(function () {
        connectSessionStub.restore();
      });

      it('Should exist', function () {
        expect(session.connect).to.be.a('function');
      });

      it('Should publish the `connecting` event immediately', function (done) {
        session.connect(options);

        setTimeout(function () {
          try {
            expect(onConnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      it('should call connectSession on RTC Manager', function () {
        session.connect(options);

        expect(connectSessionStub.called).to.equal(true);
      });

      describe('Callbacks on connectSession', function () {

        describe('onSessionConnected', function () {
          var setIdStub,
            updateSpy;

          beforeEach(function () {
            setIdStub = sinon.stub(session, 'setId');
            updateSpy = sinon.stub(session, 'update');

            connectSessionStub.restore();

            connectSessionStub = sinon.stub(rtcManager, 'connectSession', function (options) {
              setTimeout(function () {
                options.onSessionConnected({
                  sessionId: 'sessionid',
                  timeout: 120000
                });
              }, 0);
            });

          });

          afterEach(function () {
            setIdStub.restore();
            updateSpy.restore();
            connectSessionStub.restore();
          });

          it('Should set the id on session with newly created session id', function (done) {
            session.connect(options);

            setTimeout(function () {
              expect(setIdStub.calledWith('sessionid')).to.equal(true);
              done();
            }, 10);
          });

          it('Should execute the update on session with newly created timeout', function (done) {
            session.connect(options);

            setTimeout(function () {
              expect(updateSpy.calledWith({
                timeout: 120000
              })).to.equal(true);
              done();
            }, 10);

          });

        });

        describe('onSessionReady', function () {

          beforeEach(function () {
            connectSessionStub.restore();

            connectSessionStub = sinon.stub(rtcManager, 'connectSession', function (options) {
              setTimeout(function () {
                options.onSessionReady(onSessionReadyData);
              }, 0);
            });

            session.connect(options);
          });

          afterEach(function () {
            connectSessionStub.restore();
          });

          it('should publish the ready event with data on session', function (done) {
            setTimeout(function () {
              try {
                expect(onReadyHandlerSpy.calledWith(onSessionReadyData)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });
        });

        describe('onError', function () {

          beforeEach(function () {

            connectSessionStub.restore();

            connectSessionStub = sinon.stub(rtcManager, 'connectSession', function (options) {
              setTimeout(function () {
                options.onError(error);
              }, 0);
            });

            session.connect(options);

          });

          afterEach(function () {
            connectSessionStub.restore();
          });

          it('should publish `error` event with error data', function (done) {

            setTimeout(function () {
              expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
              done();
            }, 10);
          });

        });

      });

      describe('Error Handling', function () {

        var publishStub,
          setIdStub;

        beforeEach(function () {
          publishStub = sinon.stub(emitter, 'publish', function () {});

          setIdStub = sinon.stub(session, 'setId', function () {
            throw error;
          });
        });

        afterEach(function () {
          publishStub.restore();
          setIdStub.restore();
        });

        it('[2002] should be published with `error` event if no options specified', function () {
          session.connect();

          expect(ATT.errorDictionary.getSDKError('2002')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('2002')
          })).to.equal(true);
        });

        it('[2001] should be published with `error` event if no token specified', function () {

          session.connect({});

          expect(ATT.errorDictionary.getSDKError('2001')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('2001')
          })).to.equal(true);

        });

        it('[2004] should be published with `error` event if there is an unexpected exception during the operation', function () {
          connectSessionStub.restore();

          connectSessionStub = sinon.stub(rtcManager, 'connectSession', function (options) {
            throw error;
          });

          session.connect(options);

          expect(ATT.errorDictionary.getSDKError('2004')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('2004')
          })).to.equal(true);

        });

        it('[2004] should be published with `error` event if there is an unexpeceted exception inside onSessionConnected callback', function (done) {
          connectSessionStub.restore();

          connectSessionStub = sinon.stub(rtcManager, 'connectSession', function (options) {
            setTimeout(function () {
              options.onSessionConnected({
                sessionId: 'sessionid',
                timeout: 120000
              });
            }, 0);
          });

          session.connect(options);

          setTimeout(function () {
            try {
              expect(ATT.errorDictionary.getSDKError('2004')).to.be.an('object');
              expect(publishStub.calledWith('error', {
                error: ATT.errorDictionary.getSDKError('2004')
              })).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);

        });

      });

    });

    describe('Disconnect', function () {
      var disconnectSessionStub,
        setIdStub;

      beforeEach(function () {
        disconnectSessionStub = sinon.stub(rtcManager, 'disconnectSession', function (options) {
        });

        session.setId('123');

        setIdStub = sinon.stub(session, 'setId');
      });

      afterEach(function () {
        disconnectSessionStub.restore();
        setIdStub.restore();
      });

      it('Should exist', function () {
        expect(session.disconnect).to.be.a('function');
      });

      it('Should trigger the disconnecting event immediately', function (done) {
        session.disconnect();

        setTimeout(function () {
          try {
            expect(onDisconnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      it('Should execute RTCManager.disconnectSession', function () {
        session.disconnect();

        expect(disconnectSessionStub.called).to.equal(true);
      });

      describe('Callbacks on session.disconnectSession', function () {

        describe('onSessionDisconnected', function () {

          beforeEach(function () {
            disconnectSessionStub.restore();

            disconnectSessionStub = sinon.stub(rtcManager, 'disconnectSession', function (options) {
              setTimeout(function () {
                options.onSessionDisconnected();
              }, 0);
            });
          });

          it('should execute setId(null) if successful', function (done) {
            session.disconnect();

            setTimeout(function () {
              expect(setIdStub.called).to.equal(true);
              expect(setIdStub.calledWith(null)).to.equal(true);
              done();
            }, 10);
          });

          it('should publish `error` with error data if there is an error in any operation', function (done) {
            setIdStub.restore();

            setIdStub = sinon.stub(session, 'setId', function () {
              throw error;
            });

            session.disconnect();

            setTimeout(function () {
              expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
              done();
            }, 10);
          });
        });

      });

      describe('Error Handling', function () {

        it('should publish `error` with error data if there is an error in any operation', function (done) {
          disconnectSessionStub.restore();

          disconnectSessionStub = sinon.stub(rtcManager, 'disconnectSession', function () {
            throw error;
          });

          session.disconnect();

          setTimeout(function () {
            expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
            done();
          }, 10);
        });

      });

    });

    describe('moveToBackground', function () {
      it('should exist', function () {
        expect(session.moveToBackground).to.be.a('function');
      });
    });

    describe('getToken', function () {
      var sessionForGetToken;

      beforeEach(function () {
        sessionForGetToken = new ATT.rtc.Session();
        sessionForGetToken.setId('123');
      });

      it('should exist', function () {
        expect(sessionForGetToken.getToken).to.be.a('function');
      });

      it('return the current token', function () {
        expect(sessionForGetToken.getToken()).to.equal(null);
        sessionForGetToken.update({
          token: 'bogus',
          timeout: 1000000 // so big that it will never hit the network for refreshSession
        });
        expect(sessionForGetToken.getToken()).to.equal('bogus');
      });
    });

    describe('setId', function () {

      it('Should publish the `connected` event', function (done) {
        var sessionId = '12345';

        session.setId(sessionId);

        setTimeout(function () {
          try {
            expect(onConnectedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      it('Should publish `disconnected` event if id is null', function (done) {

        session.setId(null);
        setTimeout(function () {
          try {
            expect(onDisconnectedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);

      });

      it('should execute rtcManager.stopUserMedia on `disconnected` event', function (done) {
        var stopUserMediaStub = sinon.stub(rtcManager, 'stopUserMedia');

        session.setId(null);
          
        setTimeout(function () {
          try {
            expect(stopUserMediaStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);

        stopUserMediaStub.restore();
      });

      it('should update the id of the session', function () {
        session.setId('1334');
        expect(session.getId()).to.equal('1334');
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
      var refreshSessionStub;

      beforeEach(function () {
        session.setId('123');
        options = { timeout : 123};
        refreshSessionStub = sinon.stub(rtcManager, 'refreshSession');
      });

      afterEach(function () {
        refreshSessionStub.restore();
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
        }, 10);
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

        it('Should set an interval to publish `needs-refresh` event 60000 ms before timeout', function (done) {
          var onNeedsRefreshSpy = sinon.spy();
          options.timeout = 60020;
          session.on('needs-refresh', onNeedsRefreshSpy);
          session.update(options);
          expect(session.timer).to.be.a('number');
          setTimeout(function () {
            try {
              expect(onNeedsRefreshSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 30);

        });

      });
    });

    describe('updateE911Id', function () {
      var updateE911stub, updateOptions, onSuccessCall = function () {
      }, onError = function () {};

      beforeEach(function () {
        updateOptions = {
          e911Id: '1234',
          sessionId: session.getId(),
          token: session.getToken(),
          onSuccess: onSuccessCall,
          onError: onError
        };

        options = { timeout : 123};
        updateE911stub = sinon.stub(rtcManager, 'updateSessionE911Id', function (options) {
          options.onSuccess();
        });
      });

      afterEach(function () {
        updateE911stub.restore();
      });
      it('Should exist', function () {
        expect(session.updateE911Id).to.be.a('function');
      });

      it('Should call rtc-manager `updateE911` with token,session and E911Id', function () {
        session.token = 'dsfgdsdf';
        session.updateE911Id({e911Id : '1234'});
        expect(updateE911stub.getCall(0).args[0].e911Id).to.equal('1234');
        expect(updateE911stub.getCall(0).args[0].sessionId).to.equal(session.getId());
        expect(updateE911stub.getCall(0).args[0].token).to.equal('dsfgdsdf');

      });

      it('Should call rtc-manager `updateE911` with token,session and E911Id', function () {
        session.token = 'dsfgdsdf';
        session.updateE911Id({e911Id : '1234'});
        expect(updateE911stub.getCall(0).args[0].e911Id).to.equal('1234');
        expect(updateE911stub.getCall(0).args[0].sessionId).to.equal(session.getId());
        expect(updateE911stub.getCall(0).args[0].token).to.equal('dsfgdsdf');
      });

      it('Should publish `updatedE911` on success callback ', function (done) {
        var  onNeedsRefreshSpy = sinon.spy();

        session.on('address-updated', onNeedsRefreshSpy);
        session.updateE911Id({e911Id : '1234'});

        setTimeout(function () {
          try {
            expect(onNeedsRefreshSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 30);

      });
    });

    describe('createCall', function () {

      var callOpts;

      beforeEach(function () {
        callOpts = {
          breed: 'call',
          peer: '12345',
          type: 'incoming',
          mediaType: 'video'
        };
      });

      it('should exist', function () {
        expect(session.createCall).to.be.a('function');
      });

      it('should call ATT.rtc.Call', function () {
        var callConstructorSpy = sinon.spy(ATT.rtc, 'Call');

        session.createCall(callOpts);

        expect(callConstructorSpy.called).to.equal(true);

        callConstructorSpy.restore();
      });

      it('should return the newly created call object', function () {
        call = session.createCall(callOpts);
        expect(call instanceof ATT.rtc.Call).to.equal(true);
        expect(call.breed()).to.equal('call');
      });

      it('should set the currentCall as the newly created call', function () {
        call = session.createCall(callOpts);

        expect(session.currentCall).to.equal(call);
      });
    });

    describe('AddCall', function () {

      it('Should exist', function () {
        expect(session.addCall).to.be.a('function');
      });

      it('Should add a call to the session', function () {

        session.addCall(call);

        expect(session.getCall(call.id())).to.equal(call);
      });

    });

    describe('GetCall', function () {

      beforeEach(function () {
        session.addCall(call);
      });

      it('Should exist', function () {
        expect(session.getCall).to.be.a('function');
      });

      it('Should return a call by id', function () {
        expect(session.getCall(call.id())).to.equal(call);
      });

      it('Should return undefined if the call doesn\'t exist', function () {
        expect(session.getCall('11111')).to.equal(undefined);
      });

    });

    xdescribe('TerminateCalls', function () {

      beforeEach(function () {
        session.addCall(call);
        session.addCall(secondCall);
      });

      it('Should exist', function () {
        expect(session.terminateCalls).to.be.a('function');
      });

      it('Should call disconnect on all calls in the session', function () {
        var disconnectSpy1 = sinon.spy(call, 'disconnect'),
          disconnectSpy2 = sinon.spy(secondCall, 'disconnect');

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
        var callId = call.id();
        session.deleteCall(callId);
        expect(session.getCall(callId)).to.equal(undefined);
      });

      it('Should fire oncallsterminated after the last call is deleted', function (done) {
        var onAllCallsTerminatedSpy = sinon.spy();

        session.on('allcallsterminated', onAllCallsTerminatedSpy);

        session.deleteCall(call.id());

        setTimeout(function () {
          try {
            expect(onAllCallsTerminatedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);

      });

    });

    describe('DeleteCurrentCall', function () {

      it('Should exist', function () {
        expect(session.deleteCurrentCall).to.be.a('function');
      });

      it('Should delete the current Call', function () {
        session.currentCall = call;

        session.deleteCurrentCall();

        expect(session.currentCall).to.equal(null);
      });
    });
  });

  describe('Events', function () {

    describe('needs-refresh', function () {

      var onNeedsRefreshSpy,
        refreshSessionStub,
        rtcManager,
        getRTCManagerStub;

      beforeEach(function () {
        rtcManager = new ATT.private.RTCManager(optionsforRTCM);
        getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
          return rtcManager;
        });
        refreshSessionStub = sinon.stub(rtcManager, 'refreshSession');
      });

      afterEach(function () {
        refreshSessionStub.restore();
        getRTCManagerStub.restore();
      });

      it('Should be triggered every 60000 ms before timeout', function (done) {

        var session2 = new ATT.rtc.Session();
        onNeedsRefreshSpy = sinon.spy();

        session2.setId('123');
        session2.on('needs-refresh', onNeedsRefreshSpy);

        options.timeout = 60020;

        session2.update(options);

        setTimeout(function () {
          try {
            expect(onNeedsRefreshSpy.calledOnce).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 30);

        setTimeout(function () {
          try {
            expect(onNeedsRefreshSpy.calledTwice).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 60);

      });

      it('Should be triggered exactly after `timeout` milliseconds if `timeout` is less than 60 000 ms', function (done) {

        var session3 = new ATT.rtc.Session(options);
        onNeedsRefreshSpy = sinon.spy();

        session3.setId('123');
        session3.on('needs-refresh', onNeedsRefreshSpy);
        options.timeout = 50;

        session3.update(options);

        setTimeout(function () {
          try {
            expect(onNeedsRefreshSpy.calledOnce).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 60);
      });

      it('clear the old value for the timeout and only use the new value to publish', function (done) {
        var session3 = new ATT.rtc.Session(options);
        onNeedsRefreshSpy = sinon.spy();

        session3.setId('123');
        session3.on('needs-refresh', onNeedsRefreshSpy);

        options.timeout = 20;
        session3.update(options);

        options.timeout = 50;
        session3.update(options);

        setTimeout(function () {
          try {
            expect(onNeedsRefreshSpy.calledOnce).to.equal(false);
            done();
          } catch (e) {
            done(e);
          }
        }, 30);

        setTimeout(function () {
          try {
            expect(onNeedsRefreshSpy.calledOnce).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 60);
      });

      it('should call rtcManager.refreshSession', function (done) {
        var session4 = new ATT.rtc.Session();
        session4.setId('123');
        session4.update({
          token: 'bogus',
          e911Id: 'e911Bogus',
          timeout: 50
        });

        setTimeout(function () {
          try {
            expect(refreshSessionStub.called).to.equal(true);

//            callArgs = refreshSessionSpy.getCall(0).args[0];
//            expect(callArgs.sessionId !== undefined).to.equal(true);
//            expect(callArgs.token).to.equal('bogus');
//            expect(refreshSessionSpy.getCall(0).args[0].success).to.be.a('function');
//            expect(refreshSessionSpy.getCall(0).args[0].error).to.be.a('function');

            done();
          } catch (e) {
            done(e);
          }
        }, 60);

      });

    });

    describe('call-incoming', function () {

      var rtcManager,
        session,
        callInfo,
        conferenceInfo,
        emitterEM,
        createEventEmitterStub,
        getRTCMgrStub,
        createCallSpyStub,
        setRemoteSdpSpy,
        callIncomingHandlerSpy,
        conferenceInviteHandlerSpy;

      beforeEach(function () {
        callInfo = {
          sdp: 'asdf',
          type: 'call',
          id: '123',
          from: '1234',
          mediaType: 'video',
          remoteDescription: 'abc'
        };

        conferenceInfo = {
          type: 'conference',
          id: '123',
          from: '1234',
          mediaType: 'video',
          remoteDescription: 'abc'
        };

        emitterEM = ATT.private.factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
          return emitterEM;
        });

        rtcManager = new ATT.private.RTCManager(optionsforRTCM);

        getRTCMgrStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
          return rtcManager;
        });

        createEventEmitterStub.restore();

        session = new ATT.rtc.Session();

        callIncomingHandlerSpy = sinon.spy();

        conferenceInviteHandlerSpy = sinon.spy();

        session.on('call-incoming', callIncomingHandlerSpy);

        session.on('conference-invite', conferenceInviteHandlerSpy);

        createCallSpyStub = sinon.spy(session, 'createCall');
      });

      afterEach(function () {
        getRTCMgrStub.restore();
        createCallSpyStub.restore();
      });

      it('should execute session.createCall with breed as the type received in event data from event manager', function (done) {

        emitterEM.publish('invitation-received', callInfo);

        setTimeout(function () {
          try {
            expect(createCallSpyStub.called).to.equal(true);
            expect(createCallSpyStub.getCall(0).args[0].breed).to.equal(callInfo.type);
            expect(createCallSpyStub.getCall(0).args[0].id).to.equal(callInfo.id);
            expect(createCallSpyStub.getCall(0).args[0].peer).to.equal(callInfo.from);
            expect(createCallSpyStub.getCall(0).args[0].mediaType).to.equal(callInfo.mediaType);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      it('should execute call.setRemoteSdp with remoteDescription on the newly created call', function (done) {

        var call = new ATT.rtc.Call({
          breed: 'call',
          peer: callInfo.from,
          type: ATT.CallTypes.INCOMING,
          mediaType: callInfo.mediaType,
          remoteSdp: 'ABD'
        });

        createCallSpyStub.restore();

        createCallSpyStub = sinon.stub(session, 'createCall', function () {
          return call;
        });

        setRemoteSdpSpy = sinon.spy(call, 'setRemoteSdp');

        emitterEM.publish('invitation-received', callInfo);

        setTimeout(function () {
          try {
            expect(setRemoteSdpSpy.calledWith(callInfo.sdp)).to.equal(true);
            createCallSpyStub.restore();
            setRemoteSdpSpy.restore();
            done();
          } catch (e) {
            createCallSpyStub.restore();
            setRemoteSdpSpy.restore();
            done(e);
          }
        }, 10);
      });

      it('should trigger `call-incoming` with relevant data on creating the new call', function (done) {

        emitterEM.publish('invitation-received', callInfo);

        setTimeout(function () {
          try {
            expect(callIncomingHandlerSpy.called).to.equal(true);
            expect(callIncomingHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(callIncomingHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(callIncomingHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(callIncomingHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(callIncomingHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          } catch (e) {
            done(e);
          }
        }, 30);
      });

      it('should trigger `conference-invite` with relevant data on creating the new conference', function (done) {

        emitterEM.publish('invitation-received', conferenceInfo);

        setTimeout(function () {
          try {
            expect(conferenceInviteHandlerSpy.called).to.equal(true);
            expect(conferenceInviteHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(conferenceInviteHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(conferenceInviteHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(conferenceInviteHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(conferenceInviteHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');

            done();
          } catch (e) {
            done(e);
          }
        }, 30);
      });
    });

    describe('call-disconnected', function () {

      var rtcManager,
        session,
        callInfo,
        conferenceInfo,
        emitterEM,
        createEventEmitterStub,
        getRTCMgrStub,
        callDisconnectedHandlerSpy,
        confDisconnectedHandlerSpy;

      beforeEach(function () {
        callInfo = {
          id: '123',
          type: 'call',
          from: '1234',
          mediaType: 'video',
          remoteDescription: 'abc'
        };

        conferenceInfo = {
          type: 'conference',
          id: '123',
          from: '1234',
          mediaType: 'video',
          remoteDescription: 'abc'
        };

        emitterEM = ATT.private.factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
          return emitterEM;
        });

        rtcManager = new ATT.private.RTCManager(optionsforRTCM);

        getRTCMgrStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
          return rtcManager;
        });

        createEventEmitterStub.restore();

        session = new ATT.rtc.Session();

//        conference = new ATT.rtc.Call({
//          breed: 'conference',
//          id: '12345',
//          peer: '12345',
//          type: 'abc',
//          mediaType: 'audio'
//        });

        callDisconnectedHandlerSpy = sinon.spy();
        confDisconnectedHandlerSpy = sinon.spy();

        session.on('call-disconnected', callDisconnectedHandlerSpy);
        session.on('conference-disconnected', confDisconnectedHandlerSpy);

      });

      afterEach(function () {
        getRTCMgrStub.restore();
      });

      it('should publish `call-disconnected` with data on getting `call-disconnected` with type `call` from RTCMgr', function (done) {
        session.currentCall = new ATT.rtc.Call({
          breed: 'call',
          id: '12345',
          peer: '12345',
          type: 'abc',
          mediaType: 'audio'
        });

        emitterEM.publish('call-disconnected', callInfo);

        setTimeout(function () {
          try {
            expect(callDisconnectedHandlerSpy.called).to.equal(true);
            expect(callDisconnectedHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(callDisconnectedHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(callDisconnectedHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(callDisconnectedHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(callDisconnectedHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          } catch (e) {
            done(e);
          }
        }, 20);
      });

      it('should not publish `call-disconnected` on getting `call-disconnected` with type `conference` from RTCMgr', function (done) {
        session.currentCall = new ATT.rtc.Call({
          breed: 'call',
          id: '12345',
          peer: '12345',
          type: 'abc',
          mediaType: 'audio'
        });

        emitterEM.publish('call-disconnected', conferenceInfo);

        setTimeout(function () {
          try {
            expect(callDisconnectedHandlerSpy.called).to.equal(false);
            done();
          } catch (e) {
            done(e);
          }
        }, 20);
      });

      it('should publish `conference-disconnected` with data on getting `call-disconnected` with type `conference` from RTCMgr', function (done) {
        session.currentCall = new ATT.rtc.Call({
          breed: 'conference',
          id: '12345',
          peer: '12345',
          type: 'abc',
          mediaType: 'audio'
        });

        emitterEM.publish('call-disconnected', conferenceInfo);

        setTimeout(function () {
          try {
            expect(confDisconnectedHandlerSpy.called).to.equal(true);
            expect(confDisconnectedHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(confDisconnectedHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(confDisconnectedHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(confDisconnectedHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(confDisconnectedHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          } catch (e) {
            done(e);
          }
        }, 20);
      });

      it('should not publish `conference-disconnected` on getting `call-disconnected` with type `call` from RTCMgr', function (done) {
        session.currentCall = new ATT.rtc.Call({
          breed: 'conference',
          id: '12345',
          peer: '12345',
          type: 'abc',
          mediaType: 'audio'
        });

        emitterEM.publish('call-disconnected', callInfo);

        setTimeout(function () {
          try {
            expect(confDisconnectedHandlerSpy.called).to.equal(false);
            done();
          } catch (e) {
            done(e);
          }
        }, 20);
      });

    });
  });

});
