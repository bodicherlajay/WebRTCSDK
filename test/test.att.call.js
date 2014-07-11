/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call', function () {

  'use strict';

  var factories,
    apiConfig,
    options,
    optionsforRTCM,
    emitterEM,
    eventManager,
    rtcMgr,
    getRTCManagerStub,
    createEventEmitterStub,
    createEventManagerStub,
    call,
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

    options = {
      peer: '12345',
      mediaType: 'audio',
      type: ATT.CallTypes.OUTGOING
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

    call = new ATT.rtc.Call(options);

    onDialingSpy = sinon.spy();
    onAnsweringSpy = sinon.spy();
    onConnectingSpy = sinon.spy();
    onConnectedSpy = sinon.spy();
    onMutedSpy = sinon.spy();
    onUnmutedSpy = sinon.spy()
    onDisconnectingSpy = sinon.spy();
    onDisconnectedSpy = sinon.spy();

    call.on('dialing', onDialingSpy);
    call.on('answering', onAnsweringSpy);
    call.on('connecting', onConnectingSpy);
    call.on('connected', onConnectedSpy);
    call.on('muted', onMutedSpy);
    call.on('unmuted', onUnmutedSpy);
    call.on('disconnecting', onDisconnectingSpy);
    call.on('disconnected', onDisconnectedSpy);
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
      expect(call).to.be.an('object');
      expect(call.id).to.equal(options.id);
      expect(call.peer).to.equal(options.peer);
      expect(call.mediaType).to.equal(options.mediaType);
      expect(call.type).to.equal(options.type);
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
        expect(call.on).to.be.a('function');
      });

      it('Should fail if event is not recognized', function () {
        expect(call.on.bind(call, 'unknown')).to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy(),
          subscribeSpy = sinon.spy(emitterEM, 'subscribe'),
          unsubscribeSpy = sinon.spy(emitterEM, 'unsubscribe');

        expect(call.on.bind(call, 'dialing', fn)).to.not.throw(Error);

        expect(unsubscribeSpy.called).to.equal(true);
        expect(subscribeSpy.called).to.equal(true);

        unsubscribeSpy.restore();
        subscribeSpy.restore();
      });
    });

    describe('Connect', function () {

      var connectCallStub,
        setIdSpy,
        localSdp,
        onStub,
        connectOptions;

      before(function () {

        localSdp = 'xyz';
        connectOptions = {
          localMedia: '#foo',
          remoteMedia: '#bar'
        };

        connectCallStub = sinon.stub(rtcMgr, 'connectCall', function (options) {
          options.onCallConnecting({
            callId: '1234',
            localSdp: localSdp
          });
        });

        onStub = sinon.stub(rtcMgr, 'on');

        setIdSpy = sinon.spy(call, 'setId');
      });

      after(function () {
        connectCallStub.restore();
        setIdSpy.restore();
        onStub.restore();
      });

      it('Should exist', function () {
        expect(call.connect).to.be.a('function');
      });

      it('Should trigger `dialing` event immediately if callType is Outgoing', function (done) {

        call.connect(options);

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
        call.type = ATT.CallTypes.INCOMING;
        call.connect(connectOptions);

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
        call.connect(connectOptions);
        expect(call.localMedia).to.equal('#foo');
        expect(call.remoteMedia).to.equal('#bar');
      });

      it('should register for event `remote-sdp-set` from RTCManager', function () {
        expect(onStub.calledWith('remote-sdp-set')).to.equal(true);
        expect(onStub.getCall(0).args[1]).to.be.a('function');
      });

      it('should execute RTCManager.connectCall', function () {
        expect(connectCallStub.called).to.equal(true);
      });

      describe('success on connectCall', function () {

        it('should execute Call.setId with the newly created call id', function () {
          expect(setIdSpy.called).to.equal(true);
        });

        it('should set the newly created LocalSdp on the call', function () {
          expect(call.localSdp).to.equal(localSdp);
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
          expect(call.mute).to.be.a('function');
        });

        it('should execute RTCManager.muteCall', function () {
          call.mute();
          expect(muteCallStub.getCall(0).args[0]).to.be.an('object');
        });

        describe('success on RTCManager.muteCall', function () {
          it('should set the call state to ATT.CallTypes.MUTED', function () {
            expect(call.state).to.equal(ATT.CallStates.MUTED);
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
          expect(call.unmute).to.be.a('function');
        });

        it('should execute RTCManager.unmuteCall', function () {
          call.unmute();
           expect(unmuteCallStub.getCall(0).args[0]).to.be.an('object');
        });

        describe('success on RTCManager.unmuteCall', function () {
          it('should set the call state to ATT.CallTypes.ONGOING', function () {
            expect(call.state).to.equal(ATT.CallStates.ONGOING);
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
        call.on('resume', callresumeHandlerSpy);

        callholdHandlerSpy = sinon.spy();
        call.on('hold', callholdHandlerSpy);

        rtcOnSpy = sinon.spy(rtcMgr, 'on');

        holdCallStub = sinon.stub(rtcMgr, 'holdCall', function () {
          emitterEM.publish('hold');
        });

        resumeCallStub = sinon.stub(rtcMgr, 'resumeCall', function () {
          emitterEM.publish('resume');
        });

        call.hold();
        call.resume();
      });

      after(function () {
        rtcOnSpy.restore();
        holdCallStub.restore();
        resumeCallStub.restore();
      });


      describe('hold', function () {
        it('should exist', function () {
          expect(call.hold).to.be.a('function');
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
          expect(call.resume).to.be.a('function');
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
        setRemoteSdpSpy = sinon.spy(call, 'setRemoteSdp');
        onEstablishedHandlerSpy = sinon.spy();
        connectCallStub = sinon.stub(rtcMgr, 'connectCall', function () {});

        call.on('established', onEstablishedHandlerSpy);

        call.connect(options);
      });

      after(function () {
        setRemoteSdpSpy.restore();
        connectCallStub.restore();
      });

      it('should execute setRemoteSdp on getting a `remote-sdp-set` event from eventManager', function (done) {

        emitterEM.publish('remote-sdp-set', remoteSdp);

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
    });

    describe('disconnect', function () {
      var disconnectCallStub,
        rtcOnSpy;

      before(function () {
        disconnectCallStub = sinon.stub(rtcMgr, 'disconnectCall', function () {
          emitterEM.publish('call-disconnected');
        });
        rtcOnSpy = sinon.spy(rtcMgr, 'on');

        call.disconnect();
      });

      after(function () {
        disconnectCallStub.restore();
        rtcOnSpy.restore();
      });

      it('Should exist', function () {
        expect(call.disconnect).to.be.a('function');
      });

      it('Should trigger `disconnecting` event immediately', function (done) {
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
        expect(rtcOnSpy.calledWith('call-disconnected')).to.equal(true)
      });

      it('should set the callId to null when rtcManager publishes `call-disconnected` event', function (done) {
        setTimeout(function () {
          try {
            expect(call.id).to.equal(null);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should call rtcManager.disconnectCall', function () {
        call.disconnect();
        expect(disconnectCallStub.called).to.equal(true);
      });
    });

    describe('setId', function () {

      it('Should exist', function () {
        expect(call.setId).to.be.a('function');
      });

      it('should set the newly created call id on the call', function () {
        var callId = '12345';

        call.setId(callId);

        expect(call.id).to.equal(callId);
      });

      it('Should publish the `connecting` event if call id is not null', function (done) {
        var callId = '12345';

        call.setId(callId);

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
        call.setId(null);

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
        expect(call.setRemoteSdp).to.be.a('function');
      });

      it('Should publish the `connected` event on setting the remote SDP', function (done) {
        call.setRemoteSdp(remoteSdp);

        setTimeout(function () {
          try {
            expect(call.remoteSdp).to.equal(remoteSdp);
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
