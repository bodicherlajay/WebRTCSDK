/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('PeerConnection', function () {
  'use strict';

  var factories,
    onICETricklingCompleteSpy,
    onErrorSpy,
    sdpFilter,
    rtcPC,
    rtcpcStub,
    createOptions;

  beforeEach(function () {

    createOptions = {
      stream : {}
    };

    rtcPC = {
      setLocalDescription: function () { return; },
      onicecandidate: null,
      localDescription : '12X3',
      setRemoteDescription : function () { return; },
      addStream : function () {return; },
      onaddstream : null
    };

    sdpFilter = ATT.sdpFilter.getInstance();
    onErrorSpy = sinon.spy();
    factories = ATT.private.factories;

  });


  it('should export ATT.private.factories.createPeerConnection', function () {
    expect(factories.createPeerConnection).to.be.a('function');
  });

  describe('Constructor', function () {

    describe('Error: Invalid parameters', function () {
      it('should throw an error if `options` are invalid', function () {

        rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
          return rtcPC;
        });

        expect(factories.createPeerConnection).to.throw('No options passed.');
        expect(factories.createPeerConnection.bind(factories, {})).to.throw('No options passed.');
        expect(factories.createPeerConnection.bind(factories, {
          test: 'ABC'
        })).to.throw('No `stream` passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {}
        })).to.not.throw(Error);

        rtcpcStub.restore();
      });

      it('should throw an error if it fails to create RTCPeerConnection ', function () {
        rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
          throw new Error('Failed to create PeerConnection.');
        });

        expect(factories.createPeerConnection.bind(factories, createOptions)).to.throw('Failed to create PeerConnection.');

        rtcpcStub.restore();
      });
    });

    describe('Constructor: Valid parameters', function () {
      it('should create a private RTCPeerConnection instance', function () {
        var peerConnection;

        rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
          return rtcPC;
        });
        peerConnection = factories.createPeerConnection(createOptions);

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

        factories.createPeerConnection(createOptions);

        expect(rtcPC.onicecandidate).to.be.a('function');
        rtcpcStub.restore();
      });

      it('should add a localStream to peer connection', function () {

        var onAddStreamStub, stream = '1245';
        onAddStreamStub = sinon.stub(rtcPC, 'addStream');
        rtcPC.localStream = stream;
        rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
          return rtcPC;
        });
        createOptions.stream = stream;

        factories.createPeerConnection(createOptions);

        expect(onAddStreamStub.calledWith(stream)).to.equal(true);

        onAddStreamStub.restore();
        rtcpcStub.restore();
      });

      it('should set the pc.onaddstream', function () {

        rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
          return rtcPC;
        });

        expect(rtcPC.onaddstream).to.equal(null);

        factories.createPeerConnection(createOptions);

        expect(rtcPC.onaddstream).to.be.a('function');

        rtcpcStub.restore();
      });

      it('should call `pc.createOffer`');

      describe('createOffer', function () {
        describe('Success', function () {
          it('should call `pc.setLocalDescription`');
        });

        describe('Error', function () {
          it('should throw an error');
        });
      });
    });
  });

  // TODO: I think these methods are not needed,
  // sync tomorrow with everybody
  describe.skip('Methods', function () {
    var peerConnection;

    beforeEach(function () {
      rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
        return rtcPC;
      });
      peerConnection = factories.createPeerConnection(createOptions);
    });

    afterEach(function () {
      rtcpcStub.restore();
    });

    describe('addStream', function () {

      it('should exist', function () {
        expect(peerConnection.addStream).to.be.a('function');
      });

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

    describe('addStream', function () {
      it('should exist', function () {
        expect(peerConnection.addStream).to.be.a('function');
      });
    });
	  describe('createAnswer', function () {
      it('should exist', function () {
        expect(peerConnection.createAnswer).to.be.a('function');
      });
    });
  });


  describe('`onicecandidate` event', function () {
    var rtcpcStub,
      peerConnection,
      onicecandidateSpy,
      setLocalDescriptionStub;

    beforeEach(function () {

      rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
        return rtcPC;
      });

      peerConnection = factories.createPeerConnection(createOptions);
      onicecandidateSpy = sinon.spy(rtcPC, 'onicecandidate');


    });

    afterEach(function () {
      rtcpcStub.restore();
      onicecandidateSpy.restore();

    });

    it('should call `setLocalDescription` for it\'s private RTCPeerConnection with the current sdp', function () {
      var sdp = '123';
      setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');
      peerConnection.setLocalDescription(sdp);

      rtcPC.onicecandidate();

      expect(setLocalDescriptionStub.called).to.equal(true);
      expect(setLocalDescriptionStub.calledWith(sdp)).to.equal(true);
      setLocalDescriptionStub.restore();
    });

    it('should call `onICETricklingComplete`', function () {
      setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');
      peerConnection.onICETricklingComplete = function () { return; };
      onICETricklingCompleteSpy = sinon.spy(peerConnection, 'onICETricklingComplete');

      rtcPC.onicecandidate();

      expect(onICETricklingCompleteSpy.called).to.equal(true);
      expect(onICETricklingCompleteSpy.calledAfter(onicecandidateSpy)).to.equal(true);
      expect(onICETricklingCompleteSpy.calledAfter(setLocalDescriptionStub)).to.equal(true);

      setLocalDescriptionStub.restore();
    });

    it('should throw and error if cannot set the localDescription', function () {
      setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription', function () {
        throw new Error('Could not set local description.');
      });

      expect(rtcPC.onicecandidate).to.throw('Could not set local description.');
     // expect(onErrorSpy.calledWith(new Error('Could not set local description.'))).to.equal(true);

      setLocalDescriptionStub.restore();
    });

  });

  describe('`onaddstream` event', function () {

    describe('Happy Path', function () {
      var peerConnection,
        onRemoteStreamSpy,
        onaddstreamSpy,
        event;

      beforeEach(function () {
        rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
          return rtcPC;
        });

        peerConnection = factories.createPeerConnection(createOptions);

        event = {remoteStream : '123'};

        onaddstreamSpy = sinon.spy(rtcPC, 'onaddstream');

        peerConnection.onRemoteStream = function () { return; };
        onRemoteStreamSpy = sinon.spy(peerConnection, 'onRemoteStream');

        rtcPC.onaddstream(event);
      });

      afterEach(function () {
        rtcpcStub.restore();
      });

      afterEach(function () {
        onRemoteStreamSpy.restore();
        onaddstreamSpy.restore();
      });

      it('should call `onRemoteStream` callback  ', function () {

        expect(onRemoteStreamSpy.calledAfter(onaddstreamSpy)).to.equal(true);
        expect(onRemoteStreamSpy.calledWith(event.remoteStream)).to.equal(true);

      });
    });
  });
});