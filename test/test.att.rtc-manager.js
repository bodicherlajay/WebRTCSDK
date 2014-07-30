/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, xdescribe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL, after*/

describe('RTC Manager', function () {
  'use strict';

  var error,
    createWebRTCSessionResponse,
    factories,
    resourceManagerStub,
    createEventManagerStub,
    eventManager,
    optionsForEM,
    sessionInfo,
    emitter,
    createEventEmitterStub,
    timeout;

  before(function () {
    factories = ATT.private.factories;
    timeout = 1234;// time in seconds
    sessionInfo = {
      sessionId : '123',
      timeout: timeout * 1000 // milliseconds
    };

    error = {
      error: 'Test Error'
    };

    createWebRTCSessionResponse = {
      getResponseHeader : function (name) {
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

    resourceManagerStub = {
      doOperation: function (operationName, options) {
        options.success(createWebRTCSessionResponse);
      },
      getLogger : function () {
        return {
          logDebug : function () {},
          logInfo: function () {}
        };
      }
    };
    optionsForEM = {
      resourceManager: resourceManagerStub,
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
    var optionsForRTCM,
      rtcEvent,
      userMediaSvc,
      peerConnSvc;

    before(function () {

      userMediaSvc = ATT.UserMediaService;
      peerConnSvc = ATT.PeerConnectionService;

      optionsForRTCM = {
        resourceManager: resourceManagerStub,
        userMediaSvc: userMediaSvc,
        peerConnSvc: peerConnSvc
      };

    });

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

        doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function (operationName, options) {
          setTimeout(function () {
            options.success(createWebRTCSessionResponse);
          }, 0);
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

            it('should execute the onSessionConnected callback with `sessionId` and `timeout`', function (done) {
              rtcManager.connectSession(optionsForConn);

              setTimeout(function () {
                try {
                  expect(onSessionConnectedSpy.calledWith(sessionInfo)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 100);
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
              }, 100);
            });

            it('should call EventManager.setup with the session id', function (done) {
              rtcManager.connectSession(optionsForConn);

              setTimeout(function () {
                try {
                  expect(setupStub.called).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 100);

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
              }, 100);
            });

          });

          describe('error', function () {

            var createAPIErrorStub;

            beforeEach(function () {
              createAPIErrorStub = sinon.stub(ATT.Error, 'createAPIErrorCode');
              doOperationStub.restore();

              doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function (operationName, options) {
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
              }, 100);
            });

          });

        });

        describe('Error Handling', function () {

          beforeEach(function () {
            doOperationStub.restore();

            doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function (operationName, options) {
              setTimeout(function () {
                options.success(error);
              }, 0);
            });

          });

          it('[2004] should be published with error event if unexpected exception is thrown', function(done) {

            optionsForConn.onSessionConneceted = function () {
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
            }, 100);
          });

        });

      });

      describe('playStream', function () {
        it('should exist', function () {
          expect(rtcManager.playStream).to.be.a('function');
        });
      });

      describe('refreshSession', function () {

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

            doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function (name, options) {
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
            }, 100);

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

            doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function (name, options) {
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
            }, 100);

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

          doOperationStub.restore();

          doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function(operationName, options){
            setTimeout(function () {
              options.success();
            }, 0);
          });

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

            it('should execute the onSessionDisconnected callback', function (done) {
              rtcManager.disconnectSession(optionsForDisconn);

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

              doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function(operationName, options) {
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
              }, 100);
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
        it('should exist', function () {
          expect(rtcManager.connectConference).to.be.a('function');
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
            onParticipantPending: function () {},
            participant: '12345'
          });
          expect(doOperationStub.called).to.equal(true);
        });

        describe('Success on doOperation', function () {
          var onParticipantPendingSpy,
            response;

          beforeEach(function () {
            doOperationStub.restore();
            onParticipantPendingSpy = sinon.spy();
          });

          it('should call `options.onParticipantPending` if response.getResponseHeader() === `add-pending`', function () {

            // ==== Positive case
            response = {
              getResponseHeader: function (name) {
                return 'add-pending';
              }
            };

            doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function(operationName, options) {
              options.success(response);
            });

            rtcManager.addParticipant({
              sessionInfo: {},
              confId: '123',
              onParticipantPending: onParticipantPendingSpy,
              participant: '12345'
            });

            expect(onParticipantPendingSpy.called).to.equal(true);

            doOperationStub.restore();

            // ==== Negative case
            response = {
              getResponseHeader: function (name) {
                return 'add-not-pending';
              }
            };

            doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function(operationName, options) {
              options.success(response);
            });

            rtcManager.addParticipant({
              sessionInfo: {},
              confId: '123',
              onParticipantPending: onParticipantPendingSpy,
              participant: '12345'
            });

            // calledOnce, meaning only the positive case trigger a call
            expect(onParticipantPendingSpy.calledOnce).to.equal(true);

            doOperationStub.restore();
          });
        });

        describe('Error on doOperation', function () {
          var onErrorSpy,
            error,
            createAPIErrorCodeStub;

          beforeEach(function () {
            doOperationStub.restore();
            onErrorSpy = sinon.spy();
          });

          it('should call `options.onError` if rtcManager returns an error', function () {
            error = {
              message: 'error',
              HttpStatusCode: '400'
            };

            createAPIErrorCodeStub = sinon.stub(ATT.Error, 'createAPIErrorCode', function () {
              return error;
            });

            doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function(operationName, options) {
              options.error(error);
            });

            rtcManager.addParticipant({
              sessionInfo: {},
              confId: '123',
              onParticipantPending: function () { },
              onError: onErrorSpy,
              participant: '12345'
            });

            expect(onErrorSpy.calledWith(error)).to.equal(true);

            doOperationStub.restore();
          });
        });

        describe('Invalid parameters', function () {
          it('should throw an error if invalid `options` are passed', function () {
            expect(rtcManager.addParticipant.bind(rtcManager)).to.throw('No `options` passed');
            expect(rtcManager.addParticipant.bind(rtcManager, {
              confId: {},
              participant: '12345'
            })).to.throw('No `sessionInfo` passed');
            expect(rtcManager.addParticipant.bind(rtcManager, {
              sessionInfo: {},
              participant: '12345'
            })).to.throw('No `confId` passed');
            expect(rtcManager.addParticipant.bind(rtcManager, {
              sessionInfo: {},
              participant: '12345',
              confId: '1234'
            })).to.throw('No `onParticipantPending` callback passed');
            expect(rtcManager.addParticipant.bind(rtcManager, {
              sessionInfo: {},
              confId: '123',
              participant: '12345',
              onParticipantPending: function () {}
            })).to.not.throw(Error);
          });
        });
      });

      describe('cancelCall', function () {
        var cancelSdpOfferStub;

        beforeEach(function () {
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

        it('should throw an error if invalid `options` are passed', function () {
          expect(rtcManager.cancelCall.bind(rtcManager)).to.throw('No `options` passed');
          expect(rtcManager.cancelCall.bind(rtcManager, {})).to.throw('No `options` passed');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            test: 'test'
          })).to.throw('No `success` callback passed');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            success: function () {},
            callId: null
          })).to.throw('No `sessionInfo` passed');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            success: function () {},
            sessionInfo: {}
          })).to.throw('No `callId` passed');
          expect(rtcManager.cancelCall.bind(rtcManager, {
            success: function () { return; }
          })).to.not.throw('No `options.success` callback passed');
        });

        it('should call peerConnSvc.cancelSdpOffer if [null === options.callId', function () {

          rtcManager.cancelCall({
            sessionInfo: {},
            callId: '12345',
            success: function () {}
          });

          expect(cancelSdpOfferStub.called).to.equal(false);

          rtcManager.cancelCall({
            sessionInfo: {},
            callId: null,
            success: function () {}
          });

          expect(cancelSdpOfferStub.called).to.equal(true);
        });

        it('should call peerConnSvc.cancelSdpOffer with a success callback', function () {
          var onSuccessSpy = sinon.spy();

          rtcManager.cancelCall({
            sessionInfo: {},
            callId: null,
            success: onSuccessSpy
          });

          expect(cancelSdpOfferStub.called).to.equal(true);
          expect(cancelSdpOfferStub.getCall(0).args[0]).to.be.a('function');
        });

        describe('Success on `cancelSdpOffer`', function () {
          var cancelSdpOfferStub,
            onSuccessSpy;

          beforeEach(function () {
            onSuccessSpy = sinon.spy();

            rtcManager.cancelCall({
              sessionInfo: {},
              callId: null,
              success: onSuccessSpy
            });
          });

          it('should execute `success` callback', function () {
            expect(onSuccessSpy.called).to.equal(true);
          });
        });

        it('should call resourceManager.doOperation if [null !== options.callId', function () {
          rtcManager.cancelCall({
            sessionInfo: {},
            callId: '123456789',
            success: function () {}
          });
          expect(doOperationStub.calledWith('cancelCall')).to.equal(true);
        });
      });

      describe('disconnectCall', function () {
        it('should exist', function () {
          expect(rtcManager.disconnectCall).to.be.a('function');
        });

        it('should throw an error if invalid options', function () {
          expect(rtcManager.disconnectCall.bind(rtcManager)).to.throw('No options defined.');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            sessionInfo: {}
          })).to.throw('CallId not defined');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            callId: '1234'
          })).to.throw('sessionInfo not defined');
          expect(rtcManager.disconnectCall.bind(rtcManager, {
            sessionInfo: {},
            callId: '1234'
          })).to.not.throw(Error);
        });

        it('should call doOperation on the resourceManager with `endCall`', function () {

          rtcManager.disconnectCall({
            sessionInfo: {},
            callId: '1234'
          });

          expect(doOperationStub.calledWith('endCall')).to.equal(true);

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
              remoteSdp: 'abc',
              modificationId: '123'
            },
            setRemoteAndCreateAnswerStub = sinon.stub(peerConnSvc, 'setRemoteAndCreateAnswer', function () {});

          rtcManager.setMediaModifications(modifications);

          expect(setRemoteAndCreateAnswerStub.calledWith(modifications.remoteSdp, modifications.modificationId)).to.equal(true);

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
        })

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

        it('should exist', function () {
          expect(rtcManager.rejectCall).to.be.a('function');
        });

        it('should throw an error if `options` are invalid', function () {

          var options = {
            callId : '1234',
            sessionId : '1234',
            token : 'dsfgdsdf'
          };
          expect(rtcManager.rejectCall.bind(rtcManager, undefined)).to.throw('Invalid options');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            sessionId : options.sessionId,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No token passed');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No callId passed');
          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No session Id passed');

          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            sessionId : options.sessionId,
            token : options.token,
            onError : function () {}
          })).to.throw('No success callback passed');

          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {}
          })).to.throw('No error callback passed');

          expect(rtcManager.rejectCall.bind(rtcManager, {
            callId : options.callId,
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.not.throw('No token passed');
        });


        it('should call doOperation on the resourceManager with `rejectCall`', function () {

          rtcManager.rejectCall({
            callId : '1234',
            sessionId : '2345',
            token : 'dsfgdsdf',
            onSuccess : function () { },
            onError : function () {}
          });

          expect(doOperationStub.calledWith('rejectCall')).to.equal(true);
          expect(doOperationStub.getCall(0).args[0]).to.equal('rejectCall');
          expect(doOperationStub.getCall(0).args[1].params.url[0]).to.equal('2345');
          expect(doOperationStub.getCall(0).args[1].params.url[1]).to.equal('1234');
          expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer dsfgdsdf');

        });
      });

    });
  });
});