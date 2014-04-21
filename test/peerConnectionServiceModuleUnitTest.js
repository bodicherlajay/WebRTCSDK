/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, cmgmt: true, UserMediaService: true,
beforeEach: true, before: true, sinon: true, expect: true, xit: true, xdescribe: true, chai: true, getUserMedia: true, navigator, MediaStream: true */

'use strict';

describe('PeerConnectionServiceModule', function () {

  it('is defined', function () {
    expect(ATT.PeerConnectionService).is.an('object');
  });

  it('should create a PeerConnectionServer using the ICE server', function () {
    var pc = {iceConnectionState: "cold"};
    ATT.PeerConnectionService.peerConnection = pc;
    ATT.PeerConnectionService.createPeerConnection();
    expect(ATT.PeerConnectionService.peerConnection).is.an('object');
  });

  it('should set optional pcConstraints to false for DtlsSrtpKeyAgreement ', function () {
    var optionalPcConstraints = ATT.PeerConnectionService.pcConstraints.optional;
    expect(optionalPcConstraints[0].DtlsSrtpKeyAgreement).equals('false');
  });

  it('should set default STUN URL server to Google', function () {
    var stunServerUrl = ATT.PeerConnectionService.STUN.url;
    chai.assert.match(stunServerUrl, /google/);
  });

  it('should set default TURN URL server to use bistri', function () {
    var turnServerUrl = ATT.PeerConnectionService.TURN.url;
    chai.assert.match(turnServerUrl, /bistri/);
  });

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
    //TODO: test initialization of ICE trickling
  });

  it('should have a function called getUserMediaSuccess', function () {
    expect(ATT.PeerConnectionService.getUserMediaSuccess).is.a('function');
  });

  xit('should do correct connection handling for OUTGOING_CALL', function () {
    var fakeStream = {},
      oldCmgmt = cmgmt,
      sessionState = {OUTGOING_CALL: 'youwannagoout?', INCOMING_CALL: 'ringyringy'},
      callState = sessionState.OUTGOING_CALL,
      session = {getEventObject: function () { return {}; },
                     getCallState: function () {return callState; }},
      rm = {getSessionContext: function () {return session; },
                SessionState: sessionState },
      //Mock  UserMediaService
      mockUserMediaService = sinon.mock(ATT.UserMediaService),
      //Mock  peerConnection function
      mockThisPeerConnection = sinon.mock(ATT.PeerConnectionService.peerConnection, 'addStream');

    mockUserMediaService.expects('showStream').once().withArgs('local', fakeStream);
    mockThisPeerConnection.expects('addStream').once();
    mockThisPeerConnection.expects('createOffer').once();

    cmgmt = {CallManager: {getInstance: function () { return rm; } }};

    ATT.PeerConnectionService.getUserMediaSuccess(fakeStream);

    //Restore the old cmgmt
    cmgmt = oldCmgmt;

    //Verify Mock 
    mockUserMediaService.verify();
    mockThisPeerConnection.verify();
  });

  it('should do correct connection handling for INCOMING_CALL', function () {
    var fakeStream = {},
      oldCmgmt = cmgmt,
      sessionState = {OUTGOING_CALL: 'youwannagoout?', INCOMING_CALL: 'ringyringy'},
      callState = sessionState.INCOMING_CALL,
      session = {getEventObject: function () { return {}; },
                     getCallState: function () {return callState; }},
      rm = {getSessionContext: function () {return session; },
                SessionState: sessionState},
      mockUserMediaService = sinon.mock(ATT.UserMediaService);

    mockUserMediaService.expects('showStream').once().withArgs('local', fakeStream);

    cmgmt = {CallManager: {getInstance: function () { return rm; } }};

    ATT.PeerConnectionService.getUserMediaSuccess(fakeStream);

    //Restore the old cmgmt
    cmgmt = oldCmgmt;
    //Verify Mock 
    mockUserMediaService.verify();
  });

});
