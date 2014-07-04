/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, xdescribe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL, after*/

describe('RTC Manager', function () {
  'use strict';

  var factories,
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

    resourceManagerStub = {
      doOperation: function (operationName, options) {
        var response = {
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
        options.success(response);
      },
      getLogger : function () {
        return {
          logDebug : function () {},
          logInfo: function () {}
        };
      }
    };
    optionsForEM = {
      errorManager: {},
      resourceManager: resourceManagerStub
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

      rtcEvent = ATT.RTCEvent.getInstance();
      userMediaSvc = ATT.UserMediaService;
      peerConnSvc = ATT.PeerConnectionService;

      optionsForRTCM = {
        errorManager: ATT.Error,
        resourceManager: resourceManagerStub,
        rtcEvent: rtcEvent,
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
        doOperationSpy,
        setupStub,
        stopStub;

      before(function () {

        onSpy = sinon.spy(eventManager, 'on');

        setupStub = sinon.stub(eventManager, 'setup', function () {
          emitter.publish('listening');
        });

        stopStub = sinon.stub(eventManager, 'stop', function () {
          emitter.publish('stop-listening');
        });

        rtcManager = new ATT.private.RTCManager(optionsForRTCM);

        ATT.appConfig = {
          EventChannelConfig: {
            endpoint: 'endpoint',
            type: 'longpolling'
          }
        };
      });

      after(function () {
        onSpy.restore();
        setupStub.restore();
        stopStub.restore();
      });

      describe('On', function () {

        var onStub;

        before(function () {
          // change spy to stub
          onSpy.restore();
          onStub = sinon.stub(eventManager, 'on', function () {});
        });

        after(function () {
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

      describe('connectSession', function () {
        var onSessionConnectedSpy,
          onSessionReadySpy,
          optionsForConn;

        before(function () {
          onSessionConnectedSpy = sinon.spy();
          onSessionReadySpy = sinon.spy();

          optionsForConn = {
            token: '123',
            onSessionConnected: onSessionConnectedSpy,
            onSessionReady: onSessionReadySpy
          };

          rtcManager.connectSession(optionsForConn);
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
          })).to.not.throw(Error);
        });

        it('should call doOperation on the resourceManager with `createWebRTCSession`', function () {
          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');

          rtcManager.connectSession({
            token: '123',
            onSessionConnected: function () {},
            onSessionReady: function () {}
          });

          expect(doOperationSpy.called).to.equal(true);
          expect(doOperationSpy.getCall(0).args[0]).to.equal('createWebRTCSession');

          doOperationSpy.restore();
        });

        describe('Success', function () {

          it('should execute the onSessionConnected callback with `sessionId` and `timeout`', function () {
            expect(onSessionConnectedSpy.calledWith(sessionInfo)).to.equal(true);
          });

          it('Should subscribe to event listening from the event manager', function () {
            expect(onSpy.calledWith('listening')).to.equal(true);
          });

          it('should call EventManager.setup with the session id', function () {
            expect(setupStub.called).to.equal(true);
          });

          it('should execute onSessionReady with data containing `sessionId` on receiving a `listening` event', function (done) {

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
      });

      describe('refreshSession', function () {

        it('should exist', function () {
          expect(rtcManager.refreshSession).to.be.a('function');
        });

        it('should call resourceManager.doOperation with `refreshWebRTCSession`', function () {

          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');

          rtcManager.refreshSession({
            token: 'token',
            sessionId: '1234',
            success: function () {},
            error: function () {}
          });

          expect(doOperationSpy.called).to.equal(true);
          expect(doOperationSpy.getCall(0).args[0]).to.equal('refreshWebRTCSession');

          doOperationSpy.restore();
        });

        xdescribe('Success', function () {
          it('should execute the `success` callback', function () {
            var onSuccessSpy = sinon.spy(),
              doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function (name, options) {
                var response = {
                  getResponseHeader : function (name) {
                    var header;
                    switch (name) {
                    case 'x-expires':
                      header = String(500); // seconds
                      break;
                    default:
                      header = String(500); // seconds
                      break;
                    }
                    return header;
                  }
                };
                options.success(response);
              });

            rtcManager.refreshSession({
              success: onSuccessSpy
            });

            expect(onSuccessSpy.called).to.equal(true);
            expect(onSuccessSpy.calledWith({
              timeout: 500
            })).to.equal(true);

            doOperationStub.restore();
          });
        });
      });

      describe('disconnectSession', function () {

        var optionsForDisconn,
          onSessionDisconnectedSpy;

        before(function () {
          onSessionDisconnectedSpy = sinon.spy();

          optionsForDisconn = {
            sessionId: 'sessionid',
            token: '123',
            onSessionDisconnected: onSessionDisconnectedSpy
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

          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');

          rtcManager.disconnectSession(optionsForDisconn);

          expect(stopStub.calledBefore(doOperationSpy)).to.equal(true);

          doOperationSpy.restore();
        });

        it('should call doOperation on the resourceManager with `deleteWebRTCSession`', function () {
          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');

          rtcManager.disconnectSession(optionsForDisconn);

          expect(doOperationSpy.calledWith('deleteWebRTCSession')).to.equal(true);

          doOperationSpy.restore();
        });

        describe('Success', function () {

          it('should execute the onSessionDisconnected callback', function () {
            rtcManager.disconnectSession(optionsForDisconn);

            expect(onSessionDisconnectedSpy.called).to.equal(true);
          });

        });
      });

      describe('connectCall', function () {
        var options,
          getUserMediaStub,
          initPeerConnectionStub,
          onCallConnectingSpy,
          setRemoteSdpStub,
          remoteSdp,
          eventManagerPublishSpy;

        before(function () {
          onCallConnectingSpy = sinon.spy();

          options = {
            peer: '123',
            mediaType: 'xyz',
            onCallConnecting: onCallConnectingSpy
          };

          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
            options.onUserMedia({});
            options.onMediaEstablished();
          });

          remoteSdp = 'abc';

          initPeerConnectionStub = sinon.stub(ATT.PeerConnectionService, 'initiatePeerConnection', function (options) {
            options.onPeerConnectionInitiated();
            emitter.publish('remote-sdp', remoteSdp);
          });

          setRemoteSdpStub = sinon.stub(ATT.PeerConnectionService, 'setTheRemoteDescription', function (options) {
            options.success();
          });

          eventManagerPublishSpy = sinon.spy(eventManager, 'publish');

          rtcManager.connectCall(options);
        });

        after(function () {
          getUserMediaStub.restore();
          initPeerConnectionStub.restore();
          setRemoteSdpStub.restore();
          eventManagerPublishSpy.restore();
        });

        it('should exist', function () {
          expect(rtcManager.connectCall).to.be.a('function');
        });

        it('should throw an error if invalid options', function () {
          expect(rtcManager.connectCall.bind(rtcManager)).to.throw('No options defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {})).to.throw('No peer defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            peer: '123'
          })).to.throw('No MediaType defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            mediaType: 'audio'
          })).to.throw('No peer defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            mediaType: 'audio',
            peer: '1234'
          })).to.throw('Callback `onCallConnecting` not defined.');
          expect(rtcManager.connectCall.bind(rtcManager, {
            peer: '123',
            mediaType: 'video',
            onCallConnecting: function () {}
          })).to.not.throw(Error);
        });

        it('should call getUserMedia on user media service', function () {
          expect(getUserMediaStub.called).to.equal(true);
        });

        describe('success get user media', function () {

          it('should register for `remote-sdp` event on eventManager', function () {
            expect(onSpy.calledWith('remote-sdp')).to.equal(true);
          });

          it('should invoke initiatePeerConnection', function () {
            expect(initPeerConnectionStub.called).to.equal(true);
          });

          describe('success initiatePeerConnection', function () {

            it('should invoke callback `onCallConnecting`', function () {
              expect(onCallConnectingSpy.called).to.equal(true);
            });
          });

          describe('success event', function () {

            it('should call setTheRemoteDescription on the peer connection on getting `remote-sdp` event from eventManager', function (done) {
              setTimeout(function () {
                try {
                  expect(setRemoteSdpStub.called).to.equal(true);
                  expect(setRemoteSdpStub.getCall(0).args[0].remoteSdp).to.equal(remoteSdp);
                  expect(setRemoteSdpStub.getCall(0).args[0].type).to.equal('answer');
                  done();
                } catch (e) {
                  done(e);
                }
              }, 100);
            });

            it('should execute eventManager.publish on successfully setting the remote description', function () {
              expect(eventManagerPublishSpy.calledWith('remote-sdp-set')).to.equal(true);
            });

            it('should execute eventManager.publish on successfully establishing the media', function () {
              expect(eventManagerPublishSpy.calledWith('media-established')).to.equal(true);
            });
          });

        });

      });
    });
  });

});