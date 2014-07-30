/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('PeerConnection', function () {
  'use strict';

  var factories,
    onSuccessSpy,
    onErrorSpy,
    sdpFilter,
    rtcPC,
    rtcpcStub,
    createOptionsOutgoing,
    createOptionsIncoming;

  beforeEach(function () {

    createOptionsOutgoing = {
      stream : {},
      onSuccess : function () {},
      onError : function () {}
    };
    createOptionsIncoming = {
      stream : {},
      remoteSDP : '123',
      onSuccess : function () {},
      onError : function () {}
    };

    rtcPC = {
      setLocalDescription: function () { return; },
      localDescription : '12X3',
      setRemoteDescription : function () { return; },
      addStream : function () {return; },
      onaddstream : null,
      createOffer : function () {return; },
      createAnswer : function () {return;}
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

        expect(factories.createPeerConnection.bind(factories, createOptionsOutgoing)).to.throw('Failed to create PeerConnection.');

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

        peerConnection = factories.createPeerConnection(createOptionsOutgoing);

        expect(peerConnection).to.be.a('object');
       // TODO : Need ot check if the new callbacks have been assigned
//        expect(peerConnection.onSuccess).to.equal(createOptions.onSuccess);
//        expect(peerConnection.onError).to.equal(createOptions.onError);

      });

      it('should add a localStream to peer connection', function () {

        var onAddStreamStub, stream = '1245';

        rtcPC.localStream = stream;
        onAddStreamStub = sinon.stub(rtcPC, 'addStream');

        createOptionsOutgoing.stream = stream;

        factories.createPeerConnection(createOptionsOutgoing);

        expect(onAddStreamStub.calledWith(stream)).to.equal(true);

        onAddStreamStub.restore();
      });

      it('should set the pc.onaddstream', function () {

        expect(rtcPC.onaddstream).to.equal(null);

        factories.createPeerConnection(createOptionsOutgoing);

        expect(rtcPC.onaddstream).to.be.a('function');
      });

      describe('pc.createOffer', function () {
        it('should call `pc.createOffer` if we dont have a remote SDP', function () {
          var createOfferStub = sinon.stub(rtcPC, 'createOffer');

          factories.createPeerConnection(createOptionsOutgoing);
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

            factories.createPeerConnection(createOptionsOutgoing);

            expect(processChromeSDPOfferStub.called).to.equal(true);
            expect(processChromeSDPOfferStub.calledWith(sdp)).to.equal(true);

          });
          it('should call `pc.setLocalDescription`', function () {
            var  setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');

            factories.createPeerConnection(createOptionsOutgoing);

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
              onSuccessSpy = sinon.spy(createOptionsOutgoing, 'onSuccess');

              factories.createPeerConnection(createOptionsOutgoing);

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
              onErrorSpy = sinon.spy(createOptionsOutgoing, 'onError');

              peerConnection = factories.createPeerConnection(createOptionsOutgoing);

              expect(onErrorSpy.called).to.equal(true);

              onErrorSpy.restore();
            });
          });
        });

        describe('pc.createOffer: Error', function () {
          it('should throw an error');
        });
      });

      describe('pc.createAnswer', function () {
        it('should call `pc.createAnswer` if we have a remoteSdp', function () {
          var createAnswerStub = sinon.stub(rtcPC, 'createAnswer');

          factories.createPeerConnection(createOptionsIncoming);

          expect(createAnswerStub.called).to.equal(true);
          expect(createAnswerStub.getCall(0).args[0]).to.be.a('function');
          expect(createAnswerStub.getCall(0).args[1]).to.be.a('function');

          createAnswerStub.restore();
        });

        describe('pc.createAnswer: Success', function () {
          var createAnswerStub,
            localSDP,
            fixedSDP,
            processChromeSDPOfferStub;

          beforeEach(function () {
            localSDP = 'localSdp';
            fixedSDP = 'FIXED';

            processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
              return fixedSDP;
            });

            createAnswerStub = sinon.stub(rtcPC, 'createAnswer', function (success) {
              success(localSDP);
            });
          });

          afterEach(function () {
            createAnswerStub.restore();
            processChromeSDPOfferStub.restore();
          });

          it('should call `sdpFilter.processChromeSDPOffer` with the answer\'s SDP', function () {

            factories.createPeerConnection(createOptionsIncoming);

            expect(processChromeSDPOfferStub.called).to.equal(true);
            expect(processChromeSDPOfferStub.calledWith(localSDP)).to.equal(true);

          });

          it('should set the localDescription using the fixed SDP', function () {
            var setLocalDescriptionStub;

            setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');
            factories.createPeerConnection(createOptionsIncoming);

            expect(setLocalDescriptionStub.called).to.equal(true);
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

            it('should execute `onSuccess` with the Fixed  SDP', function () {
              onSuccessSpy = sinon.spy(createOptionsIncoming, 'onSuccess');

              factories.createPeerConnection(createOptionsIncoming);

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
              onErrorSpy = sinon.spy(createOptionsIncoming, 'onError');

              factories.createPeerConnection(createOptionsIncoming);

              expect(onErrorSpy.called).to.equal(true);

              onErrorSpy.restore();
            });
          });
        });
        describe('pc.createAnswer: Error', function () {
      });

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

        peerConnection = factories.createPeerConnection(createOptionsOutgoing);

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