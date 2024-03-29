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
    optionsForRTCM,
    emitterEM,
    eventManager,
    rtcMgr,
    rtcMgrOnSpy,
    peerConnection,
    createEventEmitterStub,
    createEventManagerStub,
    getRTCManagerStub,
    rtcPCStub,
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
    ATT.private.pcv = 1;

    rtcPC = {
      setLocalDescription: function () { return; },
      onicecandidate: null,
      localDescription : '12X3',
      setRemoteDescription : function () { return; },
      addStream : function () { return; },
      onaddstream : function () { return; },
      createOffer : function () { return }
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
      id: 'callId',
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

    optionsForRTCM = {
      resourceManager: resourceManager,
      userMediaSvc: ATT.UserMediaService,
      peerConnSvc: ATT.PeerConnectionService
    };

    localSdp = 'localSdp';
    remoteSdp = 'remoteSdp';
  });

  after(function () {
    ATT.private.pcv = 2;
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

    createEventEmitterStub.restore();

    createEventManagerStub = sinon.stub(factories, 'createEventManager', function () {
      return eventManager;
    });

    rtcMgr = new ATT.private.RTCManager(optionsForRTCM);
    rtcMgrOnSpy = sinon.spy(rtcMgr, 'on');

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return rtcMgr;
    });

    rtcPCStub = sinon.stub(window, 'RTCPeerConnection', function () {
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
    rtcPCStub.restore();
    createResourceManagerStub.restore();
    doOperationStub.restore();
    createEventEmitterStub.restore();
    createEventManagerStub.restore();
    rtcMgrOnSpy.restore();
    getRTCManagerStub.restore();
    createPeerConnectionStub.restore();
  });

  it('Should have a public constructor under ATT.rtc', function () {
    expect(ATT.rtc.Call).to.be.a('function');
  });

  describe('Constructor', function () {

    var incomingCall,
      outgoingCall,
      incomingCallOpts,
      outgoingCallOpts;

    beforeEach(function () {
      incomingCallOpts = {
        breed: 'call',
        peer: '12345',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'},
        id: '1234'
      };

      outgoingCallOpts = {
        breed: 'call',
        peer: '12345',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'}
      };
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
      incomingCall = new ATT.rtc.Call(incomingCallOpts);

      expect(incomingCall instanceof ATT.rtc.Call).to.equal(true);
	    expect(incomingCall.breed()).to.equal(incomingCallOpts.breed);
      expect(incomingCall.id()).to.equal(incomingCallOpts.id);
      expect(incomingCall.peer()).to.equal(incomingCallOpts.peer);
      expect(incomingCall.mediaType()).to.equal(incomingCallOpts.mediaType);
      expect(incomingCall.type()).to.equal(incomingCallOpts.type);

      outgoingCall = new ATT.rtc.Call(outgoingCallOpts);

      expect(outgoingCall).to.be.an('object');
      expect(outgoingCall.id()).to.equal(null);
	    expect(outgoingCall.breed()).to.equal(outgoingCallOpts.breed);
      expect(outgoingCall.peer()).to.equal(outgoingCallOpts.peer);
      expect(outgoingCall.mediaType()).to.equal(outgoingCallOpts.mediaType);
      expect(outgoingCall.type()).to.equal(outgoingCallOpts.type);
    });

    it('should create an instance of event emitter', function () {
      incomingCall = new ATT.rtc.Call(incomingCallOpts);

      expect(createEventEmitterStub.called).to.equal(true);
    });

    it('should get an instance of RTCManager', function () {
      incomingCall = new ATT.rtc.Call(optionsOutgoing);

      expect(getRTCManagerStub.called).to.equal(true);
    });

    describe('Should register for events if id != null', function () {

      it('should register for event `session-open` from RTCManager', function () {
        incomingCall = new ATT.rtc.Call(incomingCallOpts);

        expect(rtcMgrOnSpy.calledWith('session-open:' + incomingCall.id())).to.equal(true);
        expect(rtcMgrOnSpy.getCall(0).args[1]).to.be.a('function');
      });

      it('should register for `session-terminated` event on `RTCManager`', function () {
        incomingCall = new ATT.rtc.Call(incomingCallOpts);

        expect(rtcMgrOnSpy.calledWith('session-terminated:' + incomingCall.id())).to.equal(true);
        expect(rtcMgrOnSpy.getCall(0).args[1]).to.be.a('function');
      });

      it('should register for `mod-received` event on `RTCManager`', function () {
        incomingCall = new ATT.rtc.Call(incomingCallOpts);

        expect(rtcMgrOnSpy.calledWith('mod-received:' + incomingCall.id())).to.equal(true);
        expect(rtcMgrOnSpy.getCall(0).args[1]).to.be.a('function');
      });

      it('should register for `mod-terminated` event on `RTCManager`', function () {
        incomingCall = new ATT.rtc.Call(incomingCallOpts);

        expect(rtcMgrOnSpy.calledWith('mod-terminated:' + incomingCall.id())).to.equal(true);
        expect(rtcMgrOnSpy.getCall(0).args[1]).to.be.a('function');
      });
    });

    describe('Should NOT register for events if id == null', function () {

      it('should NOT register for event `session-open` from RTCManager', function () {
        outgoingCall = new ATT.rtc.Call(outgoingCallOpts);

        expect(rtcMgrOnSpy.called).to.equal(false);
      });

    });
  });

  describe('Methods', function () {

    var emitterCall,
      outgoingCall,
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

      createEventEmitterStub.restore();

      emitterCall = factories.createEventEmitter();

      createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
        return emitterCall;
      });

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
          subscribeSpy = sinon.spy(emitterCall, 'subscribe'),
          unsubscribeSpy = sinon.spy(emitterCall, 'unsubscribe');

        expect(outgoingCall.on.bind(outgoingCall, 'connecting', fn)).to.not.throw(Error);

        expect(unsubscribeSpy.called).to.equal(true);
        expect(subscribeSpy.called).to.equal(true);

        unsubscribeSpy.restore();
        subscribeSpy.restore();
      });
    });

    describe('off', function () {

      it('should exist', function () {
        expect(outgoingCall.off).to.be.a('function');
      });

      it('Should unregister callback for passed in event', function () {
        var fn = sinon.spy(),
          unsubscribeSpy = sinon.spy(emitterCall, 'unsubscribe');

        outgoingCall.off('held', fn);

        expect(unsubscribeSpy.calledWith('held', fn)).to.equal(true);

        unsubscribeSpy.restore();
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

      var connectCallStub;

      beforeEach(function () {
        connectCallStub = sinon.stub(rtcMgr, 'connectCall');
      });

      afterEach(function () {
        connectCallStub.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.connect).to.be.a('function');
      });

      it('should set localMedia & remoteMedia if passed in', function () {
        outgoingCall.connect(connectOptions);

        expect(outgoingCall.localMedia()).to.equal(connectOptions.localMedia);
        expect(outgoingCall.remoteMedia()).to.equal(connectOptions.remoteMedia);
      });


      it('should register for `playing` event from remote video element', function () {
        var addEventListenerStub = sinon.stub(connectOptions.remoteMedia, 'addEventListener');

        outgoingCall.connect(connectOptions);

        expect(addEventListenerStub.calledWith('playing')).to.equal(true);

        addEventListenerStub.restore();
      });

      //TODO: need to remove PCV 1 related code
      xdescribe('Call', function () {

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
          expect(outgoingCall.localSdp).to.equal('localSdpForHoldRequest');
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
          expect(incomingCall.localSdp).to.equal('localSdpForResumeRequest');
        });
      });
    });

    describe('disconnect', function () {

      var responseData,
        connectConferenceStub,
        connectCallStub;

      beforeEach(function () {
        responseData = {
          id: '12345'
        };

        createPeerConnectionStub.restore();

        createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
          options.onSuccess();
        });

        connectConferenceStub = sinon.stub(rtcMgr, 'connectConference', function (options) {
          options.onSuccess(responseData);
        });

        connectCallStub = sinon.stub(rtcMgr, 'connectCall');

        outgoingCall.connect();
      });

      afterEach(function () {
        connectConferenceStub.restore();
        connectCallStub.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.disconnect).to.be.a('function');
      });

      it('Should execute Call.setState with `disconnecting` state', function () {
        outgoingCall.disconnect();

        expect(outgoingCall.getState()).to.equal('disconnecting');
      });

      describe('Cancel Call [call.remoteSdp === null]', function () {

        it('should set `call.canceled` to true ', function () {
          outgoingCall.disconnect();

          expect(outgoingCall.canceled()).to.equal(true);
        });

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

        describe('Events for cancel', function () {

          var canceledSpy,
            eventData;

          beforeEach(function () {
            canceledSpy = sinon.spy();

            eventData = {
              abc: 'abc'
            };

            outgoingCall.on('canceled', canceledSpy);

            outgoingCall.disconnect();
          });

          describe('session-terminated', function () {

            beforeEach(function () {
              ATT.private.pcv = 2;
              outgoingCall.connect();
              outgoingCall.disconnect();
            });

            afterEach(function () {
              ATT.private.pcv = 1;
            });

            // TODO: Review if this is needed, or if it even belongs in here
            it.skip('should publish `canceled` on getting `session-terminated` when call state is `created`', function (done) {

              setTimeout(function () {
                emitterEM.publish('session-terminated:' + outgoingCall.id(), {
                  abc: 'abc'
                });

                setTimeout(function () {
                  try {
                    expect(canceledSpy.calledOnce).to.equal(true);
                    done();
                  } catch (e) {
                    done(e);
                  }
                }, 10);
              }, 10);

            });

            it('should publish `canceled` when disconnecting before PeerConnection Success and if Call.canceled = true', function (done) {

              setTimeout(function () {
                try {
                    expect(canceledSpy.called).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 10);

            });

          });
        })

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
      var rejectCallStub;

      beforeEach(function () {
        rejectCallStub = sinon.stub(rtcMgr, 'rejectCall');
        incomingCall = new ATT.rtc.Call(optionsIncoming);
      });

      afterEach(function () {
        rejectCallStub.restore();
      });

      it('Should exist', function () {
        expect(incomingCall.reject).to.be.a('function');
      });

      it('should set rejected flag to true on call', function () {
        incomingCall.reject();

        expect(incomingCall.rejected()).to.equal(true);
      });

      it('should register for `session-terminated` event on rtcManager', function (done) {
        incomingCall.reject();

        setTimeout(function () {
          try {
            expect(rtcMgrOnSpy.calledWith('session-terminated:' + incomingCall.id())).to.equal(true);
            expect(rtcMgrOnSpy.getCall(0).args[1]).to.be.a('function');
            done();
          } catch (e) {
            done(e);
          }
        }, 20);
      });

      it('should call rtcManager.rejectCall', function () {
        var args;

        incomingCall.reject();

        expect(rejectCallStub.called).to.equal(true);
        args = rejectCallStub.getCall(0).args[0];
        expect(args.sessionId).to.equal(incomingCall.sessionInfo().sessionId);
        expect(args.token).to.equal(incomingCall.sessionInfo().token);
        expect(args.callId).to.equal(incomingCall.id());
        expect(args.onSuccess).to.be.a('function');
        expect(args.breed).to.equal(incomingCall.breed());
        expect(args.onError).to.be.a('function');
      });

      describe('rejectCall: onSuccess', function () {
      });

      describe('Events for reject', function () {

        describe('session-terminated', function () {
          var onRejectedSpy;

          beforeEach (function () {
            // restore for actual event register
            incomingCall.reject();
          });

          it('should publish `rejected` with data when rtcManager publishes `session-terminated` and rejected == true', function (done) {

            var data = {
              abc: 'nothing'
            };
            onRejectedSpy = sinon.spy();
            incomingCall.on('rejected', onRejectedSpy);

            emitterEM.publish('session-terminated:' + incomingCall.id(), data);

            setTimeout(function () {
              try {
                expect(onRejectedSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 20);
          });

          it('should execute rtcMgr.resetPeerConnection', function (done) {
            var resetPeerConnectionStub = sinon.stub(rtcMgr, 'resetPeerConnection');

            emitterEM.publish('session-terminated:' + incomingCall.id());

            setTimeout(function () {
              try {
                expect(resetPeerConnectionStub.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              } finally {
                resetPeerConnectionStub.restore();
              }
            }, 20);
          });

          it('should de-register from the `session-terminated` event from `rtcManager`', function (done) {
            var offSpy = sinon.spy(rtcMgr, 'off');

            emitterEM.publish('session-terminated:' + incomingCall.id(), {
              reason: 'Call rejected'
            });

            setTimeout(function () {
              try {
                expect(offSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              } finally {
                offSpy.restore();
              }
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

    // TODO: not fixing tests for pcv 1, remove code
    xdescribe('Call', function () {

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

      describe('mod-received', function () {

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
          emitterEM.publish('mod-received', modificationsHold);

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
          emitterEM.publish('mod-received', modificationsHold);

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
            emitterEM.publish('mod-received', modificationsHold);

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
            emitterEM.publish('mod-received', modificationsHold);

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
            emitterEM.publish('mod-received', modificationsResume);

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
            emitterEM.publish('mod-received', modificationsResume);

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

      describe('mod-terminated', function () {

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

        it('should execute setRemoteSdp on getting a `mod-terminated` event from eventManager', function (done) {
          emitterEM.publish('mod-terminated', modificationsHold);

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
          emitterEM.publish('mod-terminated', modificationsHold);

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
            emitterEM.publish('mod-terminated', modificationsHold);

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
            emitterEM.publish('mod-terminated', modificationsResume);

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

      describe('session-open', function () {

        var setRemoteDescriptionStub,
          playStreamSpy,
          eventData,
          pcSetRemoteDescriptionStub;

        beforeEach(function () {
          eventData = {
            type: 'call',
            id: '12345',
            remoteSdp: 'abcdefg'
          };

          setRemoteDescriptionStub = sinon.stub(rtcMgr, 'setRemoteDescription');
          playStreamSpy = sinon.spy(rtcMgr, 'playStream');
          pcSetRemoteDescriptionStub = sinon.stub(peerConnection, 'setRemoteDescription');
        });

        afterEach(function () {
          playStreamSpy.restore();
          setRemoteDescriptionStub.restore();
          pcSetRemoteDescriptionStub.restore();
        });

        it('Should execute Call.setState with `connected` state', function (done) {
          emitterEM.publish('session-open:' + call.id(), eventData);

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
          emitterEM.publish('session-open', eventData);

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
          emitterEM.publish('session-open', eventData);

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

        it('should execute `peerConnection.setRemoteDescription` [pcv===2]', function (done) {
          var oldPCV = ATT.private.pcv;

          ATT.private.pcv = 2;
          call.connect(); // setup the peerConnection

          emitterEM.publish('session-open', eventData);
          setTimeout(function () {
            try {
              expect(pcSetRemoteDescriptionStub.called).to.equal(true);
              ATT.private.pcv = oldPCV;
              done();
            } catch (e) {
              ATT.private.pcv = oldPCV;
              done(e);
            }
          }, 50);
        });


        it('should call `rtcManager.playStream`', function (done) {
          emitterEM.publish('session-open', eventData);

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

    });

  });

});
