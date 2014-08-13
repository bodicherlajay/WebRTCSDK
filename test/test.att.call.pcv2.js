/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call [PCV2]', function () {
  'use strict';

  var apiConfig,
    factories,
    Call,
    rtcMgr,
    resourceManager,
    optionsRTCM,
    getRTCManagerStub,
    emitterEM,
    createEventEmitterStub;

  before(function () {
    ATT.private.pcv = 2;
  });

  after(function () {
    ATT.private.pcv = 1;
  });

  beforeEach(function () {
    apiConfig = ATT.private.config.api;
    factories = ATT.private.factories;

    Call = ATT.rtc.Call;

    resourceManager = factories.createResourceManager(apiConfig);

    optionsRTCM = {
      resourceManager: resourceManager,
      userMediaSvc: ATT.UserMediaService,
      peerConnSvc: ATT.PeerConnectionService
    };

    emitterEM = factories.createEventEmitter();
    createEventEmitterStub =  sinon.stub(factories, 'createEventEmitter', function () {
      return emitterEM;
    });

    rtcMgr = new ATT.private.RTCManager(optionsRTCM);

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return rtcMgr;
    });
  });

  afterEach(function () {
    getRTCManagerStub.restore();
    createEventEmitterStub.restore();
  });

  describe('Methods', function () {
    var createPeerConnectionStub,
      peerConnection,
      outgoingVideoCall,
      optionsOutgoingVideo,
      onErrorHandlerSpy,
      errorData,
      error;

    beforeEach(function () {

      error = 'Test Error';
      errorData = {
        error: error
      };

      peerConnection = {
        getRemoteDescription: function () { return; },
        setRemoteDescription: function () {},
        close: function () {}
      };

      createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function () {
        return peerConnection;
      });

      optionsOutgoingVideo = {
        breed: 'call',
        peer: '12345',
        mediaType: 'video',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo: {sessionId: '12345', token: '123'}
      };

      outgoingVideoCall = new Call(optionsOutgoingVideo);
      outgoingVideoCall.id = '123';

      onErrorHandlerSpy = sinon.spy();

      outgoingVideoCall.on('error', onErrorHandlerSpy);

    });

    afterEach(function () {
      createPeerConnectionStub.restore();
    });

    describe('connect', function () {

      describe('connect [OUTGOING]', function () {

        it('should execute createPeerConnection with mediaConstraints and localStream if pcv == 2 for an outgoing call', function () {
          outgoingVideoCall.connect();

          expect(createPeerConnectionStub.called).to.equal(true);
        });

        it('should NOT execute createPeerConnection if pcv != 2 for an outgoing call', function () {
          ATT.private.pcv = 1;

          outgoingVideoCall.connect();

          expect(createPeerConnectionStub.called).to.equal(false);

          ATT.private.pcv = 2;
        });

        it('should NOT execute rtcManager.connectCall if pcv == 2 for an outgoing call', function () {
          var connectCallStub = sinon.stub(rtcMgr, 'connectCall');

          outgoingVideoCall.connect();

          expect(connectCallStub.called).to.equal(false);

          connectCallStub.restore();
        });

        describe('createPeerConnection: success', function () {

          var connectConferenceStub;

          beforeEach(function () {
            connectConferenceStub = sinon.stub(rtcMgr, 'connectConference');
          });

          afterEach(function () {
            connectConferenceStub.restore();
          });

          describe('canceled == true', function () {

            var cancelCallStub,
              closeStub;

            beforeEach(function () {
              cancelCallStub = sinon.stub(rtcMgr, 'cancelCall');

              createPeerConnectionStub.restore();

              createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
                outgoingVideoCall.disconnect();
                setTimeout(function () {
                  options.onSuccess();
                }, 10);
                return peerConnection;
              });
              closeStub = sinon.stub(peerConnection, 'close');
            });

            afterEach(function () {
              cancelCallStub.restore();
              closeStub.restore();
            });

            it('should NOT execute `rtcManager.connectConference` if canceled == true', function (done) {
              outgoingVideoCall.connect();

              setTimeout(function () {
                try {
                  expect(connectConferenceStub.called).to.equal(false);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 20);
            });

            it('should reset canceled flag to false', function (done) {
              outgoingVideoCall.connect();

              setTimeout(function () {
                try {
                  expect(outgoingVideoCall.canceled()).to.equal(false);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 20);
            });

            it('should publish `canceled` event with relevant data', function (done) {
              var canceledHandlerSpy = sinon.spy();

              outgoingVideoCall.on('canceled', canceledHandlerSpy);

              outgoingVideoCall.connect();

              setTimeout(function () {
                try {
                  expect(canceledHandlerSpy.called).to.equal(true);
                  expect(canceledHandlerSpy.getCall(0).args[0]).to.be.an('object');
                  expect(canceledHandlerSpy.getCall(0).args[0].to).to.equal(outgoingVideoCall.peer());
                  expect(canceledHandlerSpy.getCall(0).args[0].mediaType).to.equal(outgoingVideoCall.mediaType());
                  expect(canceledHandlerSpy.getCall(0).args[0].codec).to.equal(outgoingVideoCall.codec());
                  expect(canceledHandlerSpy.getCall(0).args[0].timestamp).to.be.a('date');
                  done();
                } catch (e) {
                  done(e);
                }
              }, 20);

            });

            it('should execute `peerConnection.close`', function (done) {
              outgoingVideoCall.connect();
              setTimeout(function () {
                try {
                  expect(closeStub.called).to.equal(true);
                  done();
                } catch (e) {
                  done(e);
                }
              }, 20);

            });

          });

          describe('canceled == false', function () {

            beforeEach(function () {
              createPeerConnectionStub.restore();

              createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
                options.onSuccess();
              });
            });

            it('should call `connectConference` with the required params', function () {
              outgoingVideoCall.connect();

              expect(connectConferenceStub.called).to.equal(true);
            });
          });

        });

      });

    });

    describe('mute', function () {
      var getAudioTracksSpy,
        audioTracks,
        localStream;

      beforeEach(function () {
        audioTracks = [
          { enabled: true}
        ];
        localStream = {getAudioTracks: function () {
          return audioTracks;
        }};

        outgoingVideoCall.addStream(localStream);
      });


      it('should call getAudioTracks if there is a localStream and set stream to false', function () {
        getAudioTracksSpy = sinon.spy(localStream, 'getAudioTracks');
        outgoingVideoCall.mute();

        expect(getAudioTracksSpy.called).to.equal(true);
        expect(audioTracks[0].enabled).to.equal(false);
        getAudioTracksSpy.restore();
      });

      it('should call setState With `muted`', function () {
        getAudioTracksSpy = sinon.spy(localStream, 'getAudioTracks');
        outgoingVideoCall.mute();

        expect(outgoingVideoCall.getState()).to.equal('muted');
        getAudioTracksSpy.restore();
      });

      it('Should publish `error` with error data if there is an error in operation', function (done) {
        var getAudioTracksStub;

        getAudioTracksStub = sinon.stub(localStream, 'getAudioTracks', function () {
          throw error;
        });

        outgoingVideoCall.mute();

        setTimeout(function () {
          try {
            expect(onErrorHandlerSpy.called).to.equal(true);
            expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
            done();
          } catch (e) {
            done(e);
          } finally {
            getAudioTracksStub.restore();
          }
        }, 100);

      });

    });

    describe('unmute', function () {
      var getAudioTracksSpy,
        audioTracks,
        localStream;

      beforeEach(function () {
        audioTracks = [
          { enabled: true}
        ];
        localStream = {getAudioTracks: function () {
          return audioTracks;
        }};

        outgoingVideoCall.addStream(localStream);
      });

      it('should call getAudioTracks if there is a localStream and set stream to true', function () {
        getAudioTracksSpy = sinon.spy(localStream, 'getAudioTracks');
        outgoingVideoCall.unmute();

        expect(getAudioTracksSpy.called).to.equal(true);
        expect(audioTracks[0].enabled).to.equal(true);
        getAudioTracksSpy.restore();
      });

      it('should call setState With `unmuted`', function () {
        getAudioTracksSpy = sinon.spy(localStream, 'getAudioTracks');
        outgoingVideoCall.unmute();

        expect(outgoingVideoCall.getState()).to.equal('unmuted');
        getAudioTracksSpy.restore();
      });

      it('Should publish `error` with error data if there is an error in operation', function (done) {
        var getAudioTracksStub;

        getAudioTracksStub = sinon.stub(localStream, 'getAudioTracks', function () {
          throw error;
        });

        outgoingVideoCall.unmute();

        setTimeout(function () {
          try {
            expect(onErrorHandlerSpy.called).to.equal(true);
            expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
            done();
          } catch (e) {
            done(e);
          } finally {
            getAudioTracksStub.restore();
          }
        }, 100);

      });

    });

    describe('hold', function () {
      var sdpFilter, sdp, peerconnection, holdCallSDPStub, modsdp;

      beforeEach(function () {
        modsdp = '123';
        sdpFilter = ATT.sdpFilter.getInstance();
        sdp = { sdp: 'a=sendrecv\r\nb=helloworld\r\no=2323\r\ns=34343535' };
        outgoingVideoCall.localDescription = sdp;
        peerconnection = {setLocalDescription: function () {
          return;
        }};
        outgoingVideoCall.peerConnection = peerconnection;

        holdCallSDPStub = sinon.stub(sdpFilter, 'holdCall', function () {
          return modsdp;
        });


      });

      afterEach(function () {
        holdCallSDPStub.restore();
      });
      it('should call sdpFilter.holdCallSDP() method', function () {
        outgoingVideoCall.hold();

        expect(holdCallSDPStub.calledWith(sdp)).to.equal(true);
      });
      it('should set local description on peerConnection', function () {
        var setLocalDescriptionStub;

        setLocalDescriptionStub = sinon.stub(outgoingVideoCall.peerConnection, 'setLocalDescription');
        outgoingVideoCall.hold();

        expect(holdCallSDPStub.calledWith(sdp)).to.equal(true);
        expect(setLocalDescriptionStub.calledWith(modsdp)).to.equal(true);

        setLocalDescriptionStub.restore();
      });

      it('should call rtcmanager.holdcall() with valid parameters', function () {
        var options, rtcHoldCallStub = sinon.stub(rtcMgr, 'holdCall');
        outgoingVideoCall.sdp = '123';
        outgoingVideoCall.setId('123');
        options = {
          description: outgoingVideoCall.localDescription,
          sessionId: optionsOutgoingVideo.sessionInfo.sessionId,
          callId: outgoingVideoCall.id,
          token: optionsOutgoingVideo.sessionInfo.token,
          onSuccess: function () {
            return;
          },
          onError: function () {
            return;
          }
        };
        outgoingVideoCall.hold();

        expect(rtcHoldCallStub.called).to.equal(true);

        expect(rtcHoldCallStub.getCall(0).args[0].description).to.not.equal(undefined);
        expect(rtcHoldCallStub.getCall(0).args[0].description).to.equal(outgoingVideoCall.sdp);

        expect(rtcHoldCallStub.getCall(0).args[0].callId).to.not.equal(undefined);
        expect(rtcHoldCallStub.getCall(0).args[0].callId).to.equal(options.callId);

        expect(rtcHoldCallStub.getCall(0).args[0].sessionId).to.not.equal(undefined);
        expect(rtcHoldCallStub.getCall(0).args[0].sessionId).to.equal(options.sessionId);

        expect(rtcHoldCallStub.getCall(0).args[0].token).to.not.equal(undefined);
        expect(rtcHoldCallStub.getCall(0).args[0].token).to.equal(options.token);

        expect(rtcHoldCallStub.getCall(0).args[0].onSuccess).to.be.an('function');
        expect(rtcHoldCallStub.getCall(0).args[0].onError).to.be.an('function');
        rtcHoldCallStub.restore();
      });

      it('should setState to `held` on success callback for hold', function (done) {
        var rtcholdStub,
          onHeldSpy = sinon.spy();

        outgoingVideoCall.on('held', onHeldSpy);
        rtcholdStub = sinon.stub(rtcMgr, 'holdCall', function (options) {
          options.onSuccess();
        });

        outgoingVideoCall.hold();
        setTimeout(function () {
          expect(onHeldSpy.called).to.equal(true);
          done();
          rtcholdStub.restore();
        }, 50);


      });

      it('should publish error on onError callback called ', function (done) {
        var rtcholdStub;

        rtcholdStub = sinon.stub(rtcMgr, 'holdCall', function (options) {
          options.onError(error);
        });

        outgoingVideoCall.hold();
        setTimeout(function () {
          expect(onErrorHandlerSpy.called).to.equal(true);
          expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
          done();
          rtcholdStub.restore();
        }, 50);

      });
    });

  });

  describe('Events', function () {

    var incomingCall,
      remoteDesc,
      peerConnection,
      createPeerConnectionStub;

    beforeEach(function () {
      remoteDesc = {
        sdp: 'sdf',
        type: 'offer'
      };

      peerConnection = {
        getRemoteDescription: function () {
          return remoteDesc;
        },
        setRemoteDescription: function () {},
        acceptSdpOffer: function () {},
        close: function () {}
      };

      createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function () {
        return peerConnection;
      });

      incomingCall = new ATT.rtc.Call({
        breed: 'call',
        peer: '12345',
        mediaType: 'audio',
        type: ATT.CallTypes.INCOMING,
        remoteSdp: 'abc',
        sessionInfo: {sessionId: '12345'}
      });

      incomingCall.connect();
    });

    afterEach(function () {
      createPeerConnectionStub.restore();
    });

    describe('media-modifications', function () {

      var acceptSdpOfferStub,
        setMediaModStub;

      beforeEach(function () {
        acceptSdpOfferStub = sinon.stub(peerConnection, 'acceptSdpOffer');
        setMediaModStub = sinon.stub(rtcMgr, 'setMediaModifications');
      });

      afterEach(function () {
        acceptSdpOfferStub.restore();
        setMediaModStub.restore();
      });

      it('should execute `peerConnection.acceptSdpOffer` if pcv == 2 for breed == call', function (done) {
        emitterEM.publish('media-modifications', {
          remoteSdp: 'abdc',
          modificationId: 'ID'
        });

        setTimeout(function () {
          try {
            expect(acceptSdpOfferStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      it('should NOT execute `peerConnection.acceptSdpOffer` if pcv == 1 for breed == call', function (done) {
        ATT.private.pcv = 1;

        emitterEM.publish('media-modifications', {
          remoteSdp: 'abdc',
          modificationId: 'ID'
        });

        setTimeout(function () {
          try {
            expect(acceptSdpOfferStub.called).to.equal(false);
            done();
          } catch (e) {
            done(e);
          } finally {
            ATT.private.pcv = 2;
          }
        }, 10);
      });

    });

    describe('media-mod-terminations', function () {

      var setRemoteDescStub;

      beforeEach(function () {
        setRemoteDescStub = sinon.stub(peerConnection, 'setRemoteDescription');
      });

      afterEach(function () {
        setRemoteDescStub.restore();
      });

      it('should execute peerConnection.setRemoteDescription if pcv == 2 for breed = call', function (done) {
        emitterEM.publish('media-mod-terminations', {
          remoteSdp: 'abdcX',
          type: 'call',
          modificationId: 'ID',
          reason: 'abdc',
          from: 'me'
        });

        setTimeout(function () {
          try {
            expect(setRemoteDescStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);

      });

      it('should NOT execute peerConnection.setRemoteDescription if pcv == 1 for breed = call', function (done) {
        ATT.private.pcv = 1;

        emitterEM.publish('media-mod-terminations', {
          remoteSdp: 'abdcX',
          type: 'call',
          modificationId: 'ID',
          reason: 'abdc',
          from: 'me'
        });

        setTimeout(function () {
          try {
            expect(setRemoteDescStub.called).to.equal(false);
            done();
          } catch (e) {
            done(e);
          } finally {
            ATT.private.pcv = 2;
          }
        }, 10);

      });
    });

    describe('call-disconnected', function () {

      it('should execute `peerConnection.close` if pcv == 2', function (done) {
        var peerConnectionCloseStub = sinon.stub(peerConnection, 'close');

        emitterEM.publish('call-disconnected');

        setTimeout(function () {
          try {
            expect(peerConnectionCloseStub.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          } finally {
            peerConnectionCloseStub.restore();
          }
        }, 10);

      });
    });

  });

});

