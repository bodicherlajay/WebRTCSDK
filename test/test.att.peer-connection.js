/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe.only('PeerConnection', function () {
  'use strict';

  var factories,
    onSuccessSpy,
    onErrorSpy,
    sdpFilter,
    rtcPC,
    rtcpcStub,
    createOptions;

  beforeEach(function () {

    createOptions = {
      stream : {},
      onSuccess : function () {},
      onError : function () {}
    };

    rtcPC = {
      setLocalDescription: function () { return; },
      localDescription : '12X3',
      setRemoteDescription : function () { return; },
      addStream : function () {return; },
      onaddstream : null,
      createOffer : function () {return; }
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
        })).to.throw('No `onSuccess` callback passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {},
          onSuccess: function () {}
        })).to.throw('No `onError` callback passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {},
          onSuccess :  function () {},
          onError : function () {}
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

      beforeEach(function () {
        rtcpcStub = sinon.stub(window, 'RTCPeerConnection', function () {
          return rtcPC;
        });
      });

      afterEach(function () {
        rtcpcStub.restore();
      });
      it('should create a private RTCPeerConnection instance', function () {
        var peerConnection;

        peerConnection = factories.createPeerConnection(createOptions);

        expect(peerConnection).to.be.a('object');
       // TODO : Need ot check if the new callbacks have been assigned
//        expect(peerConnection.onSuccess).to.equal(createOptions.onSuccess);
//        expect(peerConnection.onError).to.equal(createOptions.onError);

      });

      // TODO: Remove this since ICE trickling it not used at all.
      xit('should set `pc.onicecandidate`', function () {
        expect(rtcPC.onicecandidate).to.equal(null);

        factories.createPeerConnection(createOptions);

        expect(rtcPC.onicecandidate).to.be.a('function');
      });

      it('should add a localStream to peer connection', function () {

        var onAddStreamStub, stream = '1245';

        rtcPC.localStream = stream;
        onAddStreamStub = sinon.stub(rtcPC, 'addStream');

        createOptions.stream = stream;

        factories.createPeerConnection(createOptions);

        expect(onAddStreamStub.calledWith(stream)).to.equal(true);

        onAddStreamStub.restore();
      });

      it('should set the pc.onaddstream', function () {

        expect(rtcPC.onaddstream).to.equal(null);

        factories.createPeerConnection(createOptions);

        expect(rtcPC.onaddstream).to.be.a('function');
      });

      it('should call `pc.createOffer` if we dont have a remote SDP', function () {
        var createOfferStub = sinon.stub(rtcPC, 'createOffer');

        factories.createPeerConnection(createOptions);
        expect(createOfferStub.called).to.equal(true);
        expect(createOfferStub.getCall(0).args[0]).to.be.a('function');
        expect(createOfferStub.getCall(0).args[1]).to.be.a('function');


        createOfferStub.restore();
      });

      describe('pc.createOffer: Success', function () {
        var sdp,
          fixedSDP,
          createOfferStub,
          processChromeSDPOfferStub,
          peerConnection;

        beforeEach(function () {
          sdp = '123123';
          fixedSDP = 'FIXED';

          processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
            return fixedSDP;
          });

          createOfferStub = sinon.stub(rtcPC, 'createOffer', function (success) {
            success(sdp);
          });

        });
        afterEach(function () {
          processChromeSDPOfferStub.restore();
          createOfferStub.restore();
        });

        it('should call `sdpFilter.processChromeSDPOffer` with the offer\'s SDP', function () {

          factories.createPeerConnection(createOptions);

          expect(processChromeSDPOfferStub.called).to.equal(true);
          expect(processChromeSDPOfferStub.calledWith(sdp)).to.equal(true);

        });
        it('should call `pc.setLocalDescription`', function () {
          var  setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');

          factories.createPeerConnection(createOptions);

          expect(setLocalDescriptionStub.calledWith(fixedSDP)).to.equal(true);
          expect(setLocalDescriptionStub.getCall(0).args[1]).to.be.a('function');
          expect(setLocalDescriptionStub.getCall(0).args[2]).to.be.a('function');

          setLocalDescriptionStub.restore();
        });

        describe('pc.setLocalDescription: Success', function () {
          var  setLocalDescriptionStub;

          beforeEach(function () {
            setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription', function (desc, success) {
              console.log(desc);
              success();
            });
          });
          afterEach(function () {
            setLocalDescriptionStub.restore();
          });

          it('should execute `onSuccess` with the local SDP', function () {
            onSuccessSpy = sinon.spy(createOptions, 'onSuccess');

            peerConnection = factories.createPeerConnection(createOptions);

            expect(onSuccessSpy.called).to.equal(true);
            expect(onSuccessSpy.calledWith(fixedSDP)).to.equal(true);

            onSuccessSpy.restore();
          });
        });
        describe('pc.setLocalDesciription: Error', function () {
          var  setLocalDescriptionStub;

          beforeEach(function () {
            setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription', function (desc, success, error) {
              error();
            });
          });
          afterEach(function () {
            setLocalDescriptionStub.restore();
          });
          it('should call `onError` when setLocalDescription fails', function () {
            onErrorSpy = sinon.spy(createOptions, 'onError');

            peerConnection = factories.createPeerConnection(createOptions);

            expect(onErrorSpy.called).to.equal(true);

            onErrorSpy.restore();
          });
        });
      });

      describe('pc.createOffer: Error', function () {
        it('should throw an error');
      });
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