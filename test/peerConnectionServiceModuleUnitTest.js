/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, cmgmt: true, UserMediaService: true,
beforeEach: true, before: true, sinon: true, expect: true, xit: true, xdescribe: true, chai: true, getUserMedia: true, navigator */

'use strict';

describe('PeerConnectionServiceModule', function () {

  it( 'is defined', function () {
    expect(ATT.PeerConnectionService).is.an('object');
  });
  
  it( 'should create a PeerConnectionServer using the ICE server', function () {
    var peerConnection = ATT.PeerConnectionService.createPeerConnection();
    expect(peerConnection.iceConnectionState).equals('new');
  });

  it( 'should set optional pcConstraints to false for DtlsSrtpKeyAgreement ', function () {
    var optionalPcConstraints = ATT.PeerConnectionService.pcConstraints.optional;
    expect(optionalPcConstraints[0].DtlsSrtpKeyAgreement).equals('false');
  });

  it( 'should set default STUN URL server to Google', function () {
    var stunServerUrl = ATT.PeerConnectionService.STUN.url;
    chai.assert.match(stunServerUrl, /google/);
  });

  it( 'should set default TURN URL server to use bistri', function () {
    var turnServerUrl = ATT.PeerConnectionService.TURN.url;
    chai.assert.match(turnServerUrl, /bistri/);
  });

  it( 'should initialize correctly on start function call', function () {
      var fakeConfig = {from: 'Halifax, Nova Scotia', to: 'Van Diemen\'s land', mediaConstraints: 'Flogging Molly', };
      //Copy the old getUserMedia
      var oldUserMedia = getUserMedia;
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

  it( 'should have a function called getUserMediaSuccess', function () {
    expect(ATT.PeerConnectionService.getUserMediaSuccess).is.a('function');
  });

  it( 'should do correct connection handling for OUTGOING_CALL', function () { 
      var fakeStream = {};
      //var fakeCreateOfferFunction = function (pc) { expect(pc).equals(fakeStream); };
      var sessionState = {OUTGOING_CALL: 'youwannagoout?', INCOMING_CALL: 'ringyringy'};
      var callState = sessionState.OUTGOING_CALL;
      var session = {getEventObject: function() { return {};},
                     getCallState: function() {return callState;}};
      var rm = {getSessionContext: function() {return session;},
                SessionState: sessionState};

      //Mock  UserMediaService
      var mockUserMediaService = sinon.mock(ATT.UserMediaService);
      mockUserMediaService.expects('showStream').once().withArgs('local', fakeStream);
      //Mock  peerConnection function
      var mockThisPeerConnection = sinon.mock(ATT.PeerConnectionService.peerConnection);
      mockThisPeerConnection.expects('addStream').once().withArgs(fakeStream);
      //Mock  createOffer function
      var mockCreateOffer = sinon.mock(ATT.PeerConnectionService.createOffer);
      mockCreateOffer.expects('call').once();

      //Copy the old cmgmt
      var oldCmgmt = cmgmt;
      cmgmt = {CallManager: {getInstance: function () { return rm;} }};

      ATT.PeerConnectionService.getUserMediaSuccess(fakeStream);

      //Restore the old cmgmt
      cmgmt = oldCmgmt;
      //Verify Mock 
      mockUserMediaService.verify();
      mockThisPeerConnection.verify();
      mockCreateOffer.verify();
  });

  it( 'should do correct connection handling for INCOMING_CALL', function () { 
      var fakeStream = {};
      //var fakeCreateOfferFunction = function (pc) { expect(pc).equals(fakeStream); };
      var sessionState = {OUTGOING_CALL: 'youwannagoout?', INCOMING_CALL: 'ringyringy'};
      var callState = sessionState.INCOMING_CALL;
      var session = {getEventObject: function() { return {};},
                     getCallState: function() {return callState;}};
      var rm = {getSessionContext: function() {return session;},
                SessionState: sessionState};

      //Mock  UserMediaService
      var mockUserMediaService = sinon.mock(ATT.UserMediaService);
      mockUserMediaService.expects('showStream').once().withArgs('local', fakeStream);
      //Mock  createOffer function
      var mockSetRemoteAndCreateAnswer = sinon.mock(ATT.PeerConnectionService.setRemoteAndCreateAnswer);
      mockSetRemoteAndCreateAnswer.expects('call').once();

      //Copy the old cmgmt
      var oldCmgmt = cmgmt;
      cmgmt = {CallManager: {getInstance: function () { return rm;} }};

      ATT.PeerConnectionService.getUserMediaSuccess(fakeStream);

      //Restore the old cmgmt
      cmgmt = oldCmgmt;
      //Verify Mock 
      mockUserMediaService.verify();
      mockSetRemoteAndCreateAnswer.verify();
  });

  it( 'should log to the UI when onLocalStreamCreateError invoked', function () {
      var mockConsole = sinon.mock(console);
      mockConsole.expects('log').once().withArgs('Failed to get User Media');
      ATT.PeerConnectionService.onLocalStreamCreateError();
      mockConsole.verify();
  });

  it( 'should create an offer with a callback and error if userAgent is NOT Chrome', function () {
      var storedArgs = {};
      var fakePc = {createOffer: function (cb, err) {storedArgs.cb = cb; storedArgs.err = err;}};
      //Mock  createOffer function
      var stubUserAgent = sinon.stub(ATT.PeerConnectionService, 'userAgent').returns('Firetruck');

      ATT.PeerConnectionService.createOffer(fakePc); 
      expect(storedArgs.cb).is.a('function'); 
      expect(storedArgs.err).is.a('function'); 
      stubUserAgent.restore();
  });

  it( 'should create an offer with only a callback if userAgent is IS Chrome', function () {
      var storedArgs = {};
      var fakePc = {createOffer: function (cb, err) {storedArgs.cb = cb; storedArgs.err = err;}};
      //Mock  createOffer function
      sinon.stub(ATT.PeerConnectionService, 'userAgent').returns('Chromely');

      ATT.PeerConnectionService.createOffer(fakePc); 
      expect(storedArgs.cb).is.a('function'); 
      expect(storedArgs.err).is.a('undefined'); 
  });

  it( 'should assign modId, set sdp to sdp & type to "offer" on remoteDescription when setUpRemoteAnCreate with modId', function () {
      var mockCreateAnswer = sinon.mock(ATT.PeerConnectionService);
      mockCreateAnswer.expects('createAnswer').withArgs(true);
      
      ATT.PeerConnectionService.setRemoteAndCreateAnswer('some sdp', 'myModId');
      
      expect(ATT.PeerConnectionService.modificationId).equals('myModId');
      expect(ATT.PeerConnectionService.remoteDescription.sdp).equals('some sdp');
      expect(ATT.PeerConnectionService.remoteDescription.type).equals('offer');
      mockCreateAnswer.restore();
  });


  it( 'should assign modId, set sdp to sdp & type to "answer" on remoteDescription when setUpRemoteAnCreate without modId ', function () {
      var mockCreateAnswer = sinon.mock(ATT.PeerConnectionService);
      mockCreateAnswer.expects('createAnswer').withArgs(false);
      ATT.PeerConnectionService.modificationId = 'DO NOT ASSIGN ME';
      
      ATT.PeerConnectionService.setRemoteAndCreateAnswer('some sdp');

      expect(ATT.PeerConnectionService.modificationId).equals('DO NOT ASSIGN ME');
      expect(ATT.PeerConnectionService.remoteDescription.sdp).equals('some sdp');
      expect(ATT.PeerConnectionService.remoteDescription.type).equals('answer');
      mockCreateAnswer.restore();
  });
});
