/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('PeerConnection', function () {
  'use strict';

  var factories,
    onICETricklingCompleteSpy,
    onErrorSpy,
    sdpFilter,
    rtcPC,
    rtcpcStub;

  beforeEach(function () {
    rtcPC = {
      setLocalDescription: function () { return; },
      onicecandidate: null,
      localDescription : '12X3',
      setRemoteDescription : function () { return; }
    };

    sdpFilter = ATT.sdpFilter.getInstance();
    onICETricklingCompleteSpy = sinon.spy();
    onErrorSpy = sinon.spy();
    factories = ATT.private.factories;

  });


  it('should export ATT.private.factories.createPeerConnection', function () {
    expect(factories.createPeerConnection).to.be.a('function');
  });

  describe('Constructor', function () {

    it('should throw an error if it fails to create RTCPeerConnection ', function () {
      rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
        throw new Error('Failed to create PeerConnection.');
      });

      expect(factories.createPeerConnection).to.throw('Failed to create PeerConnection.');

      rtcpcStub.restore();
    });

    it('should create a private RTCPeerConnection instance', function () {
      var peerConnection;

      rtcpcStub = sinon.stub(window, 'RTCPeerConnection');
      peerConnection = factories.createPeerConnection();

      expect(peerConnection).to.be.a('object');
      expect(peerConnection.onICETricklingComplete).to.equal(null);
      expect(peerConnection.onError).to.equal(null);

      rtcpcStub.restore();
    });

    it('should set `pc.onicecandidate`', function () {
      rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
        return rtcPC;
      });

      expect(rtcPC.onicecandidate).to.equal(null);

      factories.createPeerConnection();

      expect(rtcPC.onicecandidate).to.be.a('function');
      rtcpcStub.restore();
    });

    it('should add a localstrem to peer connection');

    it('should set the pc.onaddstream');
  });

  describe('Methods', function () {
    var peerConnection;
    beforeEach(function () {
      rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
        return rtcPC;
      });
      peerConnection = factories.createPeerConnection();
    });
    afterEach(function () {
      rtcpcStub.restore();
    });

    describe('setLocalDescription', function () {

      it('exist', function () {
        expect(peerConnection.setLocalDescription).to.be.a('function');
      });

      it('should set the private RTCPeerConnection\'s local description', function () {
        var sdp = '123',
          rtcPCLocalDescriptionSpy;

        rtcPCLocalDescriptionSpy = sinon.spy(rtcPC, 'setLocalDescription');
        peerConnection.setLocalDescription(sdp);

        expect(rtcPCLocalDescriptionSpy.calledWith(sdp)).to.equal(true);

        rtcPCLocalDescriptionSpy.restore();
      });
    });
    describe('setRemoteDescription', function () {
      it('exist', function () {
        expect(peerConnection.setRemoteDescription).to.be.a('function');
      });

      it('should set the remote description for thr private peerconnection', function () {
        var setRemoteDescriptionSpy, sdp = '123';
        setRemoteDescriptionSpy = sinon.spy(rtcPC, 'setRemoteDescription');
        peerConnection.setRemoteDescription(sdp);

        expect(setRemoteDescriptionSpy.calledWith(sdp)).to.equal(true);

        setRemoteDescriptionSpy.restore();
      });
    });
  });


  xdescribe('`onicecandidate` event', function () {
    var rtcpcStub,
      peerConnection,
      onicecandidateSpy,
      processChromeSDPOfferStub;

    beforeEach(function () {

      rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
        return rtcPC;
      });

      peerConnection = factories.createPeerConnection();
      // start trickling
      onicecandidateSpy = sinon.spy(rtcPC, 'onicecandidate');

    });

    afterEach(function () {
      rtcpcStub.restore();
      onicecandidateSpy.restore();
    });


    it('should call `onError` if there\'s an error while parsing the SDP', function () {

      processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
        // throw new Error('');
      });
      rtcPC.onicecandidate();
      expect(onErrorSpy.calledWith(new Error('Could not process Chrome offer SDP.'))).to.equal(true);

      processChromeSDPOfferStub.restore();
    });

    it('should call `onError` if cannot set the localDescription', function () {
      rtcPC.onicecandidate();
      expect(onErrorSpy.called).to.equal(true);
      expect(onErrorSpy.calledWith(new Error('Could not set local description.'))).to.equal(true);

    });

    it('it should call `processChromeSdpOffer` with the local `sdp`', function () {
      processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer');
      rtcPC.onicecandidate();
      expect(processChromeSDPOfferStub.calledWith(rtcPC.localDescription)).to.equal(true);

      processChromeSDPOfferStub.restore();
    });

    it('should call `onICETricklingComplete` callback', function () {
      rtcPC.onicecandidate();
      expect(onICETricklingCompleteSpy.calledAfter(onicecandidateSpy)).to.equal(true);
    });

    xit('should call `setLocalDescription` with the current sdp', function () {
      var setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');
      expect(setLocalDescriptionStub.called).to.equal(true);
      setLocalDescriptionStub.restore();
    });
  });
});