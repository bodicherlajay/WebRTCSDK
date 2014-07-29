/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('PeerConnection', function () {
  'use strict';

  var factories, onPCReadySpy, options, onErrorSpy;

  beforeEach(function () {
    onPCReadySpy = sinon.spy();
    onErrorSpy = sinon.spy();
    factories = ATT.private.factories;
    options = {
      onPCReady: onPCReadySpy,
      onError : onErrorSpy
    };
  });

  it('should export ATT.private.factories.createPeerConnection', function () {
    expect(factories.createPeerConnection).to.be.a('function');
  });

  describe('Constructor', function () {
    it('should throw an error if parameters are invalid', function () {
      expect(factories.createPeerConnection.bind(factories, undefined)).to.throw('Invalid options.');
      expect(factories.createPeerConnection.bind(factories, {})).to.throw('Invalid `onPCReady` callback.');
      expect(factories.createPeerConnection.bind(factories, {
        onPCReady: function () {
          return;
        }
      })).to.throw('Invalid `onError` callback.');
    });

    it('should create a PeerConnection instance', function () {
      expect(factories.createPeerConnection(options)).to.be.a('object');
    });

    it('it should add the localStream');
    it('it should setup the `onaddstream` callback');

    describe('ICE Trickling setup', function () {

      var rtcpcStub,
        peerConnection;

      describe('onPCReady', function () {
        beforeEach(function () {
          rtcpcStub = sinon.stub(window, 'RTCPeerConnection');
          peerConnection = factories.createPeerConnection(options);
        });

        afterEach(function () {
          rtcpcStub.restore();
        });

        it('should call `onPCReady` callback', function () {
          expect(onPCReadySpy.called).to.equal(true);
        });
      });
      describe('onError ', function () {

        beforeEach(function () {
          rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
            throw new Error('Failed to create PeerConnection.');
          });
          peerConnection = factories.createPeerConnection(options);
        });

        afterEach(function () {
          rtcpcStub.restore();
        });

        it('should call the `onError` Callback if it fails to create Peer connection ', function () {
          expect(onErrorSpy.called).to.equal(true);
        });

      });
    });

    describe('`onicecandidate` event', function () {
      var rtcPC,
        rtcpcStub,
        peerConnection;

      beforeEach(function () {
        rtcPC = {
          setLocalDescription: function () { return; },
          onicecandidate: function () { return; }
        };

        rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
          return rtcPC;
        });
      });

      afterEach(function () {
        rtcpcStub.restore();
      });

      it('should call `onError` if there\'s an error while parsing the SDP');

      it('should call `onError` if cannot set the localDescription', function () {
        var setLocalDescriptionStub;

        setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription', function () {
          throw new Error('Could not set local description.');
        });

        peerConnection = factories.createPeerConnection(options);
        // start trickling
        rtcPC.onicecandidate();

        expect(onErrorSpy.called).to.equal(true);
        expect(onErrorSpy.calledWith(new Error('Could not set local description.'))).to.equal(true);

        setLocalDescriptionStub.restore();
      });
    });

  });

  describe('Methods', function () {
    var peerConnection;
    beforeEach(function () {
      peerConnection = factories.createPeerConnection(options);
    });
    describe('setLocalDescription', function () {
      it('exist', function () {
        expect(peerConnection.setLocalDescription).to.be.a('function');
      });

      describe('callbacks', function () {
        describe('onPCReady', function () {

        });

        describe('onRemoteStreamAdded', function () {

        });
        describe('onError', function () {

        });
      });
    });
    describe('setRemoteDescription', function () {
      it('exist', function () {
        expect(peerConnection.setRemoteDescription).to.be.a('function');
      });
    });
  });
});