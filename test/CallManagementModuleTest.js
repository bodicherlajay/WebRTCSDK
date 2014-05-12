/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, assert: true, xit: true, URL: true*/
describe('Call Management', function () {
  'use strict';

  var backupAtt, callmgr = cmgmt.CallManager.getInstance(), sessionContext;
  beforeEach(function () {
    backupAtt = ATT;
  });

  callmgr.CreateSession({
    token: "abcd",
    e911Id: "e911id",
    sessionId: "sessionId"
  });
  sessionContext = callmgr.getSessionContext();

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
    it('should return a valid Call Object', function () {
      var config = {
        caller: '1-800-call-junhua',
        mediaContraints: {audio: true, video: true}
      };
      callmgr.CreateIncomingCall(config);
      expect(sessionContext.getCallObject()).to.be.an('object');
    });

    it('should create an outgoing call', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaContraints: {audio: true, video: true}
      };
      callmgr.CreateOutgoingCall(config);
      expect(sessionContext.getCallObject()).to.be.an('object');
      assert.isNull(sessionContext.getCallObject().caller());
      expect(sessionContext.getCallObject().callee()).to.equal('1-800-call-junhua');
      expect(sessionContext.getCallState()).to.equal('Outgoing');
    });

    it('should create an incoming call', function () {
      var config = {
        caller: '1-800-call-junhua',
        mediaContraints: {audio: true, video: true}
      };
      callmgr.CreateIncomingCall(config);
      expect(sessionContext.getCallObject()).to.be.an('object');
      assert.isNull(sessionContext.getCallObject().callee());
      expect(sessionContext.getCallObject().caller()).to.equal('1-800-call-junhua');
      expect(sessionContext.getCallState()).to.equal('Incoming');
    });

    it('should call ATT.PeerConnection.holdCall() if peer connection and callObject are defined', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaContraints: {audio: true, video: true}
      };
      callmgr.CreateOutgoingCall(config);
      ATT.PeerConnectionService.peerConnection = {foo: 'bar'};
      ATT.PeerConnectionService.holdCall = sinon.spy();
      callmgr.getSessionContext().getCallObject().hold();
      expect(ATT.PeerConnectionService.holdCall.called).to.equal(true);
    });

    it('should call ATT.PeerConnection.resumeCall() if peer connection and callObject are defined', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaContraints: {audio: true, video: true}
      };
      callmgr.CreateOutgoingCall(config);
      ATT.PeerConnectionService.peerConnection = {foo: 'bar'};
      ATT.PeerConnectionService.resumeCall = sinon.spy();
      callmgr.getSessionContext().getCallObject().resume();
      expect(ATT.PeerConnectionService.resumeCall.called).to.equal(true);
    });

    it('should call ATT.SignalingService.sendEndCall() if peer connection and callObject are defined', function () {
      var config = {
        to: '1-800-call-junhua',
        mediaContraints: {audio: true, video: true}
      },
        spy = sinon.spy(ATT.SignalingService, 'sendEndCall');

      callmgr.CreateOutgoingCall(config);
      ATT.PeerConnectionService.peerConnection = {foo: 'bar'};
      callmgr.getSessionContext().getCallObject().end();
      expect(spy.called).to.equal(true);
    });

    it('should ATT.UserMediaService.muteStream() to mute the call', function () {
      var Mute = ATT.UserMediaService.muteStream,
        config = {
          to: '1-800-call-junhua',
          mediaContraints: {audio: true, video: true}
        };
      callmgr.CreateOutgoingCall(config);
      ATT.UserMediaService.muteStream = sinon.spy();
      callmgr.getSessionContext().getCallObject().mute();
      expect(ATT.UserMediaService.muteStream.called).to.equal(true);
      ATT.UserMediaService.muteStream = Mute;
    });

    it('should ATT.UserMediaService.unmuteStream() to unmute the call', function () {
      var Unmute = ATT.UserMediaService.unmuteStream,
        config = {
          to: '1-800-call-junhua',
          mediaContraints: {audio: true, video: true}
        };
      callmgr.CreateOutgoingCall(config);
      ATT.UserMediaService.unmuteStream = sinon.spy();
      callmgr.getSessionContext().getCallObject().unmute();
      expect(ATT.UserMediaService.unmuteStream.called).to.equal(true);
      ATT.UserMediaService.unmuteStream = Unmute;
    });
  });

  afterEach(function () {
    ATT = backupAtt;
  });
});
