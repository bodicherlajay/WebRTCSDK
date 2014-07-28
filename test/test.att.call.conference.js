/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call [Conference]', function () {
  "use strict";
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
});