/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call', function () {

  'use strict';

  var factories,
    apiConfig,
    connectOptions,
    optionsOutgoing,
    optionsIncoming,
    optionsforRTCM,
    emitterEM,
    eventManager,
    rtcMgr,
    getRTCManagerStub,
    createEventEmitterStub,
    createEventManagerStub,
    remoteSdp,
    resourceManager,
    doOperationStub,
    localVideo,
    remoteVideo;

  before(function () {

    apiConfig = ATT.private.config.api;
    factories = ATT.private.factories;
    resourceManager = factories.createResourceManager(apiConfig);
    doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) { // never hit the network
      options.success();
    });

    remoteVideo = document.createElement('video');
    localVideo = document.createElement('video');

    connectOptions = {
      localMedia: localVideo,
      remoteMedia: remoteVideo
    };

    optionsOutgoing = {
      peer: '12345',
      mediaType: 'audio',
      type: ATT.CallTypes.OUTGOING,
      sessionInfo : {sessionId : '12345'}
    };

    optionsIncoming = {
      peer: '12345',
      mediaType: 'audio',
      type: ATT.CallTypes.INCOMING,
      remoteSdp: 'abc',
      sessionInfo : {sessionId : '12345'}
    };

    optionsforRTCM = {
      errorManager: ATT.Error,
      resourceManager: resourceManager,
      rtcEvent: ATT.RTCEvent.getInstance(),
      userMediaSvc: ATT.UserMediaService,
      peerConnSvc: ATT.PeerConnectionService
    };

    emitterEM = ATT.private.factories.createEventEmitter();

    remoteSdp = 'JFGLSDFDJKS';

    createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
      return emitterEM;
    });

    eventManager = ATT.private.factories.createEventManager({
      resourceManager: resourceManager,
      channelConfig: {
        endpoint: '/events',
        type: 'longpolling'
      }
    });

    createEventManagerStub = sinon.stub(ATT.private.factories, 'createEventManager', function () {
      return eventManager;
    });

    rtcMgr = new ATT.private.RTCManager(optionsforRTCM);

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return rtcMgr;
    });

  });

  after(function () {
    doOperationStub.restore();
    createEventEmitterStub.restore();
    createEventManagerStub.restore();
    getRTCManagerStub.restore();
  });

  it('Should have a public constructor under ATT.rtc', function () {
    expect(ATT.rtc.Call).to.be.a('function');
  });

  describe('Constructor', function () {

    it('Should throw an error if invalid options', function () {
      var func = function (options) {
        return new ATT.rtc.Call(options);
      };
      expect(func).to.throw('No input provided');
      expect(func.bind(null, {})).to.throw('No peer provided');
      expect(func.bind(null, {
        peer: '1234'
      })).to.throw('No type provided');
      expect(func.bind(null, {
        peer: '1234',
        type: 'abc'
      })).to.throw('No mediaType provided');
      expect(func.bind(null, {
        peer: '1234',
        type: 'abc',
        mediaType: 'audio'
      })).to.not.throw(Error);
    });

    it('Should create a call object with the options passed in', function () {
      var call = new ATT.rtc.Call(optionsOutgoing);

      expect(call).to.be.an('object');
      expect(call.id).to.equal(optionsOutgoing.id);
      expect(call.peer).to.equal(optionsOutgoing.peer);
      expect(call.mediaType).to.equal(optionsOutgoing.mediaType);
      expect(call.type).to.equal(optionsOutgoing.type);
    });

    it('should create an instance of event emitter', function () {
      expect(createEventEmitterStub.called).to.equal(true);
    });

    it('should get an instance of RTCManager', function () {
      expect(getRTCManagerStub.called).to.equal(true);
    });

  });

  describe('Methods', function () {

    var outgoingCall,
      incomingCall,
      onConnectingSpy,
      onConnectedSpy,
      onMutedSpy,
      onUnmutedSpy,
      onDisconnectingSpy,
      onDisconnectedSpy;

    beforeEach(function () {
      outgoingCall = new ATT.rtc.Call(optionsOutgoing);
      incomingCall = new ATT.rtc.Call(optionsIncoming);

      incomingCall.setRemoteSdp(optionsIncoming.remoteSdp);

      onConnectingSpy = sinon.spy();
      onConnectedSpy = sinon.spy();
      onMutedSpy = sinon.spy();
      onUnmutedSpy = sinon.spy()
      onDisconnectingSpy = sinon.spy();
      onDisconnectedSpy = sinon.spy();

      outgoingCall.on('connecting', onConnectingSpy);
      outgoingCall.on('connected', onConnectedSpy);
      outgoingCall.on('muted', onMutedSpy);
      outgoingCall.on('unmuted', onUnmutedSpy);
      outgoingCall.on('disconnecting', onDisconnectingSpy);
      outgoingCall.on('disconnected', onDisconnectedSpy);
    });

    describe('On', function () {

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

    describe('Connect', function () {

      var connectCallStub,
        setIdStub,
        setStateSpy,
        localSdp,
        onSpy;

      beforeEach(function () {

        localSdp = 'xyz';

        connectCallStub = sinon.stub(rtcMgr, 'connectCall', function () {
        });

        onSpy = sinon.spy(rtcMgr, 'on');

        setIdStub = sinon.stub(outgoingCall, 'setId', function () {});
      });

      afterEach(function () {
        connectCallStub.restore();
        setIdStub.restore();
        onSpy.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.connect).to.be.a('function');
      });

      it('should set localMedia & remoteMedia if passed in', function () {
        outgoingCall.connect(connectOptions);

        expect(outgoingCall.localMedia).to.equal(connectOptions.localMedia);
        expect(outgoingCall.remoteMedia).to.equal(connectOptions.remoteMedia);
      });

      it('should register for event `media-modifications` from RTCManager', function () {
        incomingCall.connect(connectOptions);
        expect(onSpy.calledWith('media-modifications')).to.equal(true);
      });

      it('should register for event `media-mod-terminations` from RTCManager', function () {
        incomingCall.connect(connectOptions);

        expect(onSpy.calledWith('media-mod-terminations')).to.equal(true);
      });

      it('should register for event `call-connected` from RTCManager', function () {
        outgoingCall.connect(connectOptions);

        expect(onSpy.calledWith('call-connected')).to.equal(true);
        expect(onSpy.getCall(0).args[1]).to.be.a('function');
      });

      it('should register for `playing` event from remote video element', function () {
        var addEventListenerStub = sinon.stub(connectOptions.remoteMedia, 'addEventListener', function () {
        });

        outgoingCall.connect(connectOptions);

        expect(addEventListenerStub.calledWith('playing')).to.equal(true);

        addEventListenerStub.restore();
      });

      it('should execute RTCManager.connectCall for outgoing calls', function () {
        outgoingCall.connect(connectOptions);
        expect(connectCallStub.called).to.equal(true);
      });

      it('should execute RTCManager.connectCall with `remoteSdp` for incoming calls', function () {
        var options = {
          localMedia: localVideo,
          remoteMedia: remoteVideo
        };
        incomingCall.connect(connectOptions);

        expect(connectCallStub.getCall(0).args[0].remoteSdp).to.equal(optionsIncoming.remoteSdp);
      });

      describe('success on connectCall', function () {

        beforeEach(function () {
          connectCallStub.restore();

          connectCallStub = sinon.stub(rtcMgr, 'connectCall', function (options) {
            options.onCallConnecting({
              callId: '1234',
              localSdp: localSdp
            });
          });
        });

        afterEach(function () {
          connectCallStub.restore();
        });

        it('should execute Call.setId for outgoing calls', function () {
          outgoingCall.connect(connectOptions);

          expect(setIdStub.called).to.equal(true);
        });

        it('should execute Call.setState for incoming calls', function () {
          setStateSpy = sinon.spy(incomingCall, 'setState');
          incomingCall.connect(connectOptions);

          expect(setStateSpy.called).to.equal(true);

          setStateSpy.restore();
        });

        it('should set the newly created LocalSdp on the call', function () {
          outgoingCall.connect(connectOptions);

          expect(outgoingCall.localSdp).to.equal(localSdp);
        });
      });

      describe('error on connectCall', function () {
        it('Should execute the onError callback if there is an error');
      });

    });

    describe('Mute/Unmute', function () {

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
            var setStateStub = sinon.stub(outgoingCall, 'setState', function () {});

            outgoingCall.mute();

            expect(setStateStub.calledWith('muted')).to.equal(true);

            setStateStub.restore();
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
            var setStateStub = sinon.stub(outgoingCall, 'setState', function () {});

            outgoingCall.unmute();

            expect(setStateStub.calledWith('unmuted')).to.equal(true);

            setStateStub.restore();
          });

        });
      });
    });

    describe('Hold/Resume', function () {

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
          incomingCall.resume();
          expect(resumeCallStub.called).to.equal(true);
        });

        it('should set localSdp on success', function () {
          incomingCall.resume();
          expect(incomingCall.localSdp).to.equal('localSdpForResumeRequest');
        });
      });
    });

    describe('disconnect', function () {

      var onSpy,
        setIdSpy,
        disconnectCallStub;

      beforeEach(function () {
        setIdSpy = sinon.spy(outgoingCall, 'setId');

        onSpy = sinon.spy(rtcMgr, 'on');

        disconnectCallStub = sinon.stub(rtcMgr, 'disconnectCall', function () {
        });
      });

      afterEach(function () {
        setIdSpy.restore();
        onSpy.restore();
        disconnectCallStub.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.disconnect).to.be.a('function');
      });

      it('Should trigger `disconnecting` event immediately', function (done) {
        outgoingCall.disconnect();

        setTimeout(function () {
          try {
            expect(onDisconnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should register for `call-disconnected` event on rtcMgr', function () {
        outgoingCall.disconnect();
        expect(onSpy.calledWith('call-disconnected')).to.equal(true);
      });

      it('should call rtcManager.disconnectCall', function () {
        outgoingCall.disconnect();
        expect(disconnectCallStub.called).to.equal(true);
      });

      describe('call-disconnected', function () {

        it('should execute Call.setId with null callId when rtcManager publishes `call-disconnected` event', function (done) {
          outgoingCall.disconnect();

          emitterEM.publish('call-disconnected');

          setTimeout(function () {
            try {
              expect(setIdSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 300);
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
      it('should exist', function  () {
        expect(outgoingCall.setState).to.be.a('function');
      });

      it('should  set the call state', function () {
        outgoingCall.setState('abc');
        expect(outgoingCall.getState()).to.equal('abc');
      });

      describe('connecting', function () {
        it('should trigger the connecting event with relevant data', function (done) {
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
        it('should trigger the connected event with relevant data', function (done) {
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
    });

    describe('setId', function () {

      var setStateStub;

      beforeEach(function () {
        setStateStub = sinon.stub(outgoingCall, 'setState', function () {});
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

        expect(outgoingCall.id).to.equal(callId);
      });

      it('Should execute Call.setState with `connecting` state if call id is not null', function (done) {
        var callId = '12345';

        outgoingCall.setId(callId);

        setTimeout(function () {
          try {
            expect(setStateStub.calledWith('connecting')).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('Should execute Call.setState with `disconnected` state if call id is null', function (done) {
        outgoingCall.setId(null);

        setTimeout(function () {
          try {
            expect(setStateStub.calledWith('disconnected')).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });

    describe('setRemoteSdp', function () {

      it('should exist', function () {
        expect(outgoingCall.setRemoteSdp).to.be.a('function');
      });

      it('should set the remoteSdp', function () {
        var remoteSdp = 'abc';

        outgoingCall.setRemoteSdp(remoteSdp);

        expect(outgoingCall.remoteSdp).to.equal(remoteSdp);
      });

      it('should set the codec', function () {
        var remoteSdp = 'abc',
          codec = ['a', 'b'],
          getCodecStub = sinon.stub(ATT.sdpFilter.getInstance(), 'getCodecfromSDP', function () {
            return codec;
          });

        outgoingCall.setRemoteSdp(remoteSdp);

        expect(outgoingCall.codec).to.equal(codec);

        getCodecStub.restore();
      });
    });

  });

  describe('Events', function () {

    var call,
      setRemoteSdpSpy,
      setStateSpy,
      onConnectedHandlerSpy,
      connectCallStub;

    beforeEach(function () {

      call = new ATT.rtc.Call(optionsOutgoing);

      setRemoteSdpSpy = sinon.spy(call, 'setRemoteSdp');
      setStateSpy = sinon.spy(call, 'setState');
      onConnectedHandlerSpy = sinon.spy();

      connectCallStub = sinon.stub(rtcMgr, 'connectCall', function () {});

      call.on('connected', onConnectedHandlerSpy);

      call.connect(connectOptions);
    });

    afterEach(function () {
      setRemoteSdpSpy.restore();
      setStateSpy.restore();
      connectCallStub.restore();
    });

    describe('media-modifications', function () {

      var modifications,
        setMediaModificationsStub,
        disableMediaStreamStub,
        enableMediaStreamStub;

      beforeEach(function () {
        modifications = {
          remoteSdp: 'abcrecvonlyabcsendrecv',
          modificationId: '123'
        };

        disableMediaStreamStub = sinon.stub(rtcMgr, 'disableMediaStream');
        enableMediaStreamStub = sinon.stub(rtcMgr, 'enableMediaStream');

        call.remoteSdp = 'abcrecvonlyabcsendrecv';

        setMediaModificationsStub = sinon.stub(rtcMgr, 'setMediaModifications', function () {});

        emitterEM.publish('media-modifications', modifications);
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

      it('should execute setRemoteSdp on getting a `media-modifications` event from eventManager', function (done) {
        setTimeout(function () {
          try {
            expect(setRemoteSdpSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute setState with state `held` if the sdp contains `recvonly`', function (done) {
        setTimeout(function () {
          try {
            expect(setStateSpy.calledWith('held')).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute rtcManager.disableMediaStream if the sdp contains `recvonly`', function (done) {
        setTimeout(function () {
          try {
            expect(disableMediaStreamStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute setState with `resumed` state if the new remoteSdp contains `sendrecv` && the current remoteSdp contains `recvonly`', function (done) {
        setTimeout(function () {
          try {
            expect(setStateSpy.calledWith('resumed')).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute rtcManager.enableMediaStream if the new remoteSdp contains `sendrecv` && the current remoteSdp contains `recvonly`', function (done) {
        setTimeout(function () {
          try {
            expect(enableMediaStreamStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });

    describe('media-mod-terminations', function () {

      var modifications,
        setRemoteDescriptionStub,
        disableMediaStreamStub,
        enableMediaStreamStub;

      beforeEach(function () {
        modifications = {
          remoteSdp: 'abcsendonly',
          modificationId: '123',
          reason: 'success'
        };

        setRemoteDescriptionStub = sinon.stub(rtcMgr, 'setRemoteDescription', function () {});

        disableMediaStreamStub = sinon.stub(rtcMgr, 'disableMediaStream');
        enableMediaStreamStub = sinon.stub(rtcMgr, 'enableMediaStream');

        emitterEM.publish('media-mod-terminations', modifications);
      });

      afterEach(function () {
        setRemoteDescriptionStub.restore();
        disableMediaStreamStub.restore();
        enableMediaStreamStub.restore();
      });

      it('should call `RTCManager.setRemoteDescription` if there is a remoteSdp', function (done) {
        setTimeout(function () {
          try {
            expect(setRemoteDescriptionStub.called).to.equal(true);
            expect(setRemoteDescriptionStub.getCall(0).args[0].remoteSdp).to.equal('abcsendonly');
            expect(setRemoteDescriptionStub.getCall(0).args[0].type).to.equal('answer');
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute setState with `held` state if the sdp contains `sendonly` && but does not contain `sendrecv`', function (done) {
        setTimeout(function () {
          try {
            expect(setStateSpy.calledWith('held')).to.equal(true);
            expect(disableMediaStreamStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute setState with `resumed` state if the new remoteSdp contains `sendrecv`', function (done) {
        emitterEM.publish('media-mod-terminations', {
          remoteSdp: 'abcsendrecv',
          modificationId: '12345',
          reason: 'success'
        });
        setTimeout(function () {
          try {
            expect(setStateSpy.calledWith('resumed')).to.equal(true);
            expect(enableMediaStreamStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute setRemoteSdp on getting a `media-mod-terminations` event from eventManager', function (done) {
        setTimeout(function () {
          try {
            expect(setRemoteSdpSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });

    describe('call-connected', function () {

      var setRemoteDescriptionStub,
        playStreamSpy;

      beforeEach(function () {
        setRemoteDescriptionStub = sinon.stub(rtcMgr, 'setRemoteDescription', function () {});
        playStreamSpy = sinon.spy(rtcMgr, 'playStream');

        emitterEM.publish('call-connected', {
          remoteSdp: 'abcdefg',
          type: 'answer'
        });
      });

      afterEach(function () {
        setRemoteDescriptionStub.restore();
        playStreamSpy.restore();
      });

      it('should execute setRemoteSdp on getting a `call-connected` event from eventManager', function (done) {
        setTimeout(function () {
          try {
            expect(setRemoteSdpSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should execute RTCManager.setRemoteDescription', function (done) {
        setTimeout(function () {
          try {
            expect(setRemoteDescriptionStub.calledWith({
              remoteSdp: 'abcdefg',
              type: 'answer'
            })).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('Should execute Call.setState with `connected` state', function (done) {
        setTimeout(function () {
          try {
            expect(setStateSpy.calledWith('connected')).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should call `rtcManager.playStream`', function (done) {

        setTimeout(function () {
          expect(playStreamSpy.called).to.equal(true);
          expect(playStreamSpy.calledWith('remote')).to.equal(true);
          done();
        }, 100);
      });
    });

  });

});
