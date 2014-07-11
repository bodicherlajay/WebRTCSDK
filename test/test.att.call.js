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
    outgoingCall,
    incomingCall,
    onDialingSpy,
    onAnsweringSpy,
    onConnectingSpy,
    onConnectedSpy,
    onMutedSpy,
    onUnmutedSpy,
    onDisconnectingSpy,
    onDisconnectedSpy,
    remoteSdp,
    resourceManager,
    doOperationStub;

  before(function () {

    apiConfig = ATT.private.config.api;
    factories = ATT.private.factories;
    resourceManager = factories.createResourceManager(apiConfig);
    doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) { // never hit the network
      options.success();
    });

    connectOptions = {
      localMedia: '#foo',
      remoteMedia: '#bar'
    };

    optionsOutgoing = {
      peer: '12345',
      mediaType: 'audio',
      type: ATT.CallTypes.OUTGOING
    };

    optionsIncoming = {
      peer: '12345',
      mediaType: 'audio',
      type: ATT.CallTypes.INCOMING
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

    outgoingCall = new ATT.rtc.Call(optionsOutgoing);
    incomingCall = new ATT.rtc.Call(optionsIncoming);

    onDialingSpy = sinon.spy();
    onAnsweringSpy = sinon.spy();
    onConnectingSpy = sinon.spy();
    onConnectedSpy = sinon.spy();
    onMutedSpy = sinon.spy();
    onUnmutedSpy = sinon.spy()
    onDisconnectingSpy = sinon.spy();
    onDisconnectedSpy = sinon.spy();

    outgoingCall.on('dialing', onDialingSpy);
    outgoingCall.on('connecting', onConnectingSpy);
    outgoingCall.on('connected', onConnectedSpy);
    outgoingCall.on('muted', onMutedSpy);
    outgoingCall.on('unmuted', onUnmutedSpy);
    outgoingCall.on('disconnecting', onDisconnectingSpy);
    outgoingCall.on('disconnected', onDisconnectedSpy);

    incomingCall.on('answering', onAnsweringSpy);

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
      })).to.throw('No mediaType provided');
      expect(func.bind(null, {
        peer: '1234',
        mediaType: 'audio'
      })).to.not.throw(Error);
    });

    it('Should create a call object with the options passed in', function () {
      expect(outgoingCall).to.be.an('object');
      expect(outgoingCall.id).to.equal(optionsOutgoing.id);
      expect(outgoingCall.peer).to.equal(optionsOutgoing.peer);
      expect(outgoingCall.mediaType).to.equal(optionsOutgoing.mediaType);
      expect(outgoingCall.type).to.equal(optionsOutgoing.type);
    });

    it('should create an instance of event emitter', function () {
      expect(createEventEmitterStub.called).to.equal(true);
    });

    it('should get an instance of RTCManager', function () {
      expect(getRTCManagerStub.called).to.equal(true);
    });

  });

  describe('Methods', function () {

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

        expect(outgoingCall.on.bind(outgoingCall, 'dialing', fn)).to.not.throw(Error);

        expect(unsubscribeSpy.called).to.equal(true);
        expect(subscribeSpy.called).to.equal(true);

        unsubscribeSpy.restore();
        subscribeSpy.restore();
      });
    });

    describe('Connect', function () {

      var connectCallStub,
        setIdSpy,
        setStateSpy,
        localSdp,
        onStub;

      beforeEach(function () {

        localSdp = 'xyz';

        connectCallStub = sinon.stub(rtcMgr, 'connectCall', function (options) {
          options.onCallConnecting({
            callId: '1234',
            localSdp: localSdp
          });
          emitterEM.publish('call-disconnected');
        });

        onStub = sinon.stub(rtcMgr, 'on');

        setIdSpy = sinon.spy(outgoingCall, 'setId');
      });

      afterEach(function () {
        connectCallStub.restore();
        setIdSpy.restore();
        onStub.restore();
      });

      it('Should exist', function () {
        expect(outgoingCall.connect).to.be.a('function');
      });

      it('Should trigger `dialing` event immediately if callType is Outgoing', function (done) {

        outgoingCall.connect(connectOptions);

        setTimeout(function () {
          try {
            expect(onDialingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should trigger `answering` event immediately if callType is Incoming', function (done) {
        incomingCall.connect(connectOptions);

        setTimeout(function () {
          try {
            expect(onAnsweringSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should set localMedia & remoteMedia if passed in', function () {
        outgoingCall.connect(connectOptions);
        expect(outgoingCall.localMedia).to.equal('#foo');
        expect(outgoingCall.remoteMedia).to.equal('#bar');
      });

      it('should register for event `media-modifications` from RTCManager', function () {
        incomingCall.connect(connectOptions);
        expect(onStub.calledWith('media-modifications')).to.equal(true);
      });

      it('should register for event `call-connected` from RTCManager', function () {
        outgoingCall.connect(connectOptions);
        expect(onStub.calledWith('call-connected')).to.equal(true);
        expect(onStub.getCall(0).args[1]).to.be.a('function');
      });

      describe('call-disconnected', function () {

        beforeEach(function () {
          outgoingCall.connect(connectOptions);

        });

        it('should register for `call-disconnected` event on rtcMgr', function () {
          expect(onStub.calledWith('call-disconnected')).to.equal(true);
        });

        it('should set the callId to null when rtcManager publishes `call-disconnected` event', function (done) {
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

      it('should execute RTCManager.connectCall', function () {
        outgoingCall.connect(connectOptions);
        expect(connectCallStub.called).to.equal(true);
      });

      describe('success on connectCall', function () {

        it('should execute Call.setId for outgoing calls', function () {
          outgoingCall.connect(connectOptions);
          expect(setIdSpy.called).to.equal(true);
        });

        it('should execute Call.setState for incoming calls', function () {
          setStateSpy = sinon.spy(incomingCall, 'setState');
          incomingCall.connect(connectOptions);
          expect(setStateSpy.called).to.equal(true);
          setStateSpy.restore();
        });

        it('should set the newly created LocalSdp on the call', function () {
          expect(outgoingCall.localSdp).to.equal(localSdp);
        });
      });

      it('Should execute the onError callback if there is an error');
    });

    describe('Mute/Unmute', function () {

      var localSdp,
        muteCallStub,
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
          expect(muteCallStub.getCall(0).args[0]).to.be.an('object');
        });

        describe('success on RTCManager.muteCall', function () {
          it('should set the call state to ATT.CallTypes.MUTED', function () {
            expect(outgoingCall.state).to.equal(ATT.CallStates.MUTED);
          });

          it('Should also publish the `muted` event', function (done) {
            setTimeout(function () {
              try {
                expect(onMutedSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 100);
          });
        });
      });

      describe('unmute', function () {
        it('should exist', function () {
          expect(outgoingCall.unmute).to.be.a('function');
        });

        it('should execute RTCManager.unmuteCall', function () {
          outgoingCall.unmute();
           expect(unmuteCallStub.getCall(0).args[0]).to.be.an('object');
        });

        describe('success on RTCManager.unmuteCall', function () {
          it('should set the call state to ATT.CallTypes.ONGOING', function () {
            expect(outgoingCall.state).to.equal(ATT.CallStates.ONGOING);
          });

          it('Should also publish the `unmuted` event', function (done) {
            setTimeout(function () {
              try {
                expect(onUnmutedSpy.called).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 100);
          });
        });
      });
    });

    describe('hold/Resume', function () {

      var localSdp,
        holdCallStub,
        resumeCallStub,
        rtcOnSpy,
        callholdHandlerSpy,
        callresumeHandlerSpy;


      before(function () {

        callresumeHandlerSpy = sinon.spy();
        outgoingCall.on('resume', callresumeHandlerSpy);

        callholdHandlerSpy = sinon.spy();
        outgoingCall.on('hold', callholdHandlerSpy);

        rtcOnSpy = sinon.spy(rtcMgr, 'on');

        holdCallStub = sinon.stub(rtcMgr, 'holdCall', function () {
          emitterEM.publish('hold');
        });

        resumeCallStub = sinon.stub(rtcMgr, 'resumeCall', function () {
          emitterEM.publish('resume');
        });

        outgoingCall.hold();
        outgoingCall.resume();
      });

      after(function () {
        rtcOnSpy.restore();
        holdCallStub.restore();
        resumeCallStub.restore();
      });


      describe('hold', function () {
        it('should exist', function () {
          expect(outgoingCall.hold).to.be.a('function');
        });

        it('should execute RTCManager.holdCall', function () {
          expect(holdCallStub.called).to.equal(true);
        });

        it('should register hold event on RTCManager', function () {
          expect(rtcOnSpy.calledWith('hold')).to.equal(true);
        });

        it('should trigger `call-hold` when event-manager publishes `hold` event', function (done) {

          setTimeout(function () {
            try {
              expect(callholdHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });
      });

      describe('resume', function () {

        it('should exist', function () {
          expect(outgoingCall.resume).to.be.a('function');
        });

        it('should execute RTCManager.resumeCall', function () {
          expect(resumeCallStub.called).to.equal(true);
        });

        it('should register resume event on RTCManager', function () {
          expect(rtcOnSpy.calledWith('resume')).to.equal(true);

        });

        it('should trigger `call-resume` when event-manager publishes `resume` event', function (done) {

          setTimeout(function () {
            try {
              expect(callresumeHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 200);
        });
      });
    });

    describe('Connect Events', function () {

      var setRemoteSdpSpy,
        onEstablishedHandlerSpy,
        connectCallStub;

      before(function () {
        setRemoteSdpSpy = sinon.spy(outgoingCall, 'setRemoteSdp');
        onEstablishedHandlerSpy = sinon.spy();
        connectCallStub = sinon.stub(rtcMgr, 'connectCall', function () {});

        outgoingCall.on('established', onEstablishedHandlerSpy);

        outgoingCall.connect(connectOptions);
      });

      after(function () {
        setRemoteSdpSpy.restore();
        connectCallStub.restore();
      });

      describe('media-modifications', function () {

        var modifications,
          setMediaModificationsSpy;

        before(function () {
          modifications = {
            remoteSdp: 'abc',
            modificationId: '123'
          };

          setMediaModificationsSpy = sinon.spy(rtcMgr, 'setMediaModifications');

          emitterEM.publish('media-modifications', modifications);
        });

        after(function () {
          setMediaModificationsSpy.restore();
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

	  xit('should publish `established` event on getting a `media-established` event from RTC Manager', function (done) {
        emitterEM.publish('media-established');

        setTimeout(function () {
          try {
            expect(onEstablishedHandlerSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

        it('should execute `RTCManager.setModifications`', function (){
          expect(setMediaModificationsSpy.called).to.equal(true);
          expect(setMediaModificationsSpy.calledWith(modifications)).to.equal(true);
        });
      });

      describe('call-connected', function () {

        var setRemoteDescriptionSpy;

        before(function () {
          setRemoteDescriptionSpy = sinon.spy(rtcMgr, 'setRemoteDescription');

          emitterEM.publish('call-connected', remoteSdp);
        });

        after(function () {
          setRemoteDescriptionSpy.restore();
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
              expect(setRemoteDescriptionSpy.calledWith({
                remoteSdp: remoteSdp,
                type: 'answer'
              })).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

      });

      describe('media-established', function () {
        it('should publish `established` event on getting a `media-established` event from RTC Manager', function (done) {
          emitterEM.publish('media-established');

          setTimeout(function () {
            try {
              expect(onEstablishedHandlerSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });
      });

    });

    describe('disconnect', function () {
      var disconnectCallStub;

      before(function () {
        disconnectCallStub = sinon.stub(rtcMgr, 'disconnectCall', function () {
          emitterEM.publish('call-disconnected');
        });

        outgoingCall.disconnect();
      });

      after(function () {
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

      it('should call rtcManager.disconnectCall', function () {
        outgoingCall.disconnect();
        expect(disconnectCallStub.called).to.equal(true);
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
      it('should trigger the corresponding event', function (done) {
        var onEventHandlerSpy = sinon.spy();

        outgoingCall.on('connecting', onEventHandlerSpy);
        outgoingCall.setState('connecting');

        setTimeout(function () {
          expect(onEventHandlerSpy.called).to.equal(true);
          done();
        }, 100);
      });
    });

    describe('setId', function () {

      it('Should exist', function () {
        expect(outgoingCall.setId).to.be.a('function');
      });

      it('should set the newly created call id on the call', function () {
        var callId = '12345';

        outgoingCall.setId(callId);

        expect(outgoingCall.id).to.equal(callId);
      });

      it('Should publish the `connecting` event if call id is not null', function (done) {
        var callId = '12345';

        outgoingCall.setId(callId);

        setTimeout(function () {
          try {
            expect(onConnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('Should publish the `disconnected` event if call id is null', function (done) {
        outgoingCall.setId(null);

        setTimeout(function () {
          try {
            expect(onDisconnectedSpy.called).to.equal(true);
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

      it('Should publish the `connected` event on setting the remote SDP', function (done) {
        outgoingCall.setRemoteSdp(remoteSdp);

        setTimeout(function () {
          try {
            expect(outgoingCall.remoteSdp).to.equal(remoteSdp);
            expect(onConnectedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });

  });

});
