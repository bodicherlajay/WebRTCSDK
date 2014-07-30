/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call [Conference]', function () {
  "use strict";

  var Call,
    createPeerConnectionStub,
    restClientStub;

  beforeEach(function () {
    restClientStub = sinon.stub(RESTClient.prototype, 'ajax');
    Call = ATT.rtc.Call;
    createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection', function () {
      return {};
    });
  });

  afterEach(function () {
    createPeerConnectionStub.restore();
    restClientStub.restore();
  });

  describe('Constructor', function () {

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
      expect(conference.participants).to.be.a('function');
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
      call,
      emitter,
      createEEStub,
      publishStub,
      setStateStub;

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

      options = {
        breed: 'conference',
        peer: '12345',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'},
        id: '1234'
      };

      emitter = ATT.private.factories.createEventEmitter();

      createEEStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitter;
      });

      publishStub = sinon.stub(emitter, 'publish');

      addParticipantStub = sinon.stub(rtcMgr, 'addParticipant', function (options) {
        options.onParticipantPending();
      });

      conference = new ATT.rtc.Call(options);
    });

    afterEach(function () {
      addParticipantStub.restore();
      getRTCManagerStub.restore();
      createEEStub.restore();
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
        expect(addParticipantStub.getCall(0).args[0].onParticipantPending).to.be.a('function');
        expect(addParticipantStub.getCall(0).args[0].onError).to.be.a('function');
      });

      describe('Success on rtcManager.addParticipant', function () {
        it('should publish `participant-pending` when rtcMgr invokes `onParticipantPending` callback', function () {
          setStateStub = sinon.stub(conference, 'setState');

          conference.addParticipant('12345');

          expect(setStateStub.calledOnce).to.equal(true);
          expect(setStateStub.calledWith('participant-pending')).to.equal(true);
        });
      });

      describe('Error handling', function () { });
    });

    describe('setParticipant', function () {
      it('should exist', function () {
        expect(conference.setParticipant).to.be.a('function');
      });
    });
  });
});