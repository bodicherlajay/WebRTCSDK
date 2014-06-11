/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, assert: true, xit: true, URL: true*/

describe('Call Management', function () {
  'use strict';

  var callmgr = cmgmt.CallManager.getInstance(), sessionContext, stubPublish, stubUserMediaServiceStartCall;

  beforeEach(function () {
    callmgr.CreateSession({
      token: "abcd",
      e911Id: "e911id",
      sessionId: "sessionId"
    });
    sessionContext = callmgr.getSessionContext();
    stubPublish = sinon.stub(ATT.event, 'publish');
    stubUserMediaServiceStartCall = sinon.stub(ATT.UserMediaService, 'startCall');
  });

  afterEach(function () {
    callmgr.DeleteSession();
    stubPublish.restore();
    stubUserMediaServiceStartCall.restore();
  });

  it('should be a singleton', function () {
    var instance1 = cmgmt.CallManager.getInstance(),
      instance2 = cmgmt.CallManager.getInstance();
    expect(instance1).equals(instance2);
  });

  describe('Session Context', function () {
    it('should create Session Context', function () {
      expect(sessionContext.getAccessToken()).equals("abcd");
      expect(sessionContext.getE911Id()).equals("e911id");
      expect(sessionContext.getSessionId()).equals("sessionId");
      expect(sessionContext.getCallState()).equals(callmgr.SessionState.SDK_READY);
    });
  });

  describe('Call Object', function () {
    it('CreateOutgoingCall should call ATT.UserMediaService.startCall', function () {
      var config = {
          to: '1-800-call-junhua',
          mediaConstraints: {audio: true, video: true}
        };

      callmgr.CreateOutgoingCall(config);
      expect(stubUserMediaServiceStartCall.called).to.equal(true);
    });

    it('should return a valid Call Object', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaConstraints: {audio: true, video: true}
      };

      callmgr.CreateOutgoingCall(config);
      sessionContext = callmgr.getSessionContext();
      expect(sessionContext.getCallObject()).to.be.an('object');
    });

    it('should create an outgoing call', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaConstraints: {audio: true, video: true}
      };
      callmgr.CreateOutgoingCall(config);
      sessionContext = callmgr.getSessionContext();
      expect(sessionContext.getCallObject()).to.be.an('object');
      assert.isNull(sessionContext.getCallObject().caller());
      expect(sessionContext.getCallObject().callee()).to.equal('1-800-call-junhua');
      expect(sessionContext.getCallState()).to.equal('Outgoing');
    });

    it('should be able to cancel a call', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaConstraints: {audio: true, video: true}
      };
      callmgr.CreateOutgoingCall(config);
      callmgr.cancel
      sessionContext = callmgr.getSessionContext();
      expect(sessionContext.getCallObject()).to.be.an('object');
      assert.isNull(sessionContext.getCallObject().caller());
      expect(sessionContext.getCallObject().callee()).to.equal('1-800-call-junhua');
      expect(sessionContext.getCallState()).to.equal('Outgoing');
    });


    xit('should clean a phone number with extra characters', function () {
      var config = {
        to: '1.800-43/3.23+42',
        mediaConstraints: {audio: true, video: true}
      };
      callmgr.CreateOutgoingCall(config);
      sessionContext = callmgr.getSessionContext();
      expect(sessionContext.getCallObject()).to.be.an('object');
      assert.isNull(sessionContext.getCallObject().caller());
      expect(sessionContext.getCallObject().callee()).to.equal('18004332342');
      expect(sessionContext.getCallState()).to.equal('Outgoing');
    });

    xit('should reject a phone number with too few characters not in the special numbers list', function () {
      var config = {
          to: '1.800-/3.23+42',
          mediaConstraints: {audio: true, video: true}
        };
      callmgr.CreateOutgoingCall(config);
      sessionContext = callmgr.getSessionContext();
      expect(sessionContext.getCallObject()).to.be.an('object');
      assert.isNull(sessionContext.getCallObject().caller());
      expect(sessionContext.getCallObject().callee()).to.equal('1800-32342');
      expect(sessionContext.getCallState()).to.equal('Outgoing');
    });

    xit('should translate letters into numbers', function () {
      var config = {
        to: '1-800-pick-ups',
        mediaConstraints: {audio: true, video: true}
      };
      callmgr.CreateOutgoingCall(config);
      sessionContext = callmgr.getSessionContext();
      expect(sessionContext.getCallObject()).to.be.an('object');
      assert.isNull(sessionContext.getCallObject().caller());
      expect(sessionContext.getCallObject().callee()).to.equal('1-800-742-5877');
      expect(sessionContext.getCallState()).to.equal('Outgoing');
    });

    it('should create an incoming call', function () {
      var config = {
        caller: '1-800-call-junhua',
        mediaConstraints: {audio: true, video: true}
      }, event = { caller: '1800-foo-bar' };
      sessionContext = callmgr.getSessionContext();
      sessionContext.setEventObject(event);
      callmgr.CreateIncomingCall(config);
      expect(sessionContext.getCallObject().caller()).to.equal('1800-foo-bar');
    });

    it('should be able to delete the call object', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaConstraints: {audio: true, video: true}
      },
        event = { caller: '1800-foo-bar' },
        call;

      sessionContext = callmgr.getSessionContext();
      sessionContext.setEventObject(event);
      call = callmgr.CreateIncomingCall(config);

      expect(call).to.be.an('object');
      callmgr.DeleteCallObject();
      assert.isNull(sessionContext.getCallObject());
    });

    it('should call ATT.PeerConnection.holdCall() if peer connection and callObject are defined', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaConstraints: {audio: true, video: true}
      },
        spyHoldCall = sinon.stub(ATT.PeerConnectionService, 'holdCall');
      callmgr.CreateOutgoingCall(config);
      ATT.PeerConnectionService.peerConnection = {foo: 'bar'};
      callmgr.getSessionContext().getCallObject().hold();
      expect(spyHoldCall.called).to.equal(true);
      spyHoldCall.restore();
    });

    it('should call ATT.PeerConnection.resumeCall() if peer connection and callObject are defined', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaConstraints: {audio: true, video: true}
      },
        stubResumeCall = sinon.stub(ATT.PeerConnectionService, 'resumeCall');
      callmgr.CreateOutgoingCall(config);
      ATT.PeerConnectionService.peerConnection = {foo: 'bar'};
      callmgr.getSessionContext().getCallObject().resume();
      stubResumeCall.restore();
    });

    it('should call ATT.SignalingService.sendEndCall() if peer connection and callObject are defined', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaContraints: {audio: true, video: true}
      },
        stubResumeCall = sinon.stub(ATT.SignalingService, 'sendEndCall');

      callmgr.CreateOutgoingCall(config);
      ATT.PeerConnectionService.peerConnection = {foo: 'bar'};
      callmgr.getSessionContext().getCallObject().end();
      expect(stubResumeCall.called).to.equal(true);
      stubResumeCall.restore();
    });

    it('should call ATT.UserMediaService.muteStream() to mute the call', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaConstraints: {audio: true, video: true}
      },
        stubMute = sinon.stub(ATT.UserMediaService, 'muteStream'),
        call = callmgr.CreateOutgoingCall(config);

      call.mute();
      expect(stubMute.called).to.equal(true);
      stubMute.restore();
    });

    it('should ATT.UserMediaService.unmuteStream() to unmute the call', function () {
      var config = {
          to: '1-800-call-junhua',
          mediaConstraints: {audio: true, video: true}
        },
        stub = sinon.stub(ATT.UserMediaService, 'unmuteStream'),
        call = callmgr.CreateOutgoingCall(config);

      call.unmute();
      expect(stub.called).to.equal(true);
      stub.restore();
    });
  });

  describe('Session Context cleanup', function () {
    it('should delete session context', function () {
      expect(sessionContext).to.be.an('object');

      callmgr.DeleteSession();
      sessionContext = callmgr.getSessionContext();
      assert.isNull(sessionContext);
    });
  });

  describe('formatNumber', function () {

    it('should format number, happy path', function () {
      var number = ATT.rtc.Phone.formatNumber('1234567890');
      expect(number).to.equal('1 (123) 456-7890');
    });

    it('should return undefined if not callable', function () {
      var number = ATT.rtc.Phone.formatNumber('1234');
      expect(number).to.equal(undefined);
    });

    it('should return special number without *', function () {
      var number = ATT.rtc.Phone.formatNumber('*69');
      expect(number).to.equal('69');
    });
  });

  describe('Create Outgoing Call', function () {
    var callManager, callOptions;

    beforeEach(function () {
      callManager = cmgmt.CallManager.getInstance();
      callOptions = {
        to: '1-800-call-junh'
      };
    });

    // TODO: Unignore after the changes for the CallManager.
    xit('should trigger `onCallCreated` after successfully creating an outgoing call', function (done) {
      var onCallCreatedSpy, sendOfferStub;

      onCallCreatedSpy = sinon.spy(callManager, 'onCallCreated', function () {
        expect(onCallCreatedSpy.called).to.equal(true);
        done();
      });

      sendOfferStub = sinon.stub(callManager.peerConnectionService, 'sendOffer', function () {
        // force success
        callManager.peerConnectionService.onOfferSent();
      });

      callManager.createOutgoingCall(callOptions);
      sendOfferStub.restore();
    });
  });
});
