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

          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');

          rtcManager.refreshSession({
            token: 'token',
            sessionId: '1234',
            success: function () {},
            error: function () {}
          });

          expect(doOperationSpy.called).to.equal(true);
          expect(doOperationSpy.getCall(0).args[0]).to.equal('refreshWebRTCSession');
          expect(doOperationSpy.getCall(0).args[1].params.url[0]).to.equal('1234');
          expect(doOperationSpy.getCall(0).args[1].params.headers.Authorization).to.equal('token');

          doOperationSpy.restore();
        });

        describe('Success', function () {
          it('should execute the `success` callback', function () {
            var timeout = 200,
              onSuccessSpy = sinon.spy(),
              doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function (name, options) {
                var response = {
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
                options.success(response);
              });

            rtcManager.refreshSession({
              token: '123',
              sessionId: '1234',
              success: onSuccessSpy,
              error: function () { return; }
            });

            expect(onSuccessSpy.called).to.equal(true);
            expect(onSuccessSpy.calledWith({
              timeout: (timeout * 1000).toString()
            })).to.equal(true);
            doOperationStub.restore();
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

          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');

          rtcManager.updateSessionE911Id({
            token: 'token',
            sessionId: '1234',
            e911Id: '1232',
            onSuccess : function () {},
            onError : function () {}
          });

          expect(doOperationSpy.called).to.equal(true);
          expect(doOperationSpy.getCall(0).args[0]).to.equal('refreshWebRTCSessionWithE911Id');
          expect(doOperationSpy.getCall(0).args[1].params.url[0]).to.equal('1234');
          expect(doOperationSpy.getCall(0).args[1].params.headers.Authorization).to.equal('token');
          expect(doOperationSpy.getCall(0).args[1].data.e911Association.e911Id).to.equal('1232');

          doOperationSpy.restore();
        });

        describe('Success', function () {
          it('should execute the `success` callback', function () {
            var  onSuccessSpy = sinon.spy(),
              doOperationStub = sinon.stub(resourceManagerStub, 'doOperation', function (name, options) {
                options.success();
              });

            rtcManager.updateSessionE911Id({
              token: 'token',
              sessionId: '1234',
              e911Id: '1232',
              onSuccess : onSuccessSpy,
              onError : function () {}
            });


            expect(onSuccessSpy.called).to.equal(true);
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
          remoteSdp;

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

          rtcManager.connectCall(options);
        });

        after(function () {
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
          })).to.not.throw(Error);
          expect(rtcManager.connectCall.bind(rtcManager, {
            callId: '123',
            mediaType: 'video',
            onCallConnecting: function () {}
          })).to.not.throw(Error);
        });

        it('should call getUserMedia on user media service', function () {
          expect(getUserMediaStub.called).to.equal(true);
        });

        describe('getUserMedia callbacks', function () {

          describe('onUserMedia', function () {

            it('should invoke initiatePeerConnection', function () {
              expect(initPeerConnectionStub.called).to.equal(true);
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
          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');

          rtcManager.disconnectCall({
            sessionInfo: {},
            callId: '1234'
          });

          expect(doOperationSpy.calledWith('endCall')).to.equal(true);

          doOperationSpy.restore();
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

      describe('holdCall', function () {
        var holdStreamStub,
          onSuccessSpy = sinon.spy();

        it('should exist', function () {
          expect(rtcManager.holdCall).to.be.a('function');
        });

        it('should call peer-connection.holdCall', function () {
          holdStreamStub = sinon.stub(ATT.PeerConnectionService, 'holdCall', function (options) {
            options.onHoldSuccess('localSdp');
          });
          rtcManager.holdCall({
            onSuccess: onSuccessSpy
          });

          expect(holdStreamStub.called).to.equal(true);
          holdStreamStub.restore();
        });

        it('should call the success callback passed in from rtcManager', function () {
          expect(onSuccessSpy.calledWith('localSdp')).to.equal(true);
        });
      });

      describe('resumeCall', function () {
        var resumeStreamStub,
          onSuccessSpy = sinon.spy();

        it('should exist', function () {
          expect(rtcManager.resumeCall).to.be.a('function');
        });

        it('should call peer-connection.holdCall', function () {
          resumeStreamStub = sinon.stub(ATT.PeerConnectionService, 'resumeCall', function (options) {
            options.onResumeSuccess('localSdp');
          });

          rtcManager.resumeCall({
            onSuccess: onSuccessSpy
          });

          expect(resumeStreamStub.called).to.equal(true);
          resumeStreamStub.restore();
        });
      });

      describe('rejectCall', function () {

        var doOperationSpyreject;


        it('should exist', function () {
          expect(rtcManager.reject).to.be.a('function');
        });

        it('should throw an error if `options` are invalid', function () {

          var options = {
            callId : '1234',
            sessionId : '1234',
            token : 'dsfgdsdf'
          };
          expect(rtcManager.reject.bind(rtcManager, undefined)).to.throw('Invalid options');
          expect(rtcManager.reject.bind(rtcManager, {
            callId : options.callId,
            sessionId : options.sessionId,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No token passed');
          expect(rtcManager.reject.bind(rtcManager, {
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No callId passed');
          expect(rtcManager.reject.bind(rtcManager, {
            callId : options.callId,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.throw('No session Id passed');

          expect(rtcManager.reject.bind(rtcManager, {
            callId : options.callId,
            sessionId : options.sessionId,
            token : options.token,
            onError : function () {}
          })).to.throw('No success callback passed');

          expect(rtcManager.reject.bind(rtcManager, {
            callId : options.callId,
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {}
          })).to.throw('No error callback passed');

          expect(rtcManager.reject.bind(rtcManager, {
            callId : options.callId,
            sessionId : options.sessionId,
            token : options.token,
            onSuccess : function () {},
            onError : function () {}
          })).to.not.throw('No token passed');
        });


        it('should call doOperation on the resourceManager with `rejectCall`', function () {
          doOperationSpyreject = sinon.spy(resourceManagerStub, 'doOperation', function () {});

          rtcManager.reject({
            callId : '1234',
            sessionId : '1234',
            token : 'dsfgdsdf',
            onSuccess : function () { },
            onError : function () {}
          });

          expect(doOperationSpyreject.calledWith('rejectCall')).to.equal(true);

          doOperationSpyreject.restore();
        });
      });

    });
  });
});