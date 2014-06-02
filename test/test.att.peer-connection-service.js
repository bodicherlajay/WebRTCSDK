/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, cmgmt: true, UserMediaService: true,
beforeEach: true, before: true, sinon: true, expect: true, assert: true, xit: true, xdescribe: true, chai: true,
getUserMedia: true, navigator, MediaStream: true */

'use strict';

describe('PeerConnectionServiceModule', function () {

  var backupAtt;
  beforeEach(function () {
    backupAtt = ATT;
  });

  describe('Preliminary setup information', function () {
    it('is defined', function () {
      expect(ATT.PeerConnectionService).is.an('object');
    });

    it('should configure ICE servers', function () {
      var iceServers = [{ 'url': 'STUN:74.125.133.127:19302' }];
      ATT.PeerConnectionService.configureICEServers(iceServers);
      expect(ATT.PeerConnectionService.getICEServers()).to.equal(iceServers);
    });

    it('should set optional pcConstraints to false for DtlsSrtpKeyAgreement ', function () {
      var optionalPcConstraints = ATT.PeerConnectionService.pcConstraints.optional;
      expect(optionalPcConstraints[0].DtlsSrtpKeyAgreement).equals('false');
    });

    it('should set default STUN URL server to Google', function () {
      var stunServerUrl = ATT.PeerConnectionService.pcConfig.iceServers[0].url;
      expect(stunServerUrl).to.equal("STUN:74.125.133.127:19302");
    });
  });

  describe('Creation of the actual peer connection', function () {

    var iceServers,
      peerConn;

    beforeEach(function () {
      iceServers = [{ 'url': 'STUN:74.125.133.127:19302' }];

      ATT.PeerConnectionService.configureICEServers(iceServers);
      ATT.PeerConnectionService.createPeerConnection();
      peerConn = ATT.PeerConnectionService.peerConnection;
    });

    it('should create a PeerConnection using the ICE server', function () {
      expect(peerConn).to.be.an('object');
    });

    it('should perform ice trickling if there are candidates', function () {
      var evt = { candidate: {foo: 'bar'} };
      peerConn.onicecandidate(evt);
      assert.isNotNull(ATT.PeerConnectionService.peerConnection);
    });

    it('should stop performing ice trickling if there are no candidates', function () {
      var evt = { nocandidates: {foo: 'bar'} };
      peerConn.onicecandidate(evt);
      assert.isNotNull(ATT.PeerConnectionService.peerConnection);
    });

    it('should set remoteStream Object when `addstream` event fires', function () {
      var evt = {stream: 'foooooooo'};
      peerConn.onaddstream(evt);
      expect(ATT.PeerConnectionService.remoteStream).to.equal(evt.stream);
    });
  });

  describe('Peer connection decisions based on Call state', function () {
    it('should initialize correctly on start function call', function () {
      var fakeConfig = {from: 'Halifax, Nova Scotia', to: 'Van Diemen\'s land', mediaConstraints: 'Flogging Molly'},
        //Copy the old getUserMedia
        oldUserMedia = getUserMedia;
      //This looks silly, is silly, but JSLint won't let us have an empy function like we need
      getUserMedia = function () { chai.assert.isTrue(true); };
      ATT.PeerConnectionService.start(fakeConfig);
      //Restore the old getUserMedia
      getUserMedia = oldUserMedia;
      expect(fakeConfig.from).to.equal(ATT.PeerConnectionService.callingParty);
      expect(fakeConfig.to).to.equal(ATT.PeerConnectionService.calledParty);
      expect(fakeConfig.mediaConstraints).to.equal(ATT.PeerConnectionService.mediaConstraints);
      expect(ATT.PeerConnectionService.peerConnection).is.an('Object');
    });

    it('should call SignalingService.sendOffer() if call is Outgoing and return `no SDP` error', function () {
      var iceServers = [{ 'url': 'STUN:74.125.133.127:19302' }], peerConn,
        callState = 'Outgoing', evt = { nocandidate: {foo: 'bar'} };
      ATT.PeerConnectionService.configureICEServers(iceServers);
      ATT.PeerConnectionService.createPeerConnection(callState);
      peerConn = ATT.PeerConnectionService.peerConnection;

      peerConn.onicecandidate(evt);
      assert.throw(ATT.SignalingService.sendOffer, 'Cannot read property \'sdp\' of undefined');
    });

    it('should call SignalingService.sendAnswer() if call is Incoming and return `no SDP` error', function () {
      var iceServers = [{ 'url': 'STUN:74.125.133.127:19302' }], peerConn, callState = 'Incoming',
        evt = { nocandidate: {foo: 'bar'} };
      ATT.PeerConnectionService.configureICEServers(iceServers);
      ATT.PeerConnectionService.createPeerConnection(callState);
      peerConn = ATT.PeerConnectionService.peerConnection;

      peerConn.onicecandidate(evt);
      assert.throw(ATT.SignalingService.sendAnswer, 'Cannot read property \'sdp\' of undefined');
    });
  });

/*
  describe('Get user media success', function () {
    var stream = {blob: 'foo'};
    ATT.PeerConnectionService.getUserMediaSuccess(stream);

    it('should set local stream on getUserMediaSuccess callback', function () {
      expect(ATT.PeerConnectionService.localStream).equals(stream);
    });
  });
*/

  describe('Peer connection call-flow decisions', function () {
    it('should set modificationID when setRemoteAndCreateAnswer() is called', function () {
      var sdp = "a=1\r\nb=2\r\nc=3", modId = '12345';
      ATT.PeerConnectionService.setRemoteAndCreateAnswer(sdp, modId);
      expect(ATT.PeerConnectionService.modificationId).to.equal(modId);
    });

    it('should set local desc when setLocalAndSendMessage() is called', function () {
      var desc = "a=1\r\nb=2\r\nc=3";
      ATT.PeerConnectionService.setModificationId('12345');
      ATT.PeerConnectionService.setLocalAndSendMessage(desc);
      expect(ATT.PeerConnectionService.localDescription).to.equal(desc);
    });
  });

  describe('hacky modification & other helper functions', function () {
    it('should set the modification ID to parameter passed in', function () {
      ATT.PeerConnectionService.setModificationId('007');
      expect(ATT.PeerConnectionService.modificationId).equals('007');
    });

    it('should increment the modification count by 1', function () {
      ATT.PeerConnectionService.modificationCount = 7;
      ATT.PeerConnectionService.incrementModCount();
      expect(ATT.PeerConnectionService.modificationCount).equals(8);
    });

    it('should reset the modification count back to 2', function () {
      ATT.PeerConnectionService.modificationCount = 777;
      ATT.PeerConnectionService.resetModCount();
      expect(ATT.PeerConnectionService.modificationCount).equals(2);
    });

    it('should return userAgent', function () {
      var UA = ATT.PeerConnectionService.userAgent();
      expect(UA).to.equal(navigator.userAgent);
    });
  });

  describe('Peer connection call management functionalities', function () {
    it('should replace SDP attribute (sendrecv -> recvonly) for hold request', function () {
      var sdp = { sdp: 'a=sendrecv\r\nb=helloworld' };
      ATT.PeerConnectionService.localDescription = sdp;
      ATT.PeerConnectionService.holdCall();
      expect(sdp.sdp).to.include('recvonly');
      expect(ATT.PeerConnectionService.modificationCount).to.equal(3);
    });

    it('should replace SDP attribute (recvonly -> sendrecv) for resume request', function () {
      var sdp = { sdp: 'a=recvonly\r\nb=helloworld' };
      ATT.PeerConnectionService.localDescription = sdp;
      ATT.PeerConnectionService.resumeCall();
      expect(sdp.sdp).to.contain('sendrecv');
      expect(ATT.PeerConnectionService.modificationCount).to.equal(4);
    });

    it('should close peer connection on endCall()', function () {
      ATT.PeerConnectionService.endCall();
      assert.isNull(ATT.PeerConnectionService.peerConnection);
      expect(ATT.PeerConnectionService.modificationCount).to.equal(2);
      expect(ATT.PeerConnectionService.modificationId).equals(null);
    });
  });

  describe('Callbacks', function () {
    it('should trigger `onOfferSent` after successfully sending an offer');
  });

  afterEach(function () {
    ATT = backupAtt;
  });
});
