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
      mediaType: 'video',
      onSuccess : function () {},
      onRemoteStream : function () {},
      onError : function () {}
    };
    createOptionsIncoming = {
      stream : {},
      mediaType: 'video',
      remoteDescription: {
        sdp : '123',
        type: 'offer'
      },
      onSuccess : function () {},
      onRemoteStream : function () {},
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
        })).to.throw('No `mediaType` passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {},
          mediaType: 'video'
        })).to.throw('No `onSuccess` callback passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {},
          mediaType: 'video',
          onSuccess: function () {}
        })).to.throw('No `onRemoteStream` callback passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {},
          mediaType: 'video',
          onSuccess: function () {},
          onRemoteStream : function () {}
        })).to.throw('No `onError` callback passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {},
          mediaType: 'video',
          onSuccess :  function () {},
          onRemoteStream : function () {},
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
      var rtcPCConfig;

      beforeEach(function () {
        rtcPCConfig = {
          'iceServers': [
            { 'url': 'STUN:74.125.133.127:19302' }
          ]
        };

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
        expect(rtcpcStub.calledWith(rtcPCConfig)).to.equal(true);

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
        var createOfferStub, sdp;

        beforeEach(function () {
          sdp = '123123';
          createOfferStub = sinon.stub(rtcPC, 'createOffer', function (success) {
            success(sdp);
          });
        });
        afterEach(function () {
          createOfferStub.restore();
        });
        it('should call `pc.createOffer` if we don\'t have a remote SDP', function () {
          var expectedConstraints = {};

          createOptionsOutgoing.mediaType = 'video';

          expectedConstraints.audio = true;
          expectedConstraints.video = (createOptionsOutgoing.mediaType === 'video');

          factories.createPeerConnection(createOptionsOutgoing);

          expect(createOfferStub.called).to.equal(true);
          expect(createOfferStub.getCall(0).args[0]).to.be.a('function');
          expect(createOfferStub.getCall(0).args[1]).to.be.a('function');
          expect(createOfferStub.getCall(0).args[2].mandatory.OfferToReceiveAudio).to.equal(expectedConstraints.audio);
          expect(createOfferStub.getCall(0).args[2].mandatory.OfferToReceiveVideo).to.equal(expectedConstraints.video);

        });

        describe('pc.createOffer: Success', function () {
          var fixedSDP,
            processChromeSDPOfferStub,
            peerConnection;

          describe('processSDP: Success', function () {
            beforeEach(function () {
              fixedSDP = 'FIXED';

              processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
                return fixedSDP;
              });

            });
            afterEach(function () {
              processChromeSDPOfferStub.restore();
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
              it('should throw an error when setLocalDescription fails', function () {
                expect(factories.createPeerConnection.bind(factories, createOptionsOutgoing)).to.throw('Could not set the localDescription.');
              });
            });

          });

          describe('processSDP: Error', function (){
            it('should throw an error if it fails to process the SDP', function () {
              var processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
                throw new Error('Could not process Chrome offer SDP.');
              });
              expect(factories.createPeerConnection.bind(factories, createOptionsOutgoing)).to.throw('Could not process Chrome offer SDP.');
              processChromeSDPOfferStub.restore();
            });
          });

        });
      });

      describe('pc.createOffer: Errors', function () {
        it('should throw an error if `createOffer` fails', function () {
          var createOfferStub = sinon.stub(rtcPC, 'createOffer', function (success, error) {
            error();
          });
          expect(factories.createPeerConnection.bind(factories, createOptionsOutgoing)).to.throw('Failed to create offer.');

          createOfferStub.restore();
        });
      });

      describe('pc.createAnswer', function () {
        var createAnswerStub, localSDP;

        beforeEach(function () {
          localSDP = 'localSdp';
          createAnswerStub = sinon.stub(rtcPC, 'createAnswer', function (success) {
            success(localSDP);
          });
        });

        afterEach(function () {
          createAnswerStub.restore();
        });

        it('should set the `pc.remoteDescription` if we have a remoteDescription', function () {
          var setRemoteDescriptionSpy = sinon.spy(rtcPC, 'setRemoteDescription');

          factories.createPeerConnection(createOptionsIncoming);

          expect(setRemoteDescriptionSpy.calledWith(createOptionsIncoming.remoteDescription)).to.equal(true);

          setRemoteDescriptionSpy.restore();
        });

        it('should call `pc.createAnswer` if we have a remoteDescription', function () {
          var expectedConstraints = {};

          createOptionsIncoming.mediaType = 'video';

          expectedConstraints.audio = true;
          expectedConstraints.video = (createOptionsIncoming.mediaType === 'video');

          factories.createPeerConnection(createOptionsIncoming);

          expect(createAnswerStub.called).to.equal(true);
          expect(createAnswerStub.getCall(0).args[0]).to.be.a('function');
          expect(createAnswerStub.getCall(0).args[1]).to.be.a('function');
          expect(createAnswerStub.getCall(0).args[2].mandatory.OfferToReceiveAudio).to.equal(expectedConstraints.audio);
          expect(createAnswerStub.getCall(0).args[2].mandatory.OfferToReceiveVideo).to.equal(expectedConstraints.video);

        });

        describe('pc.createAnswer: Success', function () {
          var fixedSDP,
            processChromeSDPOfferStub;

          describe('processSDP: Success', function () {
            beforeEach(function () {

              fixedSDP = 'FIXED';

              processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
                return fixedSDP;
              });
            });

            afterEach(function () {
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
                expect(factories.createPeerConnection.bind(factories, createOptionsIncoming)).to.throw('Could not set the localDescription.');
              });
            });

          });

          describe('processSDP: Error', function () {
            it('should throw an error if it fails to process the SDP', function () {
              var processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
                throw new Error('BAD SDP.');
              });
              expect(factories.createPeerConnection.bind(factories, createOptionsIncoming)).to.throw('Could not process Chrome offer SDP.');
              console.log(processChromeSDPOfferStub.callCount)
              processChromeSDPOfferStub.restore();
            });
          });

        });
      });

      describe('pc.createAnswer: Error', function () {
        it('should throw an error if it fails to create the answer', function () {
          var createAnswerStub = sinon.stub(rtcPC, 'createAnswer', function (success, error) {
            error();
          });
          expect(factories.createPeerConnection.bind(factories, createOptionsIncoming)).to.throw('Failed to create answer.');
          createAnswerStub.restore();
        });
      });

      it('should return an object', function () {
        var peerConnection = factories.createPeerConnection(createOptionsOutgoing);
        expect(peerConnection).to.be.an('object');
      });
    });
  });

  describe('Methods', function () {
    var peerConnection,
      rtcPCStub;

    beforeEach(function () {
      rtcPCStub = sinon.stub(window, 'RTCPeerConnection', function () {
        return rtcPC;
      });

      peerConnection = factories.createPeerConnection(createOptionsOutgoing);
    });

    afterEach(function () {
      rtcPCStub.restore();
    });

    describe('getLocalDescription', function () {
      it('should exist', function () {
        expect(peerConnection.setLocalSDP).to.be.a('function');
      });
      it('should set the `localDescription` of its RTCPeerConnection', function () {
        var someSDP,
          setLocalDescriptionStub;
        someSDP = 'adsfa';
        setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');

        peerConnection.setLocalSDP(someSDP);

        expect(setLocalDescriptionStub.called).to.equal(true);
        expect(setLocalDescriptionStub.getCall(0).args[0]).to.equal(someSDP);
        expect(setLocalDescriptionStub.getCall(0).args[1]).to.be.a('function');
        expect(setLocalDescriptionStub.getCall(0).args[2]).to.be.a('function');

        setLocalDescriptionStub.restore();
      });
    });
    describe('getLocalDescription', function () {
      var createOfferStub,
        localSDP;

      it('should exist', function () {
        expect(peerConnection.getLocalDescription).to.be.a('function');
      });

      it('should return the `localDescription` of its RTCPeerConnection`', function () {
        localSDP = 'ABCD';
        rtcPC.localDescription = localSDP;
        expect(peerConnection.getLocalDescription()).to.equal(localSDP);
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
        onRemoteStreamSpy = sinon.spy(createOptionsOutgoing, 'onRemoteStream');

        // Here's where we simulate the event!!!
        rtcPC.onaddstream(event);
      });

      afterEach(function () {
        rtcpcStub.restore();
        onRemoteStreamSpy.restore();
        onaddstreamSpy.restore();
      });

      it('should call `onRemoteStream` callback with the remote stream', function () {

        expect(onRemoteStreamSpy.calledAfter(onaddstreamSpy)).to.equal(true);
        expect(onRemoteStreamSpy.calledWith(event.remoteStream)).to.equal(true);

      });
    });
  });
});