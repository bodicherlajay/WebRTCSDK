/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call', function () {

  'use strict';

  var factories,
    apiConfig,
    connectOptions,
    optionsOutgoing,
    optionsIncoming,
    optionsIncomingConf,
    optionsOutgoingConf,
    optionsforRTCM,
    emitterEM,
    eventManager,
    rtcMgr,
    peerConnection,
    createEventEmitterStub,
    createEventManagerStub,
    getRTCManagerStub,
    rtcpcStub,
    createPeerConnectionStub,
    resourceManager,
    doOperationStub,
    createResourceManagerStub,
    localVideo,
    remoteVideo,
    localSdp,
    remoteSdp,
    connectOptsConf,
    rtcPC;

  before(function () {

    rtcPC = {
      setLocalDescription: function () { return; },
      onicecandidate: null,
      localDescription : '12X3',
      setRemoteDescription : function () { return; },
      addStream : function () {return; },
      onaddstream : function () {return;},
      createOffer : function () {return }
    };

    apiConfig = ATT.private.config.api;
    factories = ATT.private.factories;

    remoteVideo = document.createElement('video');
    localVideo = document.createElement('video');

    connectOptions = {
      localMedia: localVideo,
      remoteMedia: remoteVideo
    };

    connectOptsConf = {
      localSdp: 'abc',
      mediaType: 'video'
    };

    optionsOutgoing = {
      breed: 'call',
      peer: '12345',
      mediaType: 'audio',
      type: ATT.CallTypes.OUTGOING,
      sessionInfo : {sessionId : '12345', token : '123'}
    };

    optionsIncoming = {
      breed: 'call',
      peer: '12345',
      mediaType: 'audio',
      type: ATT.CallTypes.INCOMING,
      remoteSdp: 'abc',
      sessionInfo : {sessionId : '12345'}
    };

    optionsIncomingConf = {
      breed: 'conference',
      peer: '12345',
      mediaType: 'video',
      type: ATT.CallTypes.INCOMING,
      remoteSdp: 'abc'
    };

    optionsOutgoingConf = {
      breed: 'conference',
      peer: '12345',
      mediaType: 'video',
      type: ATT.CallTypes.OUTGOING
    };

    optionsforRTCM = {
      resourceManager: resourceManager,
      userMediaSvc: ATT.UserMediaService,
      peerConnSvc: ATT.PeerConnectionService
    };

    localSdp = 'localSdp';
    remoteSdp = 'remoteSdp';
  });

  beforeEach(function () {
    resourceManager = factories.createResourceManager(apiConfig);

    doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) { // never hit the network
      options.success();
    });

    createResourceManagerStub = sinon.stub(factories, 'createResourceManager', function () {
      return resourceManager;
    });

    emitterEM = factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitterEM;
    });

    eventManager = factories.createEventManager({
      resourceManager: resourceManager,
      channelConfig: {
        endpoint: '/events',
        type: 'longpolling'
      }
    });

    createEventManagerStub = sinon.stub(factories, 'createEventManager', function () {
      return eventManager;
    });

    rtcMgr = new ATT.private.RTCManager(optionsforRTCM);

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return rtcMgr;
    });

    rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
      return rtcPC;
    });
    peerConnection = factories.createPeerConnection({
      stream : {},
      mediaType : 'video',
      onRemoteStream : function () {},
      onSuccess : function () {},
      onError : function () {}
    });

    createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function () {
      return peerConnection;
    });
  });

  afterEach(function () {
    rtcpcStub.restore();
    createResourceManagerStub.restore();
    doOperationStub.restore();
    createEventEmitterStub.restore();
    createEventManagerStub.restore();
    getRTCManagerStub.restore();
    createPeerConnectionStub.restore();
  });

  it('Should have a public constructor under ATT.rtc', function () {
    expect(ATT.rtc.Call).to.be.a('function');
  });

  describe('Constructor', function () {

    var call1,
      call2,
      onSpy;

    beforeEach(function () {
      onSpy = sinon.stub(rtcMgr, 'on');
    });

    afterEach(function () {
      onSpy.restore();
    });

    it('Should throw an error if invalid options', function () {
      var func = function (options) {
        return new ATT.rtc.Call(options);
      };
      expect(func).to.throw('No input provided');
      expect(func.bind(null, {})).to.throw('No input provided');
      expect(func.bind(null, { test: 'test' })).to.throw('No breed provided');
      expect(func.bind(null, {
        breed: 'call'
      })).to.throw('No peer provided');
      expect(func.bind(null, {
        breed: 'call',
        peer: '1234'
      })).to.throw('No type provided');
      expect(func.bind(null, {
        breed: 'call',
        peer: '1234',
        type: 'abc'
      })).to.throw('No mediaType provided');
      expect(func.bind(null, {
        breed: 'call',
        peer: '1234',
        type: 'abc',
        mediaType: 'audio'
      })).to.not.throw(Error);
    });

    it('Should create a call object with the options passed in', function () {
      var outgoingOptions = {
        breed: 'call',
        peer: '12345',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'},
        id: '1234'
      };

      call1 = new ATT.rtc.Call(outgoingOptions);

      expect(call1 instanceof ATT.rtc.Call).to.equal(true);
	    expect(call1.breed()).to.equal(outgoingOptions.breed);
      expect(call1.id()).to.equal(outgoingOptions.id);
      expect(call1.peer()).to.equal(outgoingOptions.peer);
      expect(call1.mediaType()).to.equal(outgoingOptions.mediaType);
      expect(call1.type()).to.equal(outgoingOptions.type);

      outgoingOptions.id = undefined;

      call2 = new ATT.rtc.Call(outgoingOptions);

      expect(call2).to.be.an('object');
      expect(call2.id()).to.equal(null);
	    expect(call2.breed()).to.equal(outgoingOptions.breed);
      expect(call2.peer()).to.equal(outgoingOptions.peer);
      expect(call2.mediaType()).to.equal(outgoingOptions.mediaType);
      expect(call2.type()).to.equal(outgoingOptions.type);
    });

    it('should create an instance of event emitter', function () {
      expect(createEventEmitterStub.called).to.equal(true);
    });

    it('should get an instance of RTCManager', function () {
      call1 = new ATT.rtc.Call(optionsOutgoing);

      expect(getRTCManagerStub.called).to.equal(true);
    });

    it('should register for `call-disconnected` event on `RTCManager`', function () {
      call1 = new ATT.rtc.Call(optionsOutgoing);

      expect(onSpy.calledWith('call-disconnected')).to.equal(true);
    });

  });

  describe('Methods', function () {

    var outgoingCall,
      incomingCall,
      incomingConf,
      outgoingConf,
      onConnectingSpy,
      onConnectedSpy,
      onMutedSpy,
      onUnmutedSpy,
      onDisconnectingSpy,
      onDisconnectedSpy,
      onErrorHandlerSpy,
      error,
      errorData;

    beforeEach(function () {

      error = 'Test Error';
      errorData = {
        error: error
      };

      outgoingCall = new ATT.rtc.Call(optionsOutgoing);
      incomingCall = new ATT.rtc.Call(optionsIncoming);

      outgoingConf = new ATT.rtc.Call(optionsOutgoingConf);
      incomingConf = new ATT.rtc.Call(optionsIncomingConf);

      incomingCall.setRemoteSdp(optionsIncoming.remoteSdp);

      onConnectingSpy = sinon.spy();
      onConnectedSpy = sinon.spy();
      onMutedSpy = sinon.spy();
      onUnmutedSpy = sinon.spy();
      onDisconnectingSpy = sinon.spy();
      onDisconnectedSpy = sinon.spy();
      onErrorHandlerSpy = sinon.spy();

      outgoingCall.on('connecting', onConnectingSpy);
      outgoingCall.on('connected', onConnectedSpy);
      outgoingCall.on('muted', onMutedSpy);
      outgoingCall.on('unmuted', onUnmutedSpy);
      outgoingCall.on('disconnecting', onDisconnectingSpy);
      outgoingCall.on('disconnected', onDisconnectedSpy);
      outgoingCall.on('error', onErrorHandlerSpy);
    });

    describe('on', function () {

      it('Should exist', function () {
        expect(outgoingCall.on).to.be.a('function');
      });

      it('Should fail if event is not recognized', function () {
        expect(outgoingCall.on.bind(outgoingCall, 'unknown')).to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy(),
          subscribeSpy = sinon.spy(emitterEM, 'subscribe'),
          unsubscribeSpy = sinon.spy(emitterEM, 'unsubscribe');

        expect(outgoingCall.on.bind(outgoingCall, 'connecting', fn)).to.not.throw(Error);

        expect(unsubscribeSpy.called).to.equal(true);
        expect(subscribeSpy.called).to.equal(true);

        unsubscribeSpy.restore();
        subscribeSpy.restore();
      });
    });

    describe('addStream', function () {

      it('should exist', function () {
        expect(incomingConf.addStream).to.be.a('function');
      });

      it('should set the localStream on call', function () {
        var localStream = 'localStream';

        incomingConf.addStream(localStream);

        expect(incomingConf.localStream()).to.equal(localStream);
      });
    });

    describe('connect', function () {

      var connectCallStub,
        onStub;

      beforeEach(function () {

        connectCallStub = sinon.stub(rtcMgr, 'connectCall');

        onStub = sinon.stub(rtcMgr, 'on');
      });

      afterEach(function () {
        connectCallStub.restore();
        onStub.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.connect).to.be.a('function');
      });

      it('should set localMedia & remoteMedia if passed in', function () {
        outgoingCall.connect(connectOptions);

        expect(outgoingCall.localMedia()).to.equal(connectOptions.localMedia);
        expect(outgoingCall.remoteMedia()).to.equal(connectOptions.remoteMedia);
      });

      it('should register for event `media-modifications` from RTCManager', function () {
        incomingCall.connect(connectOptions);
        expect(onStub.calledWith('media-modifications')).to.equal(true);
      });

      it('should register for event `media-mod-terminations` from RTCManager', function () {
        incomingCall.connect(connectOptions);

        expect(onStub.calledWith('media-mod-terminations')).to.equal(true);
      });

      it('should register for event `call-connected` from RTCManager', function () {
        outgoingCall.connect(connectOptions);

        expect(onStub.calledWith('call-connected')).to.equal(true);
        expect(onStub.getCall(0).args[1]).to.be.a('function');
      });

      it('should register for `playing` event from remote video element', function () {
        var addEventListenerStub = sinon.stub(connectOptions.remoteMedia, 'addEventListener');

        outgoingCall.connect(connectOptions);

        expect(addEventListenerStub.calledWith('playing')).to.equal(true);

        addEventListenerStub.restore();
      });

      describe('Call', function () {

        it('should execute RTCManager.connectCall for outgoing calls', function () {
          outgoingCall.connect(connectOptions);

          expect(connectCallStub.called).to.equal(true);
        });

        it('should execute RTCManager.connectCall with `remoteDescription` for incoming calls', function () {
          incomingCall.connect(connectOptions);

          expect(connectCallStub.getCall(0).args[0].remoteDescription).to.equal(optionsIncoming.remoteSdp);
        });

        it('should not execute RTCManager.connectCall for breed `conference`', function () {
          incomingConf.connect(connectOptions);

          expect(connectCallStub.called).to.equal(false);
        });

        describe('Callbacks on connectCall', function () {

          describe('onCallConnecting', function () {
            var callInfo = {
              callId: '1234',
              localSdp: 'mysdp',
              xState: 'connecting'
            };

            beforeEach(function () {
              connectCallStub.restore();

              connectCallStub = sinon.stub(rtcMgr, 'connectCall', function (options) {
                setTimeout(function () {
                  options.onCallConnecting(callInfo);
                }, 0);
              });
            });

            afterEach(function () {
              connectCallStub.restore();
            });

            it('should set the Id for outgoing calls', function (done) {
              outgoingCall.connect(connectOptions);

              setTimeout(function () {
                try {
                  expect(outgoingCall.id()).to.equal(callInfo.callId);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);
            });

            it('should set the state for incoming calls', function (done) {
              incomingCall.connect(connectOptions);

              setTimeout(function () {
                try {
                  expect(incomingCall.getState()).to.equal('connecting');
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);
            });

            it('should set the newly created LocalSdp on the call', function (done) {
              outgoingCall.connect(connectOptions);

              setTimeout(function () {
                try {
                  expect(outgoingCall.localSdp()).to.equal(callInfo.localSdp);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);
            });

            it('Should publish `error` with error data if there is an error in operation', function (done) {
              var setIdStub = sinon.stub(outgoingCall, 'setId', function () {
                throw error;
              });

              outgoingCall.connect(connectOptions);

              setTimeout(function () {
                try {
                  expect(onErrorHandlerSpy.called).to.equal(true);
                  expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                } finally {
                  setIdStub.restore();
                }
              }, 100);

            });
          });

          describe('onError', function () {

            beforeEach(function () {
              connectCallStub.restore();

              connectCallStub = sinon.stub(rtcMgr, 'connectCall', function (options) {
                setTimeout(function () {
                  options.onError(error);
                }, 0);
              });
            });

            afterEach(function () {
              connectCallStub.restore();
            });

            it('Should publish `error` with error data', function (done) {

              outgoingCall.connect(connectOptions);

              setTimeout(function () {
                try {
                  expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);

            });
          });

        });

        describe('Error Handling', function () {

          it('should publish `error` with error data if there is an error in any operation', function (done) {
            connectCallStub.restore();

            connectCallStub = sinon.stub(rtcMgr, 'connectCall', function () {
              throw error;
            });

            outgoingCall.connect(connectOptions);

            setTimeout(function () {
              expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
              done();
            }, 10);
          });

        });
      });
    });

    describe('mute/unmute', function () {

      var muteCallStub,
        unmuteCallStub;

      beforeEach(function () {

        muteCallStub = sinon.stub(rtcMgr, 'muteCall', function (options) {
          options.onSuccess();
        });

        unmuteCallStub = sinon.stub(rtcMgr, 'unmuteCall', function (options) {
          options.onSuccess();
        });
      });

      afterEach(function () {
        unmuteCallStub.restore();
        muteCallStub.restore();
      });

      describe('mute', function () {
        it('should exist', function () {
          expect(outgoingCall.mute).to.be.a('function');
        });

        it('should execute RTCManager.muteCall', function () {
          outgoingCall.mute();

          expect(muteCallStub.called).to.equal(true);
          expect(muteCallStub.getCall(0).args[0]).to.be.an('object');
        });

        describe('success on RTCManager.muteCall', function () {

          it('should execute call.setState with `muted` state', function () {
            outgoingCall.mute();

            expect(outgoingCall.getState()).to.equal('muted');

          });
        });
      });

      describe('unmute', function () {
        it('should exist', function () {
          expect(outgoingCall.unmute).to.be.a('function');
        });

        it('should execute RTCManager.unmuteCall', function () {
          outgoingCall.unmute();

          expect(unmuteCallStub.called).to.equal(true);
          expect(unmuteCallStub.getCall(0).args[0]).to.be.an('object');
        });

        describe('success on RTCManager.unmuteCall', function () {

          it('should execute call.setState with `unmuted` state', function () {

            outgoingCall.unmute();

            expect(outgoingCall.getState()).to.equal('unmuted');
          });

        });
      });
    });

    describe('hold/resume', function () {

      var holdCallStub,
        resumeCallStub;

      beforeEach(function () {

        holdCallStub = sinon.stub(rtcMgr, 'holdCall', function (options) {
          options.onSuccess('localSdpForHoldRequest');
        });
        resumeCallStub = sinon.stub(rtcMgr, 'resumeCall', function (options) {
          options.onSuccess('localSdpForResumeRequest');
        });
      });

      afterEach(function () {
        holdCallStub.restore();
        resumeCallStub.restore();
      });

      describe('hold', function () {
        it('should exist', function () {
          expect(outgoingCall.hold).to.be.a('function');
        });

        it('should execute RTCManager.holdCall', function () {
          outgoingCall.hold();
          expect(holdCallStub.called).to.equal(true);
        });

        it('should set localSdp on success', function () {
          outgoingCall.hold();
          expect(outgoingCall.localSdp()).to.equal('localSdpForHoldRequest');
        });
      });

      describe('resume', function () {

        it('should exist', function () {
          expect(outgoingCall.resume).to.be.a('function');
        });

        it('should execute RTCManager.resumeCall', function () {
          outgoingCall.resume();
          expect(resumeCallStub.called).to.equal(true);
        });

        it('should set localSdp on success', function () {
          incomingCall.resume();
          expect(incomingCall.localSdp()).to.equal('localSdpForResumeRequest');
        });
      });
    });

    describe('disconnect', function () {

      var onSpy;

      beforeEach(function () {
        onSpy = sinon.spy(rtcMgr, 'on');
      });

      afterEach(function () {
        onSpy.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.disconnect).to.be.a('function');
      });

      it('Should execute Call.setState with `disconnecting` state', function () {

        outgoingCall.disconnect();

        expect(outgoingCall.getState()).to.equal('disconnecting');

      });

      describe('Cancel Call [call.remoteSdp === null]', function () {

        it('should call `rtcManager.cancelCall` if the remoteDescription is null', function () {
          var cancelCallStub = sinon.stub(rtcMgr, 'cancelCall');

          outgoingCall.disconnect();

          expect(cancelCallStub.called).to.equal(true);
          expect(cancelCallStub.getCall(0).args[0]).to.be.an('object');
          expect(cancelCallStub.getCall(0).args[0].callId).not.to.be.an('undefined');
          expect(cancelCallStub.getCall(0).args[0].sessionId).not.to.be.an('undefined');
          expect(cancelCallStub.getCall(0).args[0].token).not.to.be.an('undefined');
          expect(cancelCallStub.getCall(0).args[0].onSuccess).to.be.a('function');
          expect(cancelCallStub.getCall(0).args[0].onError).to.be.a('function');

          cancelCallStub.restore();
        });

        describe('Success on `rtcManager.cancelCall`', function () {
          var cancelCallStub;

          beforeEach(function () {
            outgoingCall.setId(null);
            cancelCallStub = sinon.stub(rtcMgr, 'cancelCall', function (options) {
              options.onSuccess();
            });

          });

          afterEach(function () {
            cancelCallStub.restore();
          });

          it('should call `rtcManager.resetPeerConnection`', function () {
            var resetStub = sinon.spy(rtcMgr, 'resetPeerConnection');

            outgoingCall.disconnect();

            expect(resetStub.calledOnce).to.equal(true);

            resetStub.restore();
          });
        });
      });

      describe('Disconnect Call [call.remoteSdp !== null] && [call.id !== null]', function () {
        it('should call rtcManager.disconnectCall', function () {
          var disconnectCallStub = sinon.stub(rtcMgr, 'disconnectCall');

          // for this test we need that call to have a valid remoteDescription, otherwise
          // it will call `rtcManager.cancelCall`
          outgoingCall.setRemoteSdp('abcdefg');
          outgoingCall.setId('1234');
          outgoingCall.disconnect();

          expect(disconnectCallStub.called).to.equal(true);
          expect(disconnectCallStub.getCall(0).args[0].callId).to.equal(outgoingCall.id());
          expect(disconnectCallStub.getCall(0).args[0].breed).to.equal(outgoingCall.breed());
          expect(disconnectCallStub.getCall(0).args[0].sessionId).not.to.be.a('undefined');
          expect(disconnectCallStub.getCall(0).args[0].token).not.to.be.a('undefined');
          expect(disconnectCallStub.getCall(0).args[0].onSuccess).to.be.a('function');
          expect(disconnectCallStub.getCall(0).args[0].onError).to.be.a('function');

          disconnectCallStub.restore();
        });
      });
    });

    describe('reject', function () {
      var onSpy;

      beforeEach(function () {
        onSpy = sinon.spy(rtcMgr, "on");
        outgoingCall.setId('123');
      });

      afterEach(function () {
        onSpy.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.reject).to.be.a('function');
      });

      it('should call rtcManager.rejectCall', function () {
        var args,
          rejectCallStub;

        rejectCallStub = sinon.stub(rtcMgr, 'rejectCall');

        outgoingCall.reject();

        expect(rejectCallStub.called).to.equal(true);
        args = rejectCallStub.getCall(0).args[0];
        expect(args.sessionId).to.equal(outgoingCall.sessionInfo().sessionId);
        expect(args.token).to.equal(outgoingCall.sessionInfo().token);
        expect(args.callId).to.equal(outgoingCall.id());
        expect(args.onSuccess).to.be.a('function');
        expect(args.breed).to.equal(outgoingCall.breed());
        expect(args.onError).to.be.a('function');

        rejectCallStub.restore();
      });

      describe('Success on `rejectCall`', function () {

        it('should call `rtcManager.off` to unsubscribe the current call from `call-disconnected` event', function () {

          var offSpy,
            rejectCallStub = sinon.stub(rtcMgr, 'rejectCall', function (options) {
              options.onSuccess();
            });

          offSpy = sinon.spy(rtcMgr, 'off');

          outgoingCall.reject();

          expect(offSpy.called).to.equal(true);

          offSpy.restore();
          rejectCallStub.restore();
        });
      });

      describe('Events for reject', function () {
        describe('call-disconnected', function () {
          var onDisconnectedSpy,
            rejectCallStub;

          beforeEach(function () {
            rejectCallStub = sinon.stub(rtcMgr, 'rejectCall');
            incomingCall.reject();
          });

          afterEach(function () {
            rejectCallStub.restore();
          });

          it('should set the callId to null when rtcManager publishes `call-disconnected` event', function (done) {

            incomingCall.setId('notNull');

            emitterEM.publish('call-disconnected');

            setTimeout(function () {
              try {
                expect(incomingCall.id()).to.equal(null);
                done();
              } catch (e) {
                done(e);
              }
            }, 30);
          });

          it('should publish `disconnected` with data when rtcManager publishes `call-disconnected`', function (done) {

            var data = {
              reason: 'nothing'
            };
            onDisconnectedSpy = sinon.spy();
            incomingCall.on('disconnected', onDisconnectedSpy);

            emitterEM.publish('call-disconnected', data);

            setTimeout(function () {
              try {
                expect(onDisconnectedSpy.calledWith(data)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 30);
          });

          it('should execute rtcMgr.resetPeerConnection', function (done) {
            var resetPeerConnectionStub = sinon.stub(rtcMgr, 'resetPeerConnection');

            emitterEM.publish('call-disconnected');

            setTimeout(function () {
              try {
                expect(resetPeerConnectionStub.called).to.equal(true);
                resetPeerConnectionStub.restore();
                done();
              } catch (e) {
                resetPeerConnectionStub.restore();
                done(e);
              }
            }, 20);
          });

          it('should de-register from the `call-disconnected` event from `rtcManager`', function (done) {
            var offSpy = sinon.spy(rtcMgr, 'off');

            emitterEM.publish('call-disconnected', {
              reason: 'Call rejected'
            });

            setTimeout(function () {
              expect(offSpy.called).to.equal(true);
              offSpy.restore();
              done();
            }, 10);
          });
        });
      });
    });

    describe('getState', function () {

      it('should exist', function () {
        expect(outgoingCall.getState).to.be.a('function');
      });

      it('should return the current state of the call', function () {
        expect(outgoingCall.getState()).to.equal('created');
      });
    });

    describe('setState', function () {
      it('should exist', function () {
        expect(outgoingCall.setState).to.be.a('function');
      });

      it('should  set the call state', function () {
        outgoingCall.setState('abc');
        expect(outgoingCall.getState()).to.equal('abc');
      });

      describe('connecting', function () {
        it('should trigger the `connecting` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.on('connecting', onEventHandlerSpy);
          outgoingCall.setState('connecting');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });
      });

      describe('connected', function () {
        it('should trigger the `connected` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.setRemoteSdp('abc');

          outgoingCall.on('connected', onEventHandlerSpy);
          outgoingCall.setState('connected');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });
      });

      describe('mute/unmute', function () {
        it('should trigger the `muted` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.setRemoteSdp('abc');

          outgoingCall.on('muted', onEventHandlerSpy);
          outgoingCall.setState('muted');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });

        it('should trigger the `unmuted` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.setRemoteSdp('abc');

          outgoingCall.on('unmuted', onEventHandlerSpy);
          outgoingCall.setState('unmuted');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });
      });

      describe('media-established', function () {
        it('should trigger the `media-established` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.setRemoteSdp('abc');

          outgoingCall.on('media-established', onEventHandlerSpy);
          outgoingCall.setState('media-established');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });
      });

      describe('held/resumed', function () {
        it('should trigger the `held` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.setRemoteSdp('abc');

          outgoingCall.on('held', onEventHandlerSpy);
          outgoingCall.setState('held');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });

        it('should trigger the `resumed` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.setRemoteSdp('abc');

          outgoingCall.on('resumed', onEventHandlerSpy);
          outgoingCall.setState('resumed');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });
      });

      describe('disconnecting', function () {
        it('should trigger the `disconnecting` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.setRemoteSdp('abc');

          outgoingCall.on('disconnecting', onEventHandlerSpy);
          outgoingCall.setState('disconnecting');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });
      });

      describe('disconnected', function () {
        it('should trigger the `disconnected` event with relevant data', function (done) {
          var onEventHandlerSpy = sinon.spy();

          outgoingCall.setRemoteSdp('abc');

          outgoingCall.on('disconnected', onEventHandlerSpy);
          outgoingCall.setState('disconnected');

          setTimeout(function () {
            expect(onEventHandlerSpy.called).to.equal(true);
            expect(onEventHandlerSpy.getCall(0).args[0]).to.be.an('object');
            expect(onEventHandlerSpy.getCall(0).args[0].to
              || onEventHandlerSpy.getCall(0).args[0].from).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].mediaType).to.be.a('string');
            expect(onEventHandlerSpy.getCall(0).args[0].codec).to.be.a('array');
            expect(onEventHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
            done();
          }, 10);
        });
      });

    });

    describe('setId', function () {

      var setStateStub;

      beforeEach(function () {
        setStateStub = sinon.stub(outgoingCall, 'setState');
      });

      afterEach(function () {
        setStateStub.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.setId).to.be.a('function');
      });

      it('should set the newly created call id on the call', function () {
        var callId = '12345';

        outgoingCall.setId(callId);

        expect(outgoingCall.id()).to.equal(callId);
      });

      it('Should execute Call.setState with `connecting` state if call id is not null', function () {
        var callId = '12345';

        outgoingCall.setId(callId);

        expect(outgoingCall.getState()).to.equal('connecting');
      });

      it('Should execute Call.setState with `disconnected` state if call id is null', function () {
        outgoingCall.setId(null);

        expect(outgoingCall.getState()).to.equal('disconnected');
      });
    });

    describe('remoteSdp', function () {
      it('should exist', function () {
        expect(outgoingCall.remoteSdp).to.be.a('function');
      });

      it('should return the current `remoteSdp`', function () {
        // before being connected
        expect(outgoingCall.remoteSdp()).to.equal(null);

        // after setting a new value
        var newSDP = 'sdf';
        outgoingCall.setRemoteSdp(newSDP);
        expect(outgoingCall.remoteSdp()).to.equal(newSDP);

      });

    });

    describe('setRemoteSdp', function () {

      it('should exist', function () {
        expect(outgoingCall.setRemoteSdp).to.be.a('function');
      });

      it('should set the remoteDescription', function () {
        var remoteSdp = 'abc';

        outgoingCall.setRemoteSdp(remoteSdp);

        expect(outgoingCall.remoteSdp()).to.equal(remoteSdp);
      });

      it('should set the codec', function () {
        var remoteSdp = 'abc',
          codec = ['a', 'b'],
          getCodecStub = sinon.stub(ATT.sdpFilter.getInstance(), 'getCodecfromSDP', function () {
            return codec;
          });

        outgoingCall.setRemoteSdp(remoteSdp);

        expect(outgoingCall.codec()).to.equal(codec);

        getCodecStub.restore();
      });
    });

  });

  describe('Events', function () {

    describe('Call', function () {

      var call,
        setRemoteSdpSpy,
        setStateStub,
        onConnectedHandlerSpy,
        connectCallStub;

      beforeEach(function () {

        call = new ATT.rtc.Call(optionsOutgoing);

        setRemoteSdpSpy = sinon.spy(call, 'setRemoteSdp');
        setStateStub = sinon.stub(call, 'setState');
        onConnectedHandlerSpy = sinon.spy();

        connectCallStub = sinon.stub(rtcMgr, 'connectCall');

        call.on('connected', onConnectedHandlerSpy);

        call.connect(connectOptions);
      });

      afterEach(function () {
        setRemoteSdpSpy.restore();
        setStateStub.restore();
        connectCallStub.restore();
      });

      describe('media-modifications', function () {

        var modificationsHold,
          modificationsResume,
          setMediaModificationsStub,
          disableMediaStreamStub,
          enableMediaStreamStub;

        beforeEach(function () {
          modificationsHold = {
            remoteSdp: 'abc recvonly',
            modificationId: '123'
          };
          modificationsResume = {
            remoteSdp: 'abc sendrecv',
            modificationId: '123'
          };

          setMediaModificationsStub = sinon.stub(rtcMgr, 'setMediaModifications');

          disableMediaStreamStub = sinon.stub(rtcMgr, 'disableMediaStream');
          enableMediaStreamStub = sinon.stub(rtcMgr, 'enableMediaStream');
        });

        afterEach(function () {
          setMediaModificationsStub.restore();
          disableMediaStreamStub.restore();
          enableMediaStreamStub.restore();
        });

        it('should execute `RTCManager.setModifications`', function (done) {
          emitterEM.publish('media-modifications', modificationsHold);

          setTimeout(function () {
            try {
              expect(setMediaModificationsStub.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        it('should execute setRemoteSdp', function (done) {
          emitterEM.publish('media-modifications', modificationsHold);

          setTimeout(function () {
            try {
              expect(setRemoteSdpSpy.calledWith(modificationsHold.remoteSdp)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        describe('Hold modification', function () {

          it('should execute setState with state `held` if the sdp contains `recvonly`', function (done) {
            emitterEM.publish('media-modifications', modificationsHold);

            setTimeout(function () {
              try {
                expect(setStateStub.calledWith('held')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          it('should execute rtcManager.disableMediaStream if the sdp contains `recvonly`', function (done) {
            emitterEM.publish('media-modifications', modificationsHold);

            setTimeout(function () {
              try {
                expect(disableMediaStreamStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });
        });

        describe('Resume modification', function () {

          var codec,
            getCodecStub;

          beforeEach(function () {
            codec = ['a', 'b'],
            getCodecStub = sinon.stub(ATT.sdpFilter.getInstance(), 'getCodecfromSDP', function () {
              return codec;
            });

            call.setRemoteSdp(modificationsHold.remoteSdp);
          });

          afterEach(function () {
            getCodecStub.restore();
          });

          it('should execute setState with `resumed` state if the new remoteDescription contains `sendrecv` '
            + '&& the current remoteDescription contains `recvonly`', function (done) {
            emitterEM.publish('media-modifications', modificationsResume);

            setTimeout(function () {
              try {
                expect(setStateStub.calledWith('resumed')).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });

          it('should execute rtcManager.enableMediaStream if the new remoteDescription contains `sendrecv`'
            + ' && the current remoteDescription contains `recvonly`', function (done) {
            emitterEM.publish('media-modifications', modificationsResume);

            setTimeout(function () {
              try {
                expect(enableMediaStreamStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });
        });

      });

      describe('media-mod-terminations', function () {

        var modificationsHold,
          modificationsResume,
          modificationsForInviteAccepted,
          modificationsForInviteRejected,
          setRemoteDescriptionStub,
          updateParticipantStub,
          disableMediaStreamStub,
          enableMediaStreamStub;

        beforeEach(function () {
          modificationsHold = {
            remoteSdp: 'abcsendonly',
            modificationId: '123',
            reason: 'success'
          };
          modificationsResume = {
            remoteSdp: 'abcsendrecv',
            modificationId: '12345',
            reason: 'success'
          };

          modificationsForInviteRejected = {
            type: 'conference',
            modificationId: 'abc321',
            reason: 'rejected'
          };

          setRemoteDescriptionStub = sinon.stub(rtcMgr, 'setRemoteDescription');

          disableMediaStreamStub = sinon.stub(rtcMgr, 'disableMediaStream');
          enableMediaStreamStub = sinon.stub(rtcMgr, 'enableMediaStream');

        });

        afterEach(function () {
          setRemoteDescriptionStub.restore();
          disableMediaStreamStub.restore();
          enableMediaStreamStub.restore();
        });

        it('should execute setRemoteSdp on getting a `media-mod-terminations` event from eventManager', function (done) {
          emitterEM.publish('media-mod-terminations', modificationsHold);

          setTimeout(function () {
            try {
              expect(call.remoteSdp()).to.equal(modificationsHold.remoteSdp);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        it('should call `RTCManager.setRemoteDescription` if there is a remoteDescription', function (done) {
          emitterEM.publish('media-mod-terminations', modificationsHold);

          setTimeout(function () {
            try {
              expect(setRemoteDescriptionStub.calledWith({
                remoteDescription: modificationsHold.remoteSdp,
                type: 'answer'
              })).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        describe('hold', function (done) {

          it('should execute setState with `held` state if the sdp contains `sendonly` && but does not contain `sendrecv`', function (done) {
            emitterEM.publish('media-mod-terminations', modificationsHold);

            setTimeout(function () {
              try {
                expect(setStateStub.calledWith('held')).to.equal(true);
                expect(disableMediaStreamStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });
        });

        describe('resume', function () {

          it('should execute setState with `resumed` state if the new remoteDescription contains `sendrecv`', function (done) {
            emitterEM.publish('media-mod-terminations', modificationsResume);

            setTimeout(function () {
              try {
                expect(setStateStub.calledWith('resumed')).to.equal(true);
                expect(enableMediaStreamStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 10);
          });
        });
      });

      describe('call-connected', function () {

        var setRemoteDescriptionStub,
          playStreamSpy,
          eventData;

        beforeEach(function () {
          eventData = {
            type: 'call',
            remoteSdp: 'abcdefg'
          };

          setRemoteDescriptionStub = sinon.stub(rtcMgr, 'setRemoteDescription');
          playStreamSpy = sinon.spy(rtcMgr, 'playStream');

        });

        afterEach(function () {
          playStreamSpy.restore();
          setRemoteDescriptionStub.restore();
        });

        it('Should execute Call.setState with `connected` state', function (done) {
          emitterEM.publish('call-connected', eventData);

          setTimeout(function () {
            try {
              expect(setStateStub.calledWith('connected')).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        it('should execute setRemoteSdp with remote sdp after setState', function (done) {
          emitterEM.publish('call-connected', eventData);

          setTimeout(function () {
            try {
              expect(setRemoteSdpSpy.calledWith(eventData.remoteSdp)).to.equal(true);
              expect(setRemoteSdpSpy.calledAfter(setStateStub)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        it('should execute RTCManager.setRemoteDescription', function (done) {
          emitterEM.publish('call-connected', eventData);

          setTimeout(function () {
            try {
              expect(setRemoteDescriptionStub.calledWith({
                type: 'answer',
                remoteDescription: eventData.remoteSdp
              })).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        it('should call `rtcManager.playStream`', function (done) {
          emitterEM.publish('call-connected', eventData);

          setTimeout(function () {
            try {
              expect(playStreamSpy.calledWith('remote')).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);

        });

      });

      describe('call-disconnected', function () {
        var setIdSpy,
          resetPeerConnectionStub;

        beforeEach(function () {
          setIdSpy = sinon.spy(call, 'setId');
          resetPeerConnectionStub = sinon.stub(rtcMgr, 'resetPeerConnection');
        });

        afterEach(function () {
          setIdSpy.restore();
          resetPeerConnectionStub();
        });

        it('should set the callId to null when rtcManager publishes `call-disconnected` event', function (done) {

          emitterEM.publish('call-disconnected');

          setTimeout(function () {
            try {
              expect(call.id()).to.equal(null);
              done();
            } catch (e) {
              done(e);
            }
          }, 30);
        });


        it('should publish `disconnected` with data on getting `call-disconnected` with no reason', function (done) {

          var data = {data : '123'},
            disconnectedSpy = sinon.spy();

          call.on('disconnected', disconnectedSpy);

          emitterEM.publish('call-disconnected', data); // no reason passed

          setTimeout(function () {
            expect(disconnectedSpy.called).to.equal(true);
            expect(disconnectedSpy.calledWith({data : '123'})).to.equal(true);
            done();
          }, 10);

        });

        it('should publish `rejected` on getting `call-disconnected` with reason: `Call rejected`', function (done) {

          var rejectedSpy = sinon.spy();

          call.on('rejected', rejectedSpy);

          emitterEM.publish('call-disconnected', {
            reason: 'Call rejected'
          });

          setTimeout(function () {
            expect(rejectedSpy.calledOnce).to.equal(true);
            done();
          }, 100);

        });

        it('should execute rtcMgr.resetPeerConnection', function (done) {
          emitterEM.publish('call-disconnected');

          setTimeout(function () {
            try {
              expect(resetPeerConnectionStub.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 20);
        });

      });
    });

    // TODO: Move this describe to `test.att.call.conference.js`
    // because conference has a different flow, for now hopefully
    describe('Conference', function () {

      var conference,
        setStateSpy;

      beforeEach(function () {
        conference = new ATT.rtc.Call(optionsIncomingConf);

        setStateSpy = sinon.spy(conference, 'setState');
        conference.connect();
      });

      afterEach(function () {
        setStateSpy.restore();
      });

      describe('call-connected', function () {

        var eventData,
          playStreamSpy;

        beforeEach(function () {
          eventData = {
            type: 'conference'
          };

          playStreamSpy = sinon.spy(rtcMgr, 'playStream');
        });

        afterEach(function () {
          playStreamSpy.restore();
        });

        it('Should execute Call.setState with `connected` state', function (done) {
          emitterEM.publish('call-connected', eventData);

          setTimeout(function () {
            try {
              expect(setStateSpy.calledWith('connected')).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        it('Should not execute rtcManager.playStream', function (done) {
          emitterEM.publish('call-connected', eventData);

          setTimeout(function () {
            try {
              expect(playStreamSpy.called).to.equal(false);
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
