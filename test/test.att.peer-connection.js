/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('PeerConnection', function () {
  'use strict';

  var factories;

  beforeEach(function () {
    factories = ATT.private.factories;
  });

  it('should export ATT.private.factories.createPeerConnection', function () {
    expect(factories.createPeerConnection).to.be.a('function');
  });

  describe('Constructor', function () {
    it('should create a PeerConnection instance', function () {
      expect(factories.createPeerConnection()).to.be.a('object');
    });
  });

  describe('Methods', function () {
    var peerConnection;
    beforeEach(function () {
      peerConnection = factories.createPeerConnection();
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