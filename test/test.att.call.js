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
    optionsforRTCM,
    emitterEM,
    eventManager,
    rtcMgr,
    peerConnection,
    createEventEmitterStub,
    createEventManagerStub,
    getRTCManagerStub,
    createPeerConnectionStub,
    remoteSdp,
    resourceManager,
    doOperationStub,
    createResourceManagerStub,
    localVideo,
    remoteVideo;

  before(function () {
    apiConfig = ATT.private.config.api;
    factories = ATT.private.factories;

    remoteVideo = document.createElement('video');
    localVideo = document.createElement('video');

    connectOptions = {
      breed: 'call',
      localMedia: localVideo,
      remoteMedia: remoteVideo
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

    optionsforRTCM = {
      resourceManager: resourceManager,
      userMediaSvc: ATT.UserMediaService,
      peerConnSvc: ATT.PeerConnectionService
    };

    remoteSdp = 'JFGLSDFDJKS';
  });

  beforeEach(function () {
    resourceManager = factories.createResourceManager(apiConfig);

    doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) { // never hit the network
      console.log(name);
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

    peerConnection = factories.createPeerConnection();

    createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function () {
      return peerConnection;
    });
  });

  afterEach(function () {
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

    it('should create an instance of the peer connection', function () {
      call1 = new ATT.rtc.Call(optionsOutgoing);

      expect(createPeerConnectionStub.called).to.equal(true);
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

      var addStreamStub;

      beforeEach(function () {
        addStreamStub = sinon.stub(peerConnection, 'addStream', function () {});
      });

      afterEach(function () {
        addStreamStub.restore();
      });

      it('should exist', function () {
        expect(incomingConf.addStream).to.be.a('function');
      });

      it('should execute peerConnection.addStream', function () {
        incomingConf.addStream();

        expect(addStreamStub.called).to.equal(true);
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

      it('should execute RTCManager.connectCall with breed for outgoing calls', function () {
        outgoingCall.connect(connectOptions);

        expect(connectCallStub.called).to.equal(true);
      });

      it('should execute RTCManager.connectCall with `remoteSdp` for incoming calls', function () {
        incomingCall.connect(connectOptions);

        expect(connectCallStub.getCall(0).args[0].remoteSdp).to.equal(optionsIncoming.remoteSdp);
        expect(connectCallStub.getCall(0).args[0].breed).to.not.be.an('undefined');
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
              options.onCallConnecting(callInfo);
            });
          });

          afterEach(function () {
            connectCallStub.restore();
          });

          it('should set the Id for outgoing calls', function () {
            outgoingCall.connect(connectOptions);

            expect(outgoingCall.id()).to.equal(callInfo.callId);
          });

          it('should set the state for incoming calls', function () {
            incomingCall.connect(connectOptions);

            expect(incomingCall.getState()).to.equal('connecting');
          });

          it('should set the newly created LocalSdp on the call', function () {
            outgoingCall.connect(connectOptions);

            expect(outgoingCall.localSdp()).to.equal(callInfo.localSdp);
          });

          it('Should publish `error` with error data if there is an error in operation', function (done) {

            var error = new Error('Uncaught Error'),
                addEventListenerStub = sinon.stub(connectOptions.remoteMedia, 'addEventListener', function () {
              throw error;
            });

            outgoingCall.connect();

            setTimeout(function () {
              expect(onErrorHandlerSpy.calledWith({
                error: error
              })).to.equal(true);
              addEventListenerStub.restore();
              done();
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
              expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
              done();
            }, 100);

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
          }, 100);
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
        it('should call `rtcManager.cancelCall` if the remoteSdp is null', function () {
          var cancelCallStub = sinon.stub(rtcMgr, 'cancelCall');

          outgoingCall.disconnect();

          expect(cancelCallStub.called).to.equal(true);
          expect(cancelCallStub.getCall(0).args[0].success).to.be.a('function');
          expect(cancelCallStub.getCall(0).args[0].sessionInfo).to.be.an('object');

          cancelCallStub.restore();
        });

        describe('Success on `rtcManager.cancelCall`', function () {
          var cancelCallStub;

          beforeEach(function () {
            outgoingCall.setId(null);
            cancelCallStub = sinon.stub(rtcMgr, 'cancelCall', function (options) {
              options.success();
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

      describe('Disconnect Call [call.remoteSdp !== null]', function () {
        it('should call rtcManager.disconnectCall', function () {
          var disconnectCallStub = sinon.stub(rtcMgr, 'disconnectCall');
          // for this test we need that call to have a valid remoteSdp, otherwise
          // it will call `rtcManager.cancellCall`
          outgoingCall.setRemoteSdp('abcdefg');
          outgoingCall.setId('1234');
          outgoingCall.disconnect();

          expect(disconnectCallStub.called).to.equal(true);

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
//        console.log(JSON.stringify(rejectCallStub.getCall(0).args[0]));
        args = rejectCallStub.getCall(0).args[0];
        expect(args.sessionId).to.equal(outgoingCall.sessionInfo().sessionId);
        expect(args.token).to.equal(outgoingCall.sessionInfo().token);
        expect(args.callId).to.equal(outgoingCall.id());
        expect(args.onSuccess).to.be.a('function');
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
            }, 300);
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
            }, 300);
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
            }, 200);
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
            }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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
            expect(typeof onEventHandlerSpy.getCall(0).args[0].timestamp).to.equal('object');
            done();
          }, 100);
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

    describe('setRemoteSdp', function () {

      it('should exist', function () {
        expect(outgoingCall.setRemoteSdp).to.be.a('function');
      });

      it('should set the remoteSdp', function () {
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

    var call,
      setRemoteSdpSpy,
      setStateSpy,
      onConnectedHandlerSpy,
      connectCallStub,
      rtcManager;

    beforeEach(function () {

      call = new ATT.rtc.Call(optionsOutgoing);

      setRemoteSdpSpy = sinon.spy(call, 'setRemoteSdp');
      setStateSpy = sinon.spy(call, 'setState');
      onConnectedHandlerSpy = sinon.spy();

      connectCallStub = sinon.stub(rtcMgr, 'connectCall');

      call.on('connected', onConnectedHandlerSpy);

      call.connect(connectOptions);
    });

    afterEach(function () {
      setRemoteSdpSpy.restore();
      setStateSpy.restore();
      connectCallStub.restore();
    });

    describe('media-modifications', function () {

      var modificationsHold,
        modificationsResume,
        setMediaModificationsStub,
        disableMediaStreamStub,
        enableMediaStreamStub;

      beforeEach(function (done) {
        modificationsHold = {
          remoteSdp: 'abc recvonly',
          modificationId: '123'
        };
        modificationsResume = {
          remoteSdp: 'abc sendrecv',
          modificationId: '123'
        };

        disableMediaStreamStub = sinon.stub(rtcMgr, 'disableMediaStream');
        enableMediaStreamStub = sinon.stub(rtcMgr, 'enableMediaStream');

        call.setRemoteSdp(modificationsHold.remoteSdp);

        setMediaModificationsStub = sinon.stub(rtcMgr, 'setMediaModifications');

        emitterEM.publish('media-modifications', modificationsHold);

        setTimeout(function () {
          console.log('Wait for `media-modifications` event');
          done();
        },100);
      });

      afterEach(function () {
        setMediaModificationsStub.restore();
        disableMediaStreamStub.restore();
        enableMediaStreamStub.restore();
      });

      it('should execute `RTCManager.setModifications`', function (done) {
        setTimeout(function () {
          try {
            expect(setMediaModificationsStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute setRemoteSdp on getting a `media-modifications` event from eventManager', function () {
        expect(call.remoteSdp()).to.equal(modificationsHold.remoteSdp);
      });

      describe('Hold modification', function () {
        beforeEach(function (done) {
          emitterEM.publish('media-modifications', modificationsHold);

          setTimeout(function () {
            console.log('Wait for `media-modifications` event');
            done();
          },100);
        });
        it('should execute setState with state `held` if the sdp contains `recvonly`', function () {

          expect(call.getState()).to.equal('held');

        });

        it('should execute rtcManager.disableMediaStream if the sdp contains `recvonly`', function () {
            expect(disableMediaStreamStub.called).to.equal(true);
        });
      });
      describe('Resume modification', function () {
        beforeEach(function (done) {
          emitterEM.publish('media-modifications', modificationsResume);

          setTimeout(function () {
            console.log('Wait for `media-modifications` event');
            done();
          }, 100);
        });
        it('should execute setState with `resumed` state if the new remoteSdp contains `sendrecv` '
          + '&& the current remoteSdp contains `recvonly`', function () {
          expect(call.getState()).to.equal('resumed');
        });

        it('should execute rtcManager.enableMediaStream if the new remoteSdp contains `sendrecv`'
          + ' && the current remoteSdp contains `recvonly`', function () {
            expect(enableMediaStreamStub.called).to.equal(true);
        });
      });

    });

    describe('media-mod-terminations', function () {

      var modificationsHold,
        modificationsResume,
        setRemoteDescriptionStub,
        disableMediaStreamStub,
        enableMediaStreamStub;

      beforeEach(function (done) {
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

        setRemoteDescriptionStub = sinon.stub(rtcMgr, 'setRemoteDescription');

        disableMediaStreamStub = sinon.stub(rtcMgr, 'disableMediaStream');
        enableMediaStreamStub = sinon.stub(rtcMgr, 'enableMediaStream');

        emitterEM.publish('media-mod-terminations', modificationsHold);

        setTimeout(function () {
          console.log('Wait for `media-mod-terminations` event');
          done();
        }, 100);
      });

      afterEach(function () {
        setRemoteDescriptionStub.restore();
        disableMediaStreamStub.restore();
        enableMediaStreamStub.restore();
      });

      it('should call `RTCManager.setRemoteDescription` if there is a remoteSdp', function () {
        expect(setRemoteDescriptionStub.called).to.equal(true);
        expect(setRemoteDescriptionStub.getCall(0).args[0].remoteSdp).to.equal('abcsendonly');
        expect(setRemoteDescriptionStub.getCall(0).args[0].type).to.equal('answer');
      });

      describe('Hold', function () {
        beforeEach(function (done) {
          emitterEM.publish('media-mod-terminations', modificationsHold);

          setTimeout(function () {
            console.log('Wait for `media-mod-terminations` event');
            done();
          }, 100);
        });
        it('should execute setState with `held` state if the sdp contains `sendonly` && but does not contain `sendrecv`', function () {
          expect(call.getState()).to.equal('held');
          expect(disableMediaStreamStub.called).to.equal(true);
        });
      });

      describe('Resume', function () {

        beforeEach(function (done) {
          emitterEM.publish('media-mod-terminations', modificationsResume);

          setTimeout(function () {
            console.log('Wait for `media-mod-terminations` event');
            done();
          }, 100);
        });

        it('should execute setState with `resumed` state if the new remoteSdp contains `sendrecv`', function () {
          expect(call.getState()).to.equal('resumed');
          expect(enableMediaStreamStub.called).to.equal(true);
        });
      });

      it('should execute setRemoteSdp on getting a `media-mod-terminations` event from eventManager', function () {
        expect(call.remoteSdp()).to.equal(modificationsHold.remoteSdp);
      });
    });

    describe('call-connected', function () {

      var setRemoteDescriptionStub,
        playStreamSpy,
        eventData;

      beforeEach(function (done) {
        eventData = {
          remoteSdp: 'abcdefg',
          type: 'answer'
        };

        setRemoteDescriptionStub = sinon.stub(rtcMgr, 'setRemoteDescription');
        playStreamSpy = sinon.spy(rtcMgr, 'playStream');

        emitterEM.publish('call-connected', eventData);

        setTimeout(function () {
          console.log('Waiting for `call-connected` event');
          done();
        });
      });

      afterEach(function () {
        playStreamSpy.restore();
        setRemoteDescriptionStub.restore();
      });

      it('should execute setRemoteSdp on getting a `call-connected` event from eventManager', function () {
        expect(call.remoteSdp()).to.equal(eventData.remoteSdp);
      });

      it('should execute RTCManager.setRemoteDescription', function () {
        expect(setRemoteDescriptionStub.calledWith(eventData)).to.equal(true);
      });

      it('Should execute Call.setState with `connected` state', function () {
        expect(call.getState()).to.equal('connected');
      });

      it('should call `rtcManager.playStream`', function () {
        expect(playStreamSpy.called).to.equal(true);
        expect(playStreamSpy.calledWith('remote')).to.equal(true);
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
        }, 300);
      });


      it('should publish `disconnected` with data on getting `call-disconnected` with no reason', function (done) {

        var disconnectedSpy = sinon.spy();

        call.on('disconnected', disconnectedSpy);

        emitterEM.publish('call-disconnected', {data : '123'}); // no reason passed

        setTimeout(function () {
          expect(disconnectedSpy.calledWith({data : '123'})).to.equal(true);
          done();
        }, 100);

      });

      it('should publish `rejected` on getting `call-disconnected` with reason: `Call rejected`', function (done) {

        var rejectedSpy = sinon.spy();

        call.on('rejected', rejectedSpy);

        emitterEM.publish('call-disconnected', {
          reason: 'Call rejected'
        });

        setTimeout(function () {
          console.log(rejectedSpy.callCount);
          console.log(JSON.stringify(rejectedSpy.getCall(0).args[0]));
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
        }, 200);
      });

    });

  });

});
