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
      setStateStub,
      modId;

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

      modId = 'abc123';

      emitter = ATT.private.factories.createEventEmitter();

      createEEStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitter;
      });

      publishStub = sinon.stub(emitter, 'publish');

      addParticipantStub = sinon.stub(rtcMgr, 'addParticipant', function (options) {
        options.onParticipantPending(modId);
      });

      conference = new ATT.rtc.Call(options);

      setStateStub = sinon.stub(conference, 'setState');
    });

    afterEach(function () {
      addParticipantStub.restore();
      getRTCManagerStub.restore();
      createEEStub.restore();
      setStateStub.restore();
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
        var setParticipantStub;

        it('should call `setParticipant`', function () {
          setParticipantStub = sinon.stub(conference, 'setParticipant');

          conference.addParticipant('4250001');

          expect(setParticipantStub.calledWith('4250001', 'invitee', modId)).to.equal(true);
        });

        it('should publish `participant-pending` when rtcMgr invokes `onParticipantPending` callback', function () {
          conference.addParticipant('12345');

          expect(setStateStub.calledOnce).to.equal(true);
          expect(setStateStub.calledWith('participant-pending')).to.equal(true);
        });
      });

      describe('Error on rtcManager.addParticipant', function () {
        var error;

        beforeEach(function () {
          addParticipantStub.restore();

          error = {
            message: 'error'
          };

          addParticipantStub = sinon.stub(rtcMgr, 'addParticipant', function (options) {
            options.onError(error);
          });
        });


        it('should publish `error` when rtcMgr invokes `onError` callback', function (done) {

          conference.addParticipant('12345');

          setTimeout(function () {
            try {
              expect(publishStub.calledOnce).to.equal(true);
              expect(publishStub.calledWith('error', error)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });
      });
    });

    describe('setParticipant', function () {

      it('should exist', function () {
        expect(conference.setParticipant).to.be.a('function');
      });

      it('should add the new participant to the list', function () {
        var participants;

        conference.setParticipant('raman@raman.com', 'invitee', 'abc123');
        conference.setParticipant('4250000001', 'accepted', 'cba123');
        conference.setParticipant('toyin@toyin.com', 'accepted', 'efg456');

        participants = conference.participants();
        expect(participants['abc123'].status).equal('invitee');
        expect(participants['cba123'].participant).equal('4250000001');
        expect(participants['efg456'].id).equal('efg456');
      });
    });

    describe('updateParticipant', function () {
      it('should exist', function () {
        expect(conference.updateParticipant).to.be.a('function');
      });

      it('should update the status of that specific participant', function () {
        var participants;

        conference.setParticipant('raman@raman.com', 'invitee', 'abc123');
        conference.setParticipant('4250000001', 'invitee', 'cba123');
        conference.updateParticipant('abc123', 'accepted');

        participants = conference.participants();
        expect(participants['abc123'].status).equal('accepted');

        // don't touch the other guy
        expect(participants['cba123'].status).equal('invitee');
      });

      it('should call setState with `connected` if [status === `accepted`]', function () {
        conference.setParticipant('raman@raman.com', 'invitee', 'abc123');
        conference.updateParticipant('abc123', 'accepted');

        expect(setStateStub.calledWith('connected')).to.equal(true);
      });

      it('should call setState with `rejected` if [status === `rejected`]', function () {
        conference.setParticipant('raman@raman.com', 'invitee', 'abc123');
        conference.updateParticipant('abc123', 'rejected');

        expect(setStateStub.calledWith('rejected')).to.equal(true);
      });
    });
  });
});