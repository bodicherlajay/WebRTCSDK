/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call [Conference]', function () {
  "use strict";

  var Call,
    createPeerConnectionStub;

  beforeEach(function () {
    Call = ATT.rtc.Call;
    createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection');
  });

  afterEach(function () {
    createPeerConnectionStub.restore();
  });

  describe('Constructor', function () {

    var Call, rtcMgr, getRTCManagerStub,
      optionsforRTCM, resourceManager, factories, apiConfig, createResourceManagerStub;

    beforeEach(function () {
      Call = ATT.rtc.Call;
      apiConfig = ATT.private.config.api;
      factories = ATT.private.factories;

      resourceManager = factories.createResourceManager(apiConfig);

      createResourceManagerStub = sinon.stub(factories, 'createResourceManager', function () {
        return resourceManager;
      });


      optionsforRTCM = {
        resourceManager: resourceManager,
        userMediaSvc: ATT.UserMediaService,
        peerConnSvc: ATT.PeerConnectionService
      };

      rtcMgr = new ATT.private.RTCManager(optionsforRTCM);

      getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
        return rtcMgr;
      });
    });

    afterEach(function () {
      getRTCManagerStub.restore();
      createResourceManagerStub.restore();
    });
    it('should create conference Call object with valid parameters ', function () {
      var options,
        conference;

      options = {
        breed: 'conference',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'}
      };

      conference = new Call(options);

      expect(conference instanceof Call).to.equal(true);
      expect(conference.breed()).to.equal('conference');
    });
    it('should call `rtcManager.connectConference` ', function () {
      var connectConferenceStub = sinon.stub(rtcMgr, 'connectConference', function () {});
      expect(connectConferenceStub.called).to.equal(true);
      connectConferenceStub.restore();
    });
  });

  describe('Methods', function () {

    var options,
      conference,
      addParticipantStub,
      rtcMgr,
      getRTCManagerStub,
      optionsforRTCM,
      resourceManager,
      apiConfig,
      factories,
      call;

    beforeEach(function () {

      apiConfig = ATT.private.config.api;
      factories = ATT.private.factories;
      resourceManager = factories.createResourceManager(apiConfig);

      optionsforRTCM = {
        resourceManager: resourceManager,
        userMediaSvc: ATT.UserMediaService,
        peerConnSvc: ATT.PeerConnectionService
      };

      rtcMgr = new ATT.private.RTCManager(optionsforRTCM);

      getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
        return rtcMgr;
      });

      addParticipantStub = sinon.stub(rtcMgr, 'addParticipant');

      options = {
        breed: 'conference',
        peer: '12345',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'},
        id: '1234'
      };

      conference = new ATT.rtc.Call(options);
    });

    afterEach(function () {
      addParticipantStub.restore();
      getRTCManagerStub.restore();
    });

    describe('addParticipant', function () {

      it('should exist', function () {
        expect(conference.addParticipant).to.be.a('function');
      });

      it('should call rtcManager.addParticipant', function () {
        conference.addParticipant('12345');
        expect(addParticipantStub.called).to.equal(true);
        expect(addParticipantStub.getCall(0).args[0].sessionInfo).to.be.an('object');
        expect(addParticipantStub.getCall(0).args[0].participant).to.equal('12345');
        expect(addParticipantStub.getCall(0).args[0].confId).to.equal(conference.id());
        expect(addParticipantStub.getCall(0).args[0].onError).to.be.a('function');
      });

      describe('Error handling', function () { });
    });
  });
});