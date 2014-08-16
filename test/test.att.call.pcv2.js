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
    createEventEmitterStub,
    peerConnection,
    createPeerConnectionStub,
    rtcpcStub,
    rtcPC;

  before(function () {
    ATT.private.pcv = 2;
  });

  after(function () {
    ATT.private.pcv = 1;
  });

  beforeEach(function () {
    rtcPC = {
      setLocalDescription: function () { return; },
      getLocalDescription : function () { return; },
      onicecandidate: null,
      localDescription : '12X3',
      setRemoteDescription : function () { return; },
      getRemoteDescription : function () { return; },
      addStream : function () {return; },
      onaddstream : function () {return;},
      createOffer : function () {return }
    };

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

    rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
      return rtcPC;
    });

  });

  afterEach(function () {
    rtcpcStub.restore();
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
      var sdpFilter, sdp, holdCallSDPStub, modSdp, actPassStub;

      beforeEach(function () {

        sdpFilter = ATT.sdpFilter.getInstance();
        sdp = { sdp: 'a=sendrecv\r\nb=helloworld\r\no=2323\r\ns=34343535' };
        modSdp = { sdp: 'a=recvonly\r\nb=helloworld\r\no=2323\r\ns=34343535' };
        outgoingVideoCall.localSdp = function () { return sdp };

        holdCallSDPStub = sinon.stub(sdpFilter, 'modifyForHoldCall', function () {
          return modSdp;
        });

        actPassStub = sinon.stub(sdpFilter, 'setupActivePassive');

      });

      afterEach(function () {
        holdCallSDPStub.restore();
        actPassStub.restore();
      });

      it('should call sdpFilter.modifyForHoldCall() method', function () {
        outgoingVideoCall.hold();


        expect(holdCallSDPStub.calledWith(sdp)).to.equal(true);
      });

      it('should call rtcManager.holdcall() with valid parameters', function () {
        var rtcHoldCallStub = sinon.stub(rtcMgr, 'holdCall');

        outgoingVideoCall.setId('123');

        outgoingVideoCall.hold();

        expect(rtcHoldCallStub.getCall(0).args[0].description).to.be.an('object');
        expect(rtcHoldCallStub.getCall(0).args[0].callId).to.equal('123');
        expect(rtcHoldCallStub.getCall(0).args[0].sessionId).to.be.an('string');
        expect(rtcHoldCallStub.getCall(0).args[0].token).to.be.a('string');
        expect(rtcHoldCallStub.getCall(0).args[0].onSuccess).to.be.a('function');
        expect(rtcHoldCallStub.getCall(0).args[0].onError).to.be.a('function');
        rtcHoldCallStub.restore();
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

    describe('resume', function () {
      var sdpFilter, sdp, resumeCallSDPStub, modSdp,
        rtcMgrResumeCallStub, actPassStub;

      beforeEach(function () {
        sdpFilter = ATT.sdpFilter.getInstance();
        sdp = { sdp: 'a=sendonly\r\nb=helloworld\r\no=2323\r\ns=34343535' };
        modSdp = { sdp: 'a=sendrecv\r\nb=helloworld\r\no=2323\r\ns=34343535' };
        outgoingVideoCall.localSdp = function () { return sdp };

        resumeCallSDPStub = sinon.stub(sdpFilter, 'modifyForResumeCall', function () {
          return modSdp;
        });

        actPassStub = sinon.stub(sdpFilter, 'setupActivePassive');

        rtcMgrResumeCallStub = sinon.stub(rtcMgr, 'resumeCall');
      });

      afterEach(function () {
        resumeCallSDPStub.restore();
        rtcMgrResumeCallStub.restore();
        actPassStub.restore();
      });

      it('should call sdpFilter.modifyForResumeCall() method', function () {
        outgoingVideoCall.resume();

        expect(resumeCallSDPStub.calledWith(sdp)).to.equal(true);
      });

      it('should call rtcManager.resumeCall() with valid parameters', function () {

        outgoingVideoCall.setId('12345');

        outgoingVideoCall.resume();

        expect(rtcMgrResumeCallStub.getCall(0).args[0].description).to.be.an('object');
        expect(rtcMgrResumeCallStub.getCall(0).args[0].callId).to.equal('12345');
        expect(rtcMgrResumeCallStub.getCall(0).args[0].sessionId).to.be.an('string');
        expect(rtcMgrResumeCallStub.getCall(0).args[0].token).to.be.a('string');
        expect(rtcMgrResumeCallStub.getCall(0).args[0].onSuccess).to.be.a('function');
        expect(rtcMgrResumeCallStub.getCall(0).args[0].onError).to.be.a('function');
      });

      it('should publish error on onError callback called ', function (done) {

        rtcMgrResumeCallStub.restore();

        rtcMgrResumeCallStub = sinon.stub(rtcMgr, 'resumeCall', function (options) {
          options.onError(error);
        });

        outgoingVideoCall.resume();
        setTimeout(function () {
          expect(onErrorHandlerSpy.called).to.equal(true);
          expect(onErrorHandlerSpy.calledWith(errorData)).to.equal(true);
          done();
          rtcMgrResumeCallStub.restore();
        }, 50);
      });
    });
  });

  describe('Events', function () {

    var incomingCall,
      remoteDesc,
      peerConnection,
      responseData,
      createPeerConnectionStub,
      connectConferenceStub;

    beforeEach(function () {
      remoteDesc = {
        sdp: 'sdf',
        type: 'offer'
      };

      responseData = {
        id: '12345'
      };

      peerConnection = {
        getRemoteDescription: function () {
          return remoteDesc;
        },
        setRemoteDescription: function () {},
        acceptSdpOffer: function () {},
        close: function () {}
      };

      createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
        setTimeout(function () {
          options.onSuccess();
        }, 0);
        return peerConnection;
      });

      connectConferenceStub = sinon.stub(rtcMgr, 'connectConference', function (options) {
        setTimeout(function () {
          options.onSuccess(responseData);
        }, 0);
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
      connectConferenceStub.restore();
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

    describe('session-terminated', function () {

      it('should execute `peerConnection.close` if pcv == 2', function (done) {
        var peerConnectionCloseStub = sinon.stub(peerConnection, 'close');

        setTimeout(function () {
          emitterEM.publish('session-terminated:' + incomingCall.id());

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
        }, 10);

      });
    });

  });

});

