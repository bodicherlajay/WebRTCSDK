/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, xdescribe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL, after*/

describe('RTC Manager', function () {
  'use strict';

  var error,
    webRTCSessionResponse,
    factories,
    apiConfig,
    resourceManager,
    createEventManagerStub,
    eventManager,
    optionsForEM,
    optionsForRTCM,
    userMediaSvc,
    peerConnSvc,
    sessionInfo,
    emitter,
    createEventEmitterStub,
    timeout,
    localSdp;

  before(function () {
    ATT.private.pcv = 1;
    factories = ATT.private.factories;
    apiConfig = ATT.private.config.api;

    timeout = 1234;// time in seconds

    sessionInfo = {
      sessionId: '123',
      timeout: timeout * 1000 // milliseconds
    };

    error = {
      error: 'Test Error'
    };

    localSdp = 'localSdp';

    webRTCSessionResponse = {
      getResponseHeader: function (name) {
        switch (name) {
        case 'Location':
          return '123/123/123/123/' + sessionInfo.sessionId;
        case 'x-expires':
          return String(timeout); // seconds
        default:
          break;
        }
      }
    };

  });

  before(function () {
    resourceManager = factories.createResourceManager(apiConfig);

    optionsForEM = {
      resourceManager: resourceManager,
      channelConfig: {
        endpoint: '/events',
        type: 'longpolling'
      }
    };

    emitter = factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitter;
    });

    eventManager = factories.createEventManager(optionsForEM);

    createEventManagerStub = sinon.stub(factories, 'createEventManager', function () {
      return eventManager;
    });

    userMediaSvc = ATT.UserMediaService;
    peerConnSvc = ATT.PeerConnectionService;

    optionsForRTCM = {
      resourceManager: resourceManager,
      userMediaSvc: userMediaSvc,
      peerConnSvc: peerConnSvc
    };
  });

  after(function () {
    createEventManagerStub.restore();
    createEventEmitterStub.restore();
  });

  describe('Singleton', function () {

    it('should export ATT.private.rtcManager', function () {
      expect(ATT.private.rtcManager).to.be.a('object');
    });

    it('should have a method getRTCManager', function () {
      expect(ATT.private.rtcManager.getRTCManager).to.be.a('function');
    });

    it('should return an instance of RTCManager', function () {
      var rtcMgr = ATT.private.rtcManager.getRTCManager();
      expect(rtcMgr instanceof ATT.private.RTCManager).to.equal(true);
    });

    it('should always return the same instance', function () {
      var rtcMgr1 = ATT.private.rtcManager.getRTCManager(),
        rtcMgr2 = ATT.private.rtcManager.getRTCManager();
      expect(rtcMgr1 === rtcMgr2).to.equal(true);
    });
  });

  describe('Pseudo Class', function () {

    it('should export ATT.private.RTCManager', function () {
      expect(ATT.private.RTCManager).to.be.a('function');
    });

    describe('ATT.private.RTCManager Constructor', function () {
      var rtcMgr;

      it('should return an instance of RTCManager', function () {
        rtcMgr = new ATT.private.RTCManager(optionsForRTCM);
        expect(rtcMgr instanceof ATT.private.RTCManager).to.equal(true);
      });

      it('should create an event manager object', function () {
        rtcMgr = new ATT.private.RTCManager(optionsForRTCM);

        expect(createEventManagerStub.called).to.equal(true);
      });
    });

    describe('Methods', function () {
      var rtcManager,
        onSpy,
        doOperationStub,
        setupStub,
        stopStub;

      beforeEach(function () {

        onSpy = sinon.spy(eventManager, 'on');

        setupStub = sinon.stub(eventManager, 'setup', function () {
          emitter.publish('listening');
        });

        stopStub = sinon.stub(eventManager, 'stop', function () {
          emitter.publish('stop-listening');
        });

        rtcManager = new ATT.private.RTCManager(optionsForRTCM);

        doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
        });

      });

      afterEach(function () {
        onSpy.restore();
        setupStub.restore();
        stopStub.restore();
        doOperationStub.restore();
      });

      describe('On', function () {

        var onStub;

        beforeEach(function () {
          // change spy to stub
          onSpy.restore();
          onStub = sinon.stub(eventManager, 'on', function () {});
        });

        afterEach(function () {
          // restore stub to spy
          onStub.restore();
          onSpy = sinon.spy(eventManager, 'on');
        });

        it('should exist', function () {
          expect(rtcManager.on).to.be.a('function');
        });

        it('should call `eventManager.on` with the input parameters', function () {
          var arg1 = 'xyz',
            arg2 = function () {};

          rtcManager.on(arg1, arg2);

          expect(onStub.calledWith(arg1, arg2)).to.equal(true);
        });
      });

      describe('Off', function () {
        it('should exist', function () {
          expect(rtcManager.off).to.be.a('function');
        });

        it('should call `eventManager.off`', function () {

          var name, handler, offSpy = sinon.spy(eventManager, 'off');
          name = 'dummy';
          handler = function () {};
          rtcManager.off(name, handler);
          expect(offSpy.called).to.equal(true);
        });
      });

      describe('connectSession', function () {

        var onSessionConnectedSpy,
          onSessionReadySpy,
          onErrorSpy,
          optionsForConn;

        beforeEach(function () {
          onSessionConnectedSpy = sinon.spy();
          onSessionReadySpy = sinon.spy();
          onErrorSpy = sinon.spy();

          optionsForConn = {
            token: '123',
            onSessionConnected: onSessionConnectedSpy,
            onSessionReady: onSessionReadySpy,
            onError: onErrorSpy
          };

        });

        it('should exist', function () {
          expect(rtcManager.connectSession).to.be.a('function');
        });

        it('should throw error if invalid options', function () {
          expect(rtcManager.connectSession.bind(rtcManager)).to.throw('No options defined.');
          expect(rtcManager.connectSession.bind(rtcManager, {})).to.throw('No token defined.');
          expect(rtcManager.connectSession.bind(rtcManager, {token: '123'})).to.throw('Callback onSessionConnected not defined.');
          expect(rtcManager.connectSession.bind(rtcManager, {
            token: '123',
            onSessionConnected: function () {
            }
          })).to.throw('Callback onSessionReady not defined.');
          expect(rtcManager.connectSession.bind(rtcManager, {
            token: '123',
            onSessionReady: function () {
            }
          })).to.throw('Callback onSessionConnected not defined.');
          expect(rtcManager.connectSession.bind(rtcManager, {
            token: '123',
            onSessionConnected: function () {},
            onSessionReady: function () {}
          })).to.throw('Callback onError not defined.');
          expect(rtcManager.connectSession.bind(rtcManager, {
            token: '123',
            onSessionConnected: function () {},
            onSessionReady: function () {},
            onError: function () {}
          })).to.not.throw(Error);
        });

        it('should call doOperation on the resourceManager with `createWebRTCSession`', function () {
          rtcManager.connectSession(optionsForConn);

          expect(doOperationStub.called).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('createWebRTCSession');
        });

        describe('Callbacks on doOperation', function () {

          describe('success', function () {

            beforeEach(function () {
              doOperationStub.restore();

              doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
                setTimeout(function () {
                  options.success(webRTCSessionResponse);
                }, 10);
              });
            });

            it('should execute the onSessionConnected callback with `sessionId` and `timeout`', function (done) {
              rtcManager.connectSession(optionsForConn);

              setTimeout(function () {
                try {
                  expect(onSessionConnectedSpy.calledWith(sessionInfo)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 20);
            });

            it('Should subscribe to event listening from the event manager', function (done) {
              rtcManager.connectSession(optionsForConn);

              setTimeout(function () {
                try {
                  expect(onSpy.calledWith('listening')).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 20);
            });

            it('should call EventManager.setup with the session id', function (done) {
              rtcManager.connectSession(optionsForConn);

              setTimeout(function () {
                try {
                  expect(setupStub.called).to.equal(true);
                  expect(setupStub.getCall(0).args[0].sessionId).to.equal('123');
                  expect(setupStub.getCall(0).args[0].token).to.equal('123');
                  expect(setupStub.getCall(0).args[0].onError).to.be.a('function');
                  done();
                } catch (e) {
                  done(e);
                }
              }, 20);
            });

            it('should execute onSessionReady with data containing `sessionId` on receiving a `listening` event', function (done) {
              rtcManager.connectSession(optionsForConn);

              setTimeout(function () {
                try {
                  expect(onSessionReadySpy.calledWith({
                    sessionId: sessionInfo.sessionId
                  })).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 20);
            });

          });

          describe('error', function () {

            var createAPIErrorStub;

            beforeEach(function () {
              createAPIErrorStub = sinon.stub(ATT.Error, 'createAPIErrorCode');

              doOperationStub.restore();

              doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
                setTimeout(function () {
                  options.error();
                }, 0);
              });

            });

            afterEach(function () {
              createAPIErrorStub.restore();
            });

            it('should invoke the onError callback', function (done) {
              rtcManager.connectSession(optionsForConn);

              setTimeout(function () {
                try {
                  expect(onErrorSpy.calledOnce).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);
            });

          });

        });

        describe('Error Handling', function () {

          beforeEach(function () {
            doOperationStub.restore();
            setupStub.restore();

            doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
              setTimeout(function () {
                options.success(error);
              }, 0);
            });
          });

          afterEach(function () {
            setupStub.restore();
          });

          it('[2004] should be published with error event if unexpected exception is thrown', function(done) {

            optionsForConn.onSessionConnected = function () {
              throw error;
            };

            rtcManager.connectSession(optionsForConn);

            setTimeout(function () {
              try {
                expect(ATT.errorDictionary.getSDKError('2004')).to.be.an('object');
                expect(onErrorSpy.calledWith({
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

      describe('playStream', function () {
        it('should exist', function () {
          expect(rtcManager.playStream).to.be.a('function');
        });
      });

      describe('refreshSession', function () {

        beforeEach(function () {
          doOperationStub.restore();

          doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
            setTimeout(function () {
              options.success(webRTCSessionResponse);
            }, 0);
          });
        });

        it('should exist', function () {
          expect(rtcManager.refreshSession).to.be.a('function');
        });

        it('should throw an error if `options` are invalid', function () {
          expect(rtcManager.refreshSession.bind(rtcManager, undefined)).to.throw('Invalid options');
          expect(rtcManager.refreshSession.bind(rtcManager, {})).to.throw('Invalid options');
          expect(rtcManager.refreshSession.bind(rtcManager, {
            test: 'bogus'
          })).to.throw('No session ID passed');
          expect(rtcManager.refreshSession.bind(rtcManager, {
            sessionId: '123'
          })).to.throw('No token passed');
          expect(rtcManager.refreshSession.bind(rtcManager, {
            sessionId: '123',
            token: '123123'
          })).to.throw('No `success` callback passed');
          expect(rtcManager.refreshSession.bind(rtcManager, {
            sessionId: '123',
            token: '123123',
            success: function () { return; }
          })).to.throw('No `error` callback passed');
          expect(rtcManager.refreshSession.bind(rtcManager, {
            sessionId: '123',
            token: '123123',
            success: {}
          })).to.throw('`success` callback has to be a function');
          expect(rtcManager.refreshSession.bind(rtcManager, {
            sessionId: '123',
            token: '123123',
            success: function () { return; },
            error: {}
          })).to.throw('`error` callback has to be a function');
        });

        it('should call resourceManager.doOperation with `refreshWebRTCSession`', function () {

          rtcManager.refreshSession({
            token: 'token',
            sessionId: '1234',
            success: function () {},
            error: function () {}
          });

          expect(doOperationStub.called).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('refreshWebRTCSession');
          expect(doOperationStub.getCall(0).args[1].params.url[0]).to.equal('1234');
          expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('token');
        });

        describe('Success', function () {

          it('should execute the `success` callback', function (done) {
            var timeout = 200,
              onSuccessSpy = sinon.spy(),
              response = {
                getResponseHeader : function (name) {
                  var header;
                  switch (name) {
                    case 'x-expires':
                      header = timeout.toString(); // seconds
                      break;
                    default:
                      header = timeout.toString(); // seconds
                      break;
                  }
                  return header;
                }
              };

            doOperationStub.restore();

            doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) {
              setTimeout(function () {
                options.success(response);
              }, 0)
            });

            rtcManager.refreshSession({
              token: '123',
              sessionId: '1234',
              success: onSuccessSpy,
              error: function () { return; }
            });

            setTimeout(function () {
              try {
                expect(onSuccessSpy.called).to.equal(true);
                expect(onSuccessSpy.calledWith({
                  timeout: (timeout * 1000).toString()
                })).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);

          });
        });
      });

      describe('updateSessionWithE911Id', function () {

        it('should exist', function () {
          expect(rtcManager.updateSessionE911Id).to.be.a('function');
        });

        it('should throw an error if `options` are invalid', function () {

          var options = {e911Id : '1234', sessionId : '1234', token : 'dsfgdsdf'};
          expect(rtcManager.updateSessionE911Id.bind(rtcManager, undefined)).to.throw('Invalid options');
          expect(rtcManager.updateSessionE911Id.bind(rtcManager, {
            e911Id : options.e911Id,
            sessionId : options.sessionId,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No token passed');
          expect(rtcManager.updateSessionE911Id.bind(rtcManager, {
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No e911Id passed');
          expect(rtcManager.updateSessionE911Id.bind(rtcManager, {
            e911Id : options.e911Id,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No session Id passed');

          expect(rtcManager.updateSessionE911Id.bind(rtcManager, {
            e911Id : options.e911Id,
            sessionId : options.sessionId,
            token : options.token,
            onError : function () {}
          })).to.throw('No success callback passed');

          expect(rtcManager.updateSessionE911Id.bind(rtcManager, {
            e911Id : options.e911Id,
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {}
          })).to.throw('No error callback passed');

          expect(rtcManager.updateSessionE911Id.bind(rtcManager, {
            e911Id : options.e911Id,
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.not.throw('No token passed');
        });

        it('should call resourceManager.doOperation with `updateSessionE911Id`', function () {

          rtcManager.updateSessionE911Id({
            token: 'token',
            sessionId: '1234',
            e911Id: '1232',
            onSuccess : function () {},
            onError : function () {}
          });

          expect(doOperationStub.called).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('refreshWebRTCSessionWithE911Id');
          expect(doOperationStub.getCall(0).args[1].params.url[0]).to.equal('1234');
          expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('token');
          expect(doOperationStub.getCall(0).args[1].data.e911Association.e911Id).to.equal('1232');

        });

        describe('Success', function () {

          it('should execute the `success` callback', function (done) {
            var  onSuccessSpy = sinon.spy();

            doOperationStub.restore();

            doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) {
              setTimeout(function () {
                options.success();
              }, 0);
            });

            rtcManager.updateSessionE911Id({
              token: 'token',
              sessionId: '1234',
              e911Id: '1232',
              onSuccess : onSuccessSpy,
              onError : function () {}
            });


            setTimeout(function () {
              try {
                expect(onSuccessSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);

          });
        });
      });

      describe('disconnectSession', function () {

        var error,
          optionsForDisconn,
          onSessionDisconnectedSpy,
          onErrorSpy;

        beforeEach(function () {
          error = {
            error: 'Test Error'
          };

          onSessionDisconnectedSpy = sinon.spy();
          onErrorSpy = sinon.spy();

          optionsForDisconn = {
            sessionId: 'sessionid',
            token: '123',
            onSessionDisconnected: onSessionDisconnectedSpy,
            onError: onErrorSpy
          };

        });

        it('should exist', function () {
          expect(rtcManager.disconnectSession).to.be.a('function');
        });

        it('should throw an error if invalid options', function () {
          expect(rtcManager.disconnectSession.bind(rtcManager)).to.throw('No options defined.');
          expect(rtcManager.disconnectSession.bind(rtcManager, {})).to.throw('No session id defined.');
          expect(rtcManager.disconnectSession.bind(rtcManager, {
            sessionId: 'sessionid'
          })).to.throw('No token defined.');
          expect(rtcManager.disconnectSession.bind(rtcManager, {
            sessionId: 'sessionid',
            token: '123'
          })).to.throw('Callback onSessionDisconnected not defined.');
          expect(rtcManager.disconnectSession.bind(rtcManager, {
            sessionId: 'sessionid',
            token: '123',
            onSessionDisconnected: function () {
            }
          })).to.not.throw(Error);
        });

        it('should execute EventManager.stop', function () {
          rtcManager.disconnectSession(optionsForDisconn);

          expect(stopStub.calledBefore(doOperationStub)).to.equal(true);
        });

        it('should call doOperation on the resourceManager with `deleteWebRTCSession`', function () {
          rtcManager.disconnectSession(optionsForDisconn);

          expect(doOperationStub.calledWith('deleteWebRTCSession')).to.equal(true);
        });

        describe('Callbacks for disconnectSession', function () {

          describe('success', function () {

            beforeEach(function () {

              doOperationStub.restore();

              doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
                setTimeout(function () {
                  options.success();
                }, 0);
              });

            });

            it('should execute the onSessionDisconnected callback', function (done) {
              rtcManager.disconnectSession(optionsForDisconn);

              setTimeout(function () {
                try {
                  expect(onSessionDisconnectedSpy.called).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);

            });

          });

          describe('error', function () {
            var createAPIErrorStub;

            beforeEach(function () {
              createAPIErrorStub = sinon.stub(ATT.Error, 'createAPIErrorCode');
            });

            afterEach(function () {
              createAPIErrorStub.restore();
            });

            it('should call onError callback with the error object', function (done) {

              doOperationStub.restore();

              doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
                setTimeout(function () {
                  options.error();
                }, 0);
              });

              rtcManager.disconnectSession(optionsForDisconn);

              setTimeout(function() {
                try {
                  expect(onErrorSpy.calledOnce).to.equal(true);
                  done();
                } catch(err) {
                  done(err);
                }
              }, 10);
            });
          });
        });
      });

      describe('connectCall', function () {
        var options,
          getUserMediaStub,
          initPeerConnectionStub,
          onCallConnectingSpy,
          onErrorSpy,
          setRemoteSdpStub,
          remoteSdp,
          onUserMediaErrorSpy;

        beforeEach(function () {
          onCallConnectingSpy = sinon.spy();
          onUserMediaErrorSpy = sinon.spy();
          onErrorSpy = sinon.spy();

          options = {
            breed: 'call',
            peer: '123',
            mediaType: 'xyz',
            onCallConnecting: onCallConnectingSpy,
            onUserMediaError: onUserMediaErrorSpy,
            onError: onErrorSpy
          };

          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
            options.onUserMedia({});
            options.onMediaEstablished();
          });

          remoteSdp = 'abc';

          initPeerConnectionStub = sinon.stub(ATT.PeerConnectionService, 'initiatePeerConnection', function (options) {
            options.onPeerConnectionInitiated({
              xState: 'abc',
              callId: '123',
              localSdp: 'aaa'
            });
            emitter.publish('remote-sdp', remoteSdp);
          });

          setRemoteSdpStub = sinon.stub(ATT.PeerConnectionService, 'setTheRemoteDescription', function (options) {
            options.success();
          });

        });

        afterEach(function () {
          getUserMediaStub.restore();
          initPeerConnectionStub.restore();
          setRemoteSdpStub.restore();
        });

        it('should exist', function () {
          expect(rtcManager.connectCall).to.be.a('function');
        });

        it('should throw an error if invalid options', function () {
          expect(rtcManager.connectCall.bind(rtcManager)).to.throw('No options defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {})).to.throw('No `peer` or `callId` defined');
          expect(rtcManager.connectCall.bind(rtcManager, {
            peer: '123'
          })).to.throw('No MediaType defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            peer: '1234',
            mediaType: 'audio'
          })).to.throw('Callback `onCallConnecting` not defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            callId: '1234',
            mediaType: 'audio'
          })).to.throw('Callback `onCallConnecting` not defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            peer: '123',
            mediaType: 'video',
            onCallConnecting: function () {}
          })).to.throw('Callback `onUserMediaError` not defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            callId: '123',
            mediaType: 'video',
            onCallConnecting: function () {},
            onUserMediaError: function () {}
          })).to.throw('Callback `onError` not defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            callId: '123',
            mediaType: 'video',
            onCallConnecting: function () {},
            onUserMediaError: function () {},
            onError: function () { return; }
          })).to.not.throw(Error);
        });

        it('should call getUserMedia on user media service', function () {

          rtcManager.connectCall(options);

          expect(getUserMediaStub.called).to.equal(true);
        });

        describe('getUserMedia callbacks', function () {

          beforeEach(function () {
            rtcManager.connectCall(options);
          });

          describe('onUserMedia', function () {

            it('should invoke peerConnSvc.initiatePeerConnection with call breed', function () {
              expect(initPeerConnectionStub.called).to.equal(true);
              expect(initPeerConnectionStub.getCall(0).args[0].breed).to.not.be.an('undefined');
            });

            describe('initiatePeerConnection success', function () {

              it('should invoke callback `onCallConnecting`', function () {
                expect(onCallConnectingSpy.called).to.equal(true);
              });
            });

          });

          describe('onMediaEstablished', function () {

            it('should execute callback onMediaEstablished');
          });

        });

      });

      describe('connectConference', function () {

        var connectConfOpts,
          connectCallOpts,
          onSuccessSpy,
          onErrorSpy;

        beforeEach(function () {
          onSuccessSpy = sinon.spy();
          onErrorSpy = sinon.spy();

          connectCallOpts = {
            peer: '1234',
            description: {
              sdp: localSdp,
              type: 'offer'
            },
            callId: '123',
            sessionId: '123',
            token : 'token',
            breed: 'call', // `conference` or `call`
            onSuccess: onSuccessSpy,
            onError: onErrorSpy
          };

          connectConfOpts = {
            description: {
              sdp: localSdp,
              type: 'offer'
            },
            callId: '123',
            sessionId: '123',
            token : 'token',
            breed: 'conference', // `conference` or `call`
            onSuccess: onSuccessSpy,
            onError: onErrorSpy
          };

        });

        it('should exist', function () {
          expect(rtcManager.connectConference).to.be.a('function');
        });

        it('should execute `resourceManager.doOperation(connectCall)`[breed == call] with required params', function () {
          rtcManager.connectConference(connectCallOpts);

          expect(doOperationStub.called).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('connectCall');
          expect(doOperationStub.getCall(0).args[1]).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params.url.sessionId).to.equal(connectCallOpts.sessionId);
          expect(doOperationStub.getCall(0).args[1].params.url.callId).to.equal(connectCallOpts.callId);
          expect(doOperationStub.getCall(0).args[1].params.url.type).to.equal('calls');
          expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + connectCallOpts.token);
          expect(doOperationStub.getCall(0).args[1].data.callsMediaModifications.sdp).to.equal(connectCallOpts.description.sdp);
          expect(doOperationStub.getCall(0).args[1].params.headers.options['x-calls-action']).to.equal('call-answer');
          expect(doOperationStub.getCall(0).args[1].success).to.be.a('function');
          expect(doOperationStub.getCall(0).args[1].error).to.be.a('function');
        });

        it('should execute `resourceManager.doOperation(connectCall)`[breed == conference] with required params', function () {

          rtcManager.connectConference(connectConfOpts);

          expect(doOperationStub.called).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('connectCall');
          expect(doOperationStub.getCall(0).args[1]).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params.url.sessionId).to.equal(connectConfOpts.sessionId);
          expect(doOperationStub.getCall(0).args[1].params.url.callId).to.equal(connectConfOpts.callId);
          expect(doOperationStub.getCall(0).args[1].params.url.type).to.equal('conferences');
          expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + connectConfOpts.token);
          expect(doOperationStub.getCall(0).args[1].data.conferenceModifications.sdp).to.equal(connectConfOpts.description.sdp);
          expect(doOperationStub.getCall(0).args[1].params.headers.options['x-conference-action']).to.equal('call-answer');
          expect(doOperationStub.getCall(0).args[1].success).to.be.a('function');
          expect(doOperationStub.getCall(0).args[1].error).to.be.a('function');
        });

        describe('doOperations Callbacks', function () {

          describe('success', function () {
            var response;

            beforeEach(function () {
              response = {
                getResponseHeader: function (name) {
                  switch (name) {
                  case 'x-state':
                    return 'accepted';
                  default:
                    break;
                  }
                }
              };
              doOperationStub.restore();

              doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
                setTimeout(function () {
                  options.success(response);
                }, 0);
              });
            });

            it('should trigger `onSuccess` callback of `connectConference` with the returned state', function (done) {
              rtcManager.connectConference(connectConfOpts);

              setTimeout(function () {
                try {
                  console.log(onSuccessSpy.getCall(0).args);
                  expect(onSuccessSpy.calledWith({
                    state: response.getResponseHeader('x-state')
                  })).to.equal(true);
                  done();
                } catch(e) {
                  done(e);
                }
              }, 10);
            });
          });

          describe('error', function () {

            it('should publish `error` with error data', function (done) {
              doOperationStub.restore();

              doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
                setTimeout(function () {
                  options.error(error);
                }, 0);
              });

              rtcManager.connectConference(connectConfOpts);

              setTimeout(function () {
                try {
                  expect(onErrorSpy.called).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);
            });
          });
        });
      });

      describe('addParticipant', function () {

        it('should exist', function () {
          expect(rtcManager.addParticipant).to.be.a('function');
        });

        it('should call resourceManager.doOperation', function () {
          rtcManager.addParticipant({
            sessionInfo: {},
            confId: '123',
            onSuccess: function () {},
            invitee: '12345'
          });

          expect(doOperationStub.called).to.equal(true);
        });

        describe('Success on doOperation', function () {
          var onSuccessSpy,
            response;

          beforeEach(function () {
            onSuccessSpy = sinon.spy();
          });

          it('should call `options.onSuccess` if response.getResponseHeader() === `add-pending`', function (done) {

            // ==== Positive case
            response = {
              getResponseHeader: function (name) {
                switch(name) {
                  case 'x-state':
                    return 'add-pending';
                  case 'x-modId':
                    return 'abc321';
                }
              }
            };

            doOperationStub.restore();

            doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
              setTimeout(function () {
                options.success(response);
              }, 0);
            });

            rtcManager.addParticipant({
              sessionInfo: {},
              confId: '123',
              onSuccess: onSuccessSpy,
              invitee: '12345'
            });

            setTimeout(function () {
              try {
                expect(onSuccessSpy.calledWith('abc321')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });
        });

        describe('Invalid parameters', function () {
          it('should throw an error if invalid `options` are passed', function () {
            expect(rtcManager.addParticipant.bind(rtcManager)).to.throw('No `options` passed');
            expect(rtcManager.addParticipant.bind(rtcManager, {
              confId: {},
              invitee: '12345'
            })).to.throw('No `sessionInfo` passed');
            expect(rtcManager.addParticipant.bind(rtcManager, {
              sessionInfo: {},
              invitee: '12345'
            })).to.throw('No `confId` passed');
            expect(rtcManager.addParticipant.bind(rtcManager, {
              sessionInfo: {},
              invitee: '12345',
              confId: '1234'
            })).to.throw('No `onSuccess` callback passed');
            expect(rtcManager.addParticipant.bind(rtcManager, {
              sessionInfo: {},
              confId: '123',
              invitee: '12345',
              onSuccess: function () {}
            })).to.not.throw(Error);
          });
        });

        describe('Error on doOperation', function () {
          var onErrorSpy,
            error,
            createAPIErrorCodeStub;

          beforeEach(function () {
            onErrorSpy = sinon.spy();
          });

          afterEach(function () {
            createAPIErrorCodeStub.restore();
          });

          it('should call `options.onError` if resourceManager returns an error', function () {
            error = {
              message: 'error',
              HttpStatusCode: '400'
            };

            createAPIErrorCodeStub = sinon.stub(ATT.Error, 'createAPIErrorCode', function () {
              return error;
            });

            doOperationStub.restore();

            doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
              options.error(error);
            });

            rtcManager.addParticipant({
              sessionInfo: {},
              confId: '123',
              onSuccess: function () { },
              onError: onErrorSpy,
              invitee: '12345'
            });

            expect(onErrorSpy.calledWith(error)).to.equal(true);
          });
        });
      });

      describe('cancelCall', function () {

        var options,
          cancelSdpOfferStub,
          onSuccessSpy,
          onErrorSpy;

        beforeEach(function () {
          onSuccessSpy = sinon.spy();
          onErrorSpy = sinon.spy();

          options = {
            callId: 'callId',
            sessionId: 'sessionId',
            token: 'token',
            onSuccess: onSuccessSpy,
            onError: onErrorSpy
          };

          cancelSdpOfferStub = sinon.stub(peerConnSvc, 'cancelSdpOffer', function (success) {
            success();
          });
        });

        afterEach(function () {
          cancelSdpOfferStub.restore();
        });

        it('should exist', function () {
          expect(rtcManager.cancelCall).to.be.a('function');
        });

        it('should throw an error if invalid `options`', function () {
          expect(rtcManager.cancelCall.bind(rtcManager)).to.throw('No options provided');
          expect(rtcManager.cancelCall.bind(rtcManager, {})).to.throw('No callId provided');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            callId: options.callId
          })).to.throw('No sessionId provided');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            callId: options.callId,
            sessionId: options.sessionId
          })).to.throw('No token provided');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            callId: options.callId,
            sessionId: options.sessionId,
            token: options.token
          })).to.throw('No success callback provided');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            callId: options.callId,
            sessionId: options.sessionId,
            token: options.token,
            onSuccess: options.onSuccess
          })).to.throw('No error callback provided');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            callId: options.callId,
            sessionId: options.sessionId,
            token: options.token,
            onSuccess: options.onSuccess,
            onError: options.onError
          })).not.to.throw(Error);
        });

        it('should not call peerConnSvc.cancelSdpOffer if options.callId is not null', function () {
          rtcManager.cancelCall(options);

          expect(cancelSdpOfferStub.called).to.equal(false);
        });

        it('should call peerConnSvc.cancelSdpOffer with a success callback if options.callId is null', function () {
          options.callId = null;

          rtcManager.cancelCall(options);

          expect(cancelSdpOfferStub.called).to.equal(true);
          expect(cancelSdpOfferStub.getCall(0).args[0]).to.be.a('function');
        });

        it('should call resourceManager.doOperation if options.callId is not null', function () {
          rtcManager.cancelCall(options);

          expect(doOperationStub.called).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('cancelCall');
          expect(doOperationStub.getCall(0).args[1]).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params.url).to.be.an('array');
          expect(doOperationStub.getCall(0).args[1].params.url[0]).to.equal(options.sessionId);
          expect(doOperationStub.getCall(0).args[1].params.url[1]).to.equal(options.callId);
          expect(doOperationStub.getCall(0).args[1].params.headers).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + options.token);
        });

        describe('Success on `cancelSdpOffer`', function () {

          it('should execute `success` callback', function () {
            options.callId = null;

            rtcManager.cancelCall(options);

            expect(onSuccessSpy.called).to.equal(true);
          });

        });

        describe('Error on doOperation', function () {
          var createAPIErrorCodeStub;

          beforeEach(function () {
            doOperationStub.restore();

            doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
              setTimeout(function () {
                options.error(error);
              }, 0);
            });

            createAPIErrorCodeStub = sinon.stub(ATT.Error, 'createAPIErrorCode', function () {
              return error;
            });
          });

          afterEach(function () {
            createAPIErrorCodeStub.restore();
          });

          it('should call createAPIErrorCode with operation `cancel`', function (done) {
            rtcManager.cancelCall(options);

            setTimeout(function () {
              try {
                expect(createAPIErrorCodeStub.calledWith(error, 'ATT.rtc.Phone', 'cancel', 'RTC')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          it('should call onError callback of cancelCall with the error object', function (done) {
            rtcManager.cancelCall(options);

            setTimeout(function () {
              try {
                expect(onErrorSpy.calledWith(error)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

        });
      });

      describe('disconnectCall', function () {

        var options,
          onErrorSpy;

        beforeEach(function () {
          onErrorSpy = sinon.spy();

          options = {
            callId: '1234',
            breed: 'call',
            sessionId: 'sessionId',
            token: 'token',
            onSuccess: function () {},
            onError: onErrorSpy
          };
        });

        it('should exist', function () {
          expect(rtcManager.disconnectCall).to.be.a('function');
        });

        it('should throw an error if invalid options', function () {
          expect(rtcManager.disconnectCall.bind(rtcManager)).to.throw('No options provided');
          expect(rtcManager.disconnectCall.bind(rtcManager, {})).to.throw('No CallId provided');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            callId: options.callId
          })).to.throw('No call breed provided');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            callId: options.callId,
            breed: options.breed
          })).to.throw('No sessionId provided');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            callId: options.callId,
            breed: options.breed,
            sessionId: options.sessionId
          })).to.throw('No token provided');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            callId: options.callId,
            breed: options.breed,
            sessionId: options.sessionId,
            token: options.token
          })).to.throw('No success callback provided');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            callId: options.callId,
            breed: options.breed,
            sessionId: options.sessionId,
            token: options.token,
            onSuccess: options.onSuccess
          })).to.throw('No error callback provided');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            callId: options.callId,
            breed: options.breed,
            sessionId: options.sessionId,
            token: options.token,
            onSuccess: options.onSuccess,
            onError: options.onError
          })).to.not.throw(Error);
        });

        it('should call doOperation on the resourceManager with `endCall`', function () {

          rtcManager.disconnectCall(options);

          expect(doOperationStub.called).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('endCall');
          expect(doOperationStub.getCall(0).args[1].params).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params.url).to.be.an('array');
          expect(doOperationStub.getCall(0).args[1].params.url[0]).to.equal(options.sessionId);
          expect(doOperationStub.getCall(0).args[1].params.url[1]).to.equal(options.breed + 's');
          expect(doOperationStub.getCall(0).args[1].params.url[2]).to.equal(options.callId);
          expect(doOperationStub.getCall(0).args[1].params.headers).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + options.token);
        });

        describe('Error on doOperation', function () {
          var createAPIErrorCodeStub;

          beforeEach(function () {
            doOperationStub.restore();

            doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
              setTimeout(function () {
                options.error(error);
              }, 0);
            });

            createAPIErrorCodeStub = sinon.stub(ATT.Error, 'createAPIErrorCode', function () {
              return error;
            });
          });

          afterEach(function () {
            createAPIErrorCodeStub.restore();
          });

          it('should execute createAPIErrorCode with operation `hangup` for breed `call`', function (done) {
            rtcManager.disconnectCall(options);

            setTimeout(function () {
              try {
                expect(createAPIErrorCodeStub.calledWith(error, 'ATT.rtc.Phone', 'hangup', 'RTC')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          it('should execute createAPIErrorCode with operation `endConference` for breed `conference`', function (done) {
            options.breed = 'conference';

            rtcManager.disconnectCall(options);

            setTimeout(function () {
              try {
                expect(createAPIErrorCodeStub.calledWith(error, 'ATT.rtc.Phone', 'endConference', 'RTC')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          it('should call `options.onError` callback with the error object', function (done) {

            rtcManager.disconnectCall(options);

            setTimeout(function () {
              try {
                expect(onErrorSpy.calledWith(error)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });
        });

      });

      describe('muteCall', function () {
        var muteStreamStub,
          onSuccessSpy = sinon.spy();

        it('should exist', function () {
          expect(rtcManager.muteCall).to.be.a('function');
        });

        it('should call userMediaSvc.muteStream', function () {
          muteStreamStub = sinon.stub(ATT.UserMediaService, 'muteStream', function (options) {
            return options.onLocalStreamMuted();
          });

          rtcManager.muteCall({
            onSuccess: onSuccessSpy
          });

          expect(muteStreamStub.called).to.equal(true);
          expect(muteStreamStub.getCall(0).args[0]).to.be.an('object');
          muteStreamStub.restore();
        });

        it('should call the success callback passed in from rtcManager', function () {
          expect(onSuccessSpy.called).to.equal(true);
        });
      });

      describe('unmuteCall', function () {
        var unmuteStreamStub,
          onSuccessSpy = sinon.spy();

        it('should exist', function () {
          expect(rtcManager.unmuteCall).to.be.a('function');
        });

        it('should call userMediaSvc.unmuteStream', function () {
          unmuteStreamStub = sinon.stub(ATT.UserMediaService, 'unmuteStream', function (options) {
            return options.onLocalStreamUnmuted();
          });

          rtcManager.unmuteCall({
            onSuccess: onSuccessSpy
          });

          expect(unmuteStreamStub.called).to.equal(true);
          expect(unmuteStreamStub.getCall(0).args[0]).to.be.an('object');
          unmuteStreamStub.restore();
        });

        it('should call the success callback passed in from rtcManager', function () {
          expect(onSuccessSpy.called).to.equal(true);
        });
      });

      describe('setMediaModifications', function () {

        it('should exist', function () {
          expect(rtcManager.setMediaModifications).to.be.a('function');
        });

        it('should execute peerConnSvc.setRemoteAndCreateAnswer', function () {
          var modifications = {
              remoteDescription: 'abc',
              modificationId: '123'
            },
            setRemoteAndCreateAnswerStub = sinon.stub(peerConnSvc, 'setRemoteAndCreateAnswer', function () {});

          rtcManager.setMediaModifications(modifications);

          expect(setRemoteAndCreateAnswerStub.calledWith(modifications.remoteDescription, modifications.modificationId)).to.equal(true);

          setRemoteAndCreateAnswerStub.restore();
        });

      });

      describe('setRemoteDescription', function () {
        it('should exist', function () {
          expect(rtcManager.setRemoteDescription).to.be.a('function');
        });

        it('should execute peerConnection.setTheRemoteDescription', function () {
          var setTheRemoteDescriptionSpy = sinon.spy(peerConnSvc, 'setTheRemoteDescription'),
            remoteSdp = '3123',
            type = 'answer';

          rtcManager.setRemoteDescription({
            sdp:remoteSdp,
            type: type
          });

          expect(setTheRemoteDescriptionSpy.getCall(0).args[1]).to.equal('answer');

          setTheRemoteDescriptionSpy.restore();
        });
      });

      describe('resetPeerConnection', function () {

        it('should exist', function () {
          expect(rtcManager.resetPeerConnection).to.be.a('function');
        });

        it('should execute peerConnSvc.endCall', function () {
          var peerConnSvcEndCallStub = sinon.stub(ATT.PeerConnectionService, 'endCall');

          rtcManager.resetPeerConnection();

          expect(peerConnSvcEndCallStub.called).to.equal(true);

          peerConnSvcEndCallStub.restore();
        });
      });

      describe('disableMediaStream', function () {
        it('should exist', function () {
           expect(rtcManager.disableMediaStream).to.be.a('function');
        });

        it('should call userMediaSvc.disableMediaStream', function () {
          var disableMediaStreamStub = sinon.stub(ATT.UserMediaService, 'disableMediaStream');
          rtcManager.disableMediaStream();
          expect(disableMediaStreamStub.called).to.equal(true);
          disableMediaStreamStub.restore();
        });
      });

      describe('enableMediaStream', function () {
        it('should exist', function () {
           expect(rtcManager.enableMediaStream).to.be.a('function');
        });

        it('should call peerConnectionSvc.enableMediaStream', function () {
          var enableMediaStreamStub = sinon.stub(ATT.UserMediaService, 'enableMediaStream');
          rtcManager.enableMediaStream();
          expect(enableMediaStreamStub.called).to.equal(true);
          enableMediaStreamStub.restore();
        });
      });

      describe('stopUserMedia', function () {

        it('should exist', function () {
          expect(rtcManager.stopUserMedia).to.be.a('function');
        });

        it('should execute userMediaSvc.stopStream', function () {
          var userMediaSvcStopStreamStub = sinon.stub(ATT.UserMediaService, 'stopStream');

          rtcManager.stopUserMedia();

          expect(userMediaSvcStopStreamStub.called).to.equal(true);

          userMediaSvcStopStreamStub.restore();
        });
      });

      describe('holdCall', function () {
        var holdCallStub,
          onSuccessSpy = sinon.spy();

        beforeEach(function () {
          holdCallStub = sinon.stub(ATT.PeerConnectionService, 'holdCall', function (options) {
            options.onHoldSuccess('localSdp');
          });
        });

        afterEach(function () {
          holdCallStub.restore();
        });

        it('should exist', function () {
          expect(rtcManager.holdCall).to.be.a('function');
        });

        it('should throw an error if called without valid options', function () {
          expect(rtcManager.holdCall.bind(rtcManager, undefined)).to.throw('No options passed');
          expect(rtcManager.holdCall.bind(rtcManager, {
            onSuccess: function () {}
          })).to.throw('No callId passed');
          expect(rtcManager.holdCall.bind(rtcManager, {
            callId: '1234'
          })).to.throw('No onSuccess callback passed');
          expect(rtcManager.holdCall.bind(rtcManager, {
            onSuccess: function () {},
            callId: '1234'
          })).to.not.throw(Error);
        });

        it('should call peer-connection.holdCall', function () {
          rtcManager.holdCall({
            onSuccess: onSuccessSpy,
            callId: '1234'
          });

          expect(holdCallStub.called).to.equal(true);
        });

        it('should call the success callback passed in from rtcManager', function () {
          expect(onSuccessSpy.calledWith('localSdp')).to.equal(true);
        });
      });

      describe('resumeCall', function () {
        var resumeCallStub,
          onSuccessSpy = sinon.spy();

        beforeEach(function () {
          resumeCallStub = sinon.stub(ATT.PeerConnectionService, 'resumeCall', function (options) {
            options.onResumeSuccess('localSdp');
          });
        });

        afterEach(function () {
          resumeCallStub.restore();
        });

        it('should exist', function () {
          expect(rtcManager.resumeCall).to.be.a('function');
        });

        it('should throw an error if called without valid options', function () {
          expect(rtcManager.resumeCall.bind(rtcManager, undefined)).to.throw('No options passed');
          expect(rtcManager.resumeCall.bind(rtcManager, {
            onSuccess: function () {}
          })).to.throw('No callId passed');
          expect(rtcManager.resumeCall.bind(rtcManager, {
            callId: '1234'
          })).to.throw('No onSuccess callback passed');
          expect(rtcManager.resumeCall.bind(rtcManager, {
            onSuccess: function () {},
            callId: '1234'
          })).to.not.throw(Error);
        });

        it('should call peer-connection.resumeCall', function () {
          rtcManager.resumeCall({
            onSuccess: onSuccessSpy,
            callId: '1234'
          });

          expect(resumeCallStub.called).to.equal(true);
        });

        it('should call the success callback passed in from rtcManager', function () {
          expect(onSuccessSpy.calledWith('localSdp')).to.equal(true);
        });
      });

      describe('rejectCall', function () {

        var options,
          onErrorSpy;

        beforeEach(function () {
          onErrorSpy = sinon.spy();

          options = {
            token : 'token',
            callId : 'callId',
            sessionId : 'sessionId',
            breed: 'call',
            onSuccess: function () {},
            onError: onErrorSpy
          };

          doOperationStub.restore();

          doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
            setTimeout(function () {
              options.success(webRTCSessionResponse);
            }, 0);
          });
        });

        it('should exist', function () {
          expect(rtcManager.rejectCall).to.be.a('function');
        });

        it('should throw an error if `options` are invalid', function () {
          expect(rtcManager.rejectCall.bind(rtcManager, undefined)).to.throw('Invalid options');
          expect(rtcManager.rejectCall.bind(rtcManager, {})).to.throw('No callId provided');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId
          })).to.throw('No call breed provided');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            breed: options.breed
          })).to.throw('No session Id provided');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            breed: options.breed,
            sessionId : options.sessionId
          })).to.throw('No token provided');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            breed: options.breed,
            sessionId : options.sessionId,
            token : options.token
          })).to.throw('No success callback provided');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            breed: options.breed,
            sessionId : options.sessionId,
            token : options.token,
            onSuccess: options.onSuccess
          })).to.throw('No error callback provided');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            breed: options.breed,
            sessionId : options.sessionId,
            token : options.token,
            onSuccess: options.onSuccess,
            onError : options.onError
          })).to.not.throw(Error);
        });

        it('should call doOperation on the resourceManager with `rejectCall`', function () {
          rtcManager.rejectCall(options);

          expect(doOperationStub.calledWith('rejectCall')).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('rejectCall');
          expect(doOperationStub.getCall(0).args[1]).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params.url).to.be.an('array');
          expect(doOperationStub.getCall(0).args[1].params.url[0]).to.equal(options.sessionId);
          expect(doOperationStub.getCall(0).args[1].params.url[1]).to.equal('calls');
          expect(doOperationStub.getCall(0).args[1].params.url[2]).to.equal(options.callId);
          expect(doOperationStub.getCall(0).args[1].params.headers).to.be.an('object');
          expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + options.token);
        });

        describe('Error on doOperation', function () {
          var createAPIErrorCodeStub;

          beforeEach(function () {
            doOperationStub.restore();

            doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
              setTimeout(function () {
                options.error(error);
              }, 0);
            });

            createAPIErrorCodeStub = sinon.stub(ATT.Error, 'createAPIErrorCode', function () {
              return error;
            });
          });

          afterEach(function () {
            createAPIErrorCodeStub.restore();
          });

          it('should call createAPIErrorCode with `reject` for breed call', function (done) {

            rtcManager.rejectCall(options);

            setTimeout(function () {
              try {
                expect(createAPIErrorCodeStub.calledWith(error, 'ATT.rtc.Phone', 'reject', 'RTC')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          it('should call createAPIErrorCode with `rejectConference` for breed conference`', function (done) {
            options.breed = 'conference';

            rtcManager.rejectCall(options);

            setTimeout(function () {
              try {
                expect(createAPIErrorCodeStub.calledWith(error, 'ATT.rtc.Phone', 'rejectConference', 'RTC')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          it('should call onError callback of rejectCall with the error object', function (done) {
            rtcManager.rejectCall(options);

            setTimeout(function () {
              try {
                expect(onErrorSpy.calledWith(error)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

        });

      });

      describe('peerConnection 2', function () {
        beforeEach(function () {
          ATT.private.pcv = 2;
        });
        describe('hold', function () {
          var onSuccessSpy, onErrorSpy, options;
          beforeEach(function () {
            onSuccessSpy = sinon.spy();
            onErrorSpy = sinon.spy();

            options = {
              callId: 'callId',
              sessionId: 'sessionId',
              token: 'token',
              description: {
                sdp: localSdp,
                type: 'offer'
              },
              onSuccess: onSuccessSpy,
              onError: onErrorSpy
            };
          });
          it('should throw an error if invalid `options`', function () {
            expect(rtcManager.holdCall.bind(rtcManager)).to.throw('No options provided');
            expect(rtcManager.holdCall.bind(rtcManager, {})).to.throw('No callId provided');
            expect(rtcManager.holdCall.bind(rtcManager, {
              callId: options.callId
            })).to.throw('No sessionId provided');
            expect(rtcManager.holdCall.bind(rtcManager, {
              callId: options.callId,
              sessionId: options.sessionId
            })).to.throw('No token provided');
            expect(rtcManager.holdCall.bind(rtcManager, {
              callId: options.callId,
              sessionId: options.sessionId,
              token: options.token
            })).to.throw('No sdp provided');
            expect(rtcManager.holdCall.bind(rtcManager, {
              callId: options.callId,
              sessionId: options.sessionId,
              token: options.token,
              description : options.description
            })).to.throw('No success callback provided');
            expect(rtcManager.holdCall.bind(rtcManager, {
              callId: options.callId,
              sessionId: options.sessionId,
              token: options.token,
              description : options.description,
              onSuccess: options.onSuccess
            })).to.throw('No error callback provided');
            expect(rtcManager.holdCall.bind(rtcManager, {
              callId: options.callId,
              sessionId: options.sessionId,
              token: options.token,
              description : options.description,
              onSuccess: options.onSuccess,
              onError: options.onError
            })).not.to.throw(Error);
          });
          it('should call resourceManager.doOperation for holdcall', function () {
            rtcManager.holdCall(options);

            expect(doOperationStub.called).to.equal(true);
            expect(doOperationStub.getCall(0).args[0]).to.equal('modifyCall');
            expect(doOperationStub.getCall(0).args[1]).to.be.an('object');
            expect(doOperationStub.getCall(0).args[1].params).to.be.an('object');
            expect(doOperationStub.getCall(0).args[1].params.url).to.be.an('array');
            expect(doOperationStub.getCall(0).args[1].params.url[0]).to.equal(options.sessionId);
            expect(doOperationStub.getCall(0).args[1].params.url[1]).to.equal(options.callId);
            expect(doOperationStub.getCall(0).args[1].data.callsMediaModifications.sdp).to.equal(options.description.sdp);
            expect(doOperationStub.getCall(0).args[1].params.headers).to.be.an('object');
            expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + options.token);
          });

          describe('Success on `hold modifyCall`', function () {
            var response;

            it('should execute `onSuccess` callback on 204', function (done) {
              response = {getResponseStatus : function () { return 204; }};
              doOperationStub.restore();
              doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
                setTimeout(function () {
                  options.success(response);
                }, 0);
              });
              rtcManager.holdCall(options);
              setTimeout(function () {
                expect(onSuccessSpy.called).to.equal(true);
                done();
              }, 30);

            });

            it('should execute `onError` callback on not 204', function (done) {
              response = {getResponseStatus : function () { return 201; }};
              doOperationStub.restore();
              doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
                setTimeout(function () {
                  options.success(response);
                }, 0);
              });
              rtcManager.holdCall(options);
              setTimeout(function () {
                expect(onErrorSpy.called).to.equal(true);
                done();
              }, 30);

            });

          });

          describe('Error on doOperation', function () {
            var createAPIErrorCodeStub;

            beforeEach(function () {
              doOperationStub.restore();

              doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
                setTimeout(function () {
                  options.error(error);
                }, 0);
              });

              createAPIErrorCodeStub = sinon.stub(ATT.Error, 'createAPIErrorCode', function () {
                return error;
              });
            });

            afterEach(function () {
              createAPIErrorCodeStub.restore();
            });

            it('should call createAPIErrorCode with operation `hold`', function (done) {
              rtcManager.holdCall(options);

              setTimeout(function () {
                try {
                  expect(createAPIErrorCodeStub.calledWith(error, 'ATT.rtc.Phone', 'hold', 'RTC')).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);
            });

            it('should call onError callback of holdCall with the error object', function (done) {
              rtcManager.holdCall(options);

              setTimeout(function () {
                try {
                  expect(onErrorSpy.calledWith(error)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);
            });

          });
        });
      });
    });
  });
});