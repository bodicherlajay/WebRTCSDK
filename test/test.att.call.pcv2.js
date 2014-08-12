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


    rtcMgr = new ATT.private.RTCManager(optionsRTCM);

    emitterCall = factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitterCall;
    });

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

    describe('hold', function () {
      var sdpFilter, sdp;

      beforeEach(function () {
        sdpFilter = ATT.sdpFilter.getInstance();
        sdp = { sdp: 'a=sendrecv\r\nb=helloworld\r\no=2323\r\ns=34343535' };
        outgoingVideoCall.localDescription = sdp;
      });
      it('should call sdpFilter.holdCallSDP() method', function () {
        var holdCallSDPStub,
          setLocalDescriptionStub,
          modsdp = '123',
          peerconnection = {setLocalDescription : function () { return; }};
        outgoingVideoCall.peerConnection = peerconnection;

        console.log('object ' + JSON.stringify(outgoingVideoCall));
        setLocalDescriptionStub = sinon.stub(outgoingVideoCall.peerConnection, 'setLocalDescription');

        holdCallSDPStub = sinon.stub(sdpFilter, 'holdCall', function () {
          return modsdp;
        });
        outgoingVideoCall.hold();

        expect(holdCallSDPStub.calledWith(sdp)).to.equal(true);
        expect(setLocalDescriptionStub.calledWith(modsdp)).to.equal(true);

        setLocalDescriptionStub.restore();
        holdCallSDPStub.restore();
      });
    });
  });
});

