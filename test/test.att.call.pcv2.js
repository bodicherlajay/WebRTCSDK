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
  });

});

