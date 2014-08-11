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
    getRTCManagerStub;

  beforeEach(function () {
    apiConfig = ATT.private.config.api;
    factories = ATT.private.factories;

    Call = ATT.rtc.Call;
    ATT.private.pcv = 2;

    resourceManager = factories.createResourceManager(apiConfig);

    optionsRTCM = {
      resourceManager: resourceManager,
      userMediaSvc: ATT.UserMediaService,
      peerConnSvc: ATT.PeerConnectionService
    };

    rtcMgr = new ATT.private.RTCManager(optionsRTCM);

    getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
      return rtcMgr;
    });

  });

  afterEach(function () {
    getRTCManagerStub.restore();
  });

  describe('Methods', function () {
    var outgoingVideoCall,
      optionsOutgoingVideo;

    beforeEach(function () {

      optionsOutgoingVideo = {
        breed: 'call',
        peer: '12345',
        mediaType: 'video',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'}
      };

      outgoingVideoCall = new Call(optionsOutgoingVideo);
    });

    describe('connect', function () {
      var createPeerConnectionStub,
        connectOpts;

      beforeEach(function () {
        connectOpts = {
          pcv: 2
        };
      });

      describe('connect [OUTGOING]', function () {

        it('should execute createPeerConnection with mediaConstraints and localStream if pcv == 2 for an outgoing call', function () {

          createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection');

          outgoingVideoCall.connect(connectOpts);

          expect(createPeerConnectionStub.called).to.equal(true);

          createPeerConnectionStub.restore();
        });

        it('should NOT execute createPeerConnection if pcv != 2 for an outgoing call', function () {

          ATT.private.pcv = 1;
          createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection');

          outgoingVideoCall.connect();

          expect(createPeerConnectionStub.called).to.equal(false);

          createPeerConnectionStub.restore();
        });

        it('should NOT execute rtcManager.connectCall if pcv == 2 for an outgoing call', function () {
          var connectCallStub = sinon.stub(rtcMgr, 'connectCall');

          createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection');

          outgoingVideoCall.connect(connectOpts);

          expect(connectCallStub.called).to.equal(false);

          connectCallStub.restore();
          createPeerConnectionStub.restore();
        });

      });

    });

    describe('mute', function () {
      var getAudioTracksSpy;

      it('should call getAudioTracks if there is a localStream and set stream to false', function () {
        var audioTracks = [{ enabled: true}],
          localStream = {getAudioTracks : function () { return audioTracks; }};

        getAudioTracksSpy = sinon.spy(localStream, 'getAudioTracks');
        outgoingVideoCall.addStream(localStream);
        outgoingVideoCall.mute();

        expect(getAudioTracksSpy.called).to.equal(true);
        expect(audioTracks[0].enabled).to.equal(false);
        getAudioTracksSpy.restore();

      });

      it('should call setState With `muted`', function () {
        var audioTracks = [{ enabled: true}],
          localStream = {getAudioTracks : function () { return audioTracks; }};

        getAudioTracksSpy = sinon.spy(localStream, 'getAudioTracks');
        outgoingVideoCall.addStream(localStream);
        outgoingVideoCall.mute();

        expect(outgoingVideoCall.getState()).to.equal('muted');
        getAudioTracksSpy.restore();
      });

    });

    describe('unmute', function () {
      var getAudioTracksSpy;
      it('should call getAudioTracks if there is a localStream and set stream to true', function () {
        var getAudioTracksSpy, localStream, audioTracks = [{ enabled: false}];

        localStream = {getAudioTracks : function () { return audioTracks; }};
        getAudioTracksSpy = sinon.spy(localStream, 'getAudioTracks');
        outgoingVideoCall.addStream(localStream);

        outgoingVideoCall.unmute();

        expect(getAudioTracksSpy.called).to.equal(true);
        expect(audioTracks[0].enabled).to.equal(true);
        getAudioTracksSpy.restore();
      });

      it('should call setState With `unmuted`', function () {
        var audioTracks = [{ enabled: true}],
          localStream = {getAudioTracks : function () { return audioTracks; }};

        getAudioTracksSpy = sinon.spy(localStream, 'getAudioTracks');
        outgoingVideoCall.addStream(localStream);
        outgoingVideoCall.unmute();

        expect(outgoingVideoCall.getState()).to.equal('unmuted');
        getAudioTracksSpy.restore();
      });

    });
  });

});

