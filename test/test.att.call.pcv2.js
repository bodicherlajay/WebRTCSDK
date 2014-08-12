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
    emitterCall,
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
    var outgoingVideoCall,
      optionsOutgoingVideo,
      onErrorHandlerSpy,
      errorData,
      error;

    beforeEach(function () {

      error = 'Test Error';
      errorData = {
        error: error
      };

      optionsOutgoingVideo = {
        breed: 'call',
        peer: '12345',
        mediaType: 'video',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'}
      };

      outgoingVideoCall = new Call(optionsOutgoingVideo);

      onErrorHandlerSpy = sinon.spy();

      outgoingVideoCall.on('error', onErrorHandlerSpy);

    });

    describe('connect', function () {
      var createPeerConnectionStub;

      describe('connect [OUTGOING]', function () {

        it('should execute createPeerConnection with mediaConstraints and localStream if pcv == 2 for an outgoing call', function () {

          createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection');

          outgoingVideoCall.connect();

          expect(createPeerConnectionStub.called).to.equal(true);

          createPeerConnectionStub.restore();
        });

        it('should NOT execute createPeerConnection if pcv != 2 for an outgoing call', function () {
          ATT.private.pcv = 1;
          createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection');

          outgoingVideoCall.connect();

          expect(createPeerConnectionStub.called).to.equal(false);

          createPeerConnectionStub.restore();
          ATT.private.pcv = 2;
        });

        it('should NOT execute rtcManager.connectCall if pcv == 2 for an outgoing call', function () {
          var connectCallStub = sinon.stub(rtcMgr, 'connectCall');

          createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection');

          outgoingVideoCall.connect();

          expect(connectCallStub.called).to.equal(false);

          connectCallStub.restore();
          createPeerConnectionStub.restore();
        });

        describe('createPeerConnection: success', function () {
          it('should call `connectConference` with the required params', function () {
            var connectConferenceStub = sinon.stub(rtcMgr, 'connectConference');

            createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
              options.onSuccess();
            });

            outgoingVideoCall.connect();

            expect(connectConferenceStub.called).to.equal(true);

            connectConferenceStub.restore();
            createPeerConnectionStub.restore();
          });
        });

      });

    });

    describe('mute', function () {
      var getAudioTracksSpy,
        audioTracks,
        localStream;

      beforeEach(function () {
        audioTracks = [{ enabled: true}];
        localStream = {getAudioTracks : function () { return audioTracks; }};

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
        audioTracks = [{ enabled: true}];
        localStream = {getAudioTracks : function () { return audioTracks; }};

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
        acceptSdpOffer: function () {}
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

  });

});

