/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit, xdescribe, RTCSessionDescription*/

describe('PeerConnection', function () {
  'use strict';

  var factories,
    onSuccessSpy,
    sdpFilter,
    rtcPC,
    rtcPeerConncetionStub,
    createOptionsOutgoing,
    createOptionsIncoming,
    description,
    rtcSessionDescriptionStub,
    expectedConstraints;

  beforeEach(function () {

    rtcSessionDescriptionStub = sinon.stub(window, 'RTCSessionDescription');

    description = {
      sdp: 'sdp',
      type: 'offer'
    };
    createOptionsOutgoing = {
      remoteSdp: null,
      stream : {},
      mediaType: 'video',
      onSuccess : function () { return; },
      onRemoteStream : function () {return; },
      onError : function () { return; }
    };
    createOptionsIncoming = {
      stream : {},
      mediaType: 'video',
      remoteSdp: '123',
      onSuccess : function () { return; },
      onRemoteStream : function () { return; },
      onError : function () { return; }
    };

    expectedConstraints = {};
    expectedConstraints.audio = true;
    expectedConstraints.video = (createOptionsOutgoing.mediaType === 'video');

    rtcPC = {
      setLocalDescription: function () { return; },
      localDescription : description,
      setRemoteDescription : function () { return; },
      addStream : function () {return; },
      onaddstream : null,
      onicecandidate : null,
      createOffer : function () {return; },
      createAnswer : function () {return; },
      remoteDescription: 'ABCDEFG'
    };

    sdpFilter = ATT.sdpFilter.getInstance();
    factories = ATT.private.factories;

  });
  afterEach(function () {
    rtcSessionDescriptionStub.restore();
  });


  it('should export ATT.private.factories.createPeerConnection', function () {
    expect(factories.createPeerConnection).to.be.a('function');
  });

  describe('Constructor', function () {

    describe('Error: Invalid parameters', function () {
      it('should throw an error if `options` are invalid', function () {

        rtcPeerConncetionStub = sinon.stub(window, 'RTCPeerConnection', function () {
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
          onSuccess: function () { return; }
        })).to.throw('No `onRemoteStream` callback passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {},
          mediaType: 'video',
          onSuccess: function () { return; },
          onRemoteStream : function () { return; }
        })).to.throw('No `onError` callback passed.');
        expect(factories.createPeerConnection.bind(factories, {
          stream: {},
          mediaType: 'video',
          onSuccess :  function () { return; },
          onRemoteStream : function () { return; },
          onError : function () { return; }
        })).to.not.throw(Error);

        rtcPeerConncetionStub.restore();
      });

      it('should throw an error if it fails to create RTCPeerConnection ', function () {
        rtcPeerConncetionStub = sinon.stub(window, 'RTCPeerConnection', function () {
          throw new Error('Failed to create PeerConnection.');
        });

        expect(factories.createPeerConnection.bind(factories, createOptionsOutgoing)).to.throw('Failed to create PeerConnection.');

        rtcPeerConncetionStub.restore();
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

        rtcPeerConncetionStub = sinon.stub(window, 'RTCPeerConnection', function () {
          return rtcPC;
        });

        onSuccessSpy = sinon.spy(createOptionsOutgoing, 'onSuccess');
      });

      afterEach(function () {
        rtcPeerConncetionStub.restore();
        onSuccessSpy.restore();
      });

      it('should create a private RTCPeerConnection instance', function () {
        var peerConnection;

        peerConnection = factories.createPeerConnection(createOptionsOutgoing);

        expect(peerConnection).to.be.a('object');
        expect(rtcPeerConncetionStub.calledWith(rtcPCConfig)).to.equal(true);

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

      it('should set remoteSdp to null if it is undefined', function () {
        createOptionsOutgoing.remoteSdp = undefined;

        factories.createPeerConnection(createOptionsOutgoing);

        expect(createOptionsOutgoing.remoteSdp).to.equal(null);
      });

      describe('[remoteSdp === null]', function () {
        var createOfferStub;

        it('should set the pc.onicecandidate', function () {
          expect(rtcPC.onicecandidate).to.equal(null);

          factories.createPeerConnection(createOptionsOutgoing);

          expect(rtcPC.onicecandidate).to.be.a('function');
        });

        it('should call `pc.createOffer` if we don\'t have a remote SDP', function () {

          createOfferStub = sinon.stub(rtcPC, 'createOffer');
          createOptionsOutgoing.mediaType = 'video';
          createOptionsOutgoing.remoteSdp = undefined;

          factories.createPeerConnection(createOptionsOutgoing);

          expect(createOfferStub.called).to.equal(true);
          expect(createOfferStub.getCall(0).args[0]).to.be.a('function');
          expect(createOfferStub.getCall(0).args[1]).to.be.a('function');
          expect(createOfferStub.getCall(0).args[2].mandatory.OfferToReceiveAudio).to.equal(expectedConstraints.audio);
          expect(createOfferStub.getCall(0).args[2].mandatory.OfferToReceiveVideo).to.equal(expectedConstraints.video);

          createOfferStub.restore();
        });

        describe('pc.createOffer: Success', function () {

          beforeEach(function () {

            createOfferStub = sinon.stub(rtcPC, 'createOffer', function (success) {
              success(description);
            });
          });

          afterEach(function () {
            createOfferStub.restore();
          });

          it('should call `pc.setLocalDescription`', function () {
            var setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');

            factories.createPeerConnection(createOptionsOutgoing);

            expect(setLocalDescriptionStub.calledWith(description)).to.equal(true);
            expect(setLocalDescriptionStub.getCall(0).args[1]).to.be.a('function');
            expect(setLocalDescriptionStub.getCall(0).args[2]).to.be.a('function');

            setLocalDescriptionStub.restore();
          });

        });

        describe('pc.createOffer: Error', function () {

          it('should throw an error if `createOffer` fails', function () {
            createOfferStub = sinon.stub(rtcPC, 'createOffer', function (success, error) {
              error();
            });
            expect(factories.createPeerConnection.bind(factories, createOptionsOutgoing)).to.throw('Failed to create offer.');

            createOfferStub.restore();
          });
        });
      });

      describe('[remoteSdp !== null]', function () {

        it('should execute `pc.setLocalDescription`', function () {
          var setRemoteDescriptionStub,
            createAnswerStub,
            setLocalDescriptionStub;

          setRemoteDescriptionStub = sinon.stub(rtcPC, 'setRemoteDescription', function (desc, success) {
            success();
          });
          createAnswerStub = sinon.stub(rtcPC, 'createAnswer', function (success) {
            success(description);
          });
          setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');

          factories.createPeerConnection(createOptionsIncoming);

          expect(setRemoteDescriptionStub.called).to.equal(true);
          expect(rtcSessionDescriptionStub.calledWith({
            sdp: createOptionsIncoming.remoteSdp,
            type: 'offer'
          })).to.equal(true);
          expect(createAnswerStub.called).to.equal(true);
          expect(setLocalDescriptionStub.called).to.equal(true);
          expect(setLocalDescriptionStub.calledWith(description)).to.equal(true);

          setRemoteDescriptionStub.restore();
          createAnswerStub.restore();
          setLocalDescriptionStub.restore();
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

    describe('getRemoteDescription', function () {
      it('should exist', function () {
        expect(peerConnection.getRemoteDescription).to.be.a('function');
      });
      it('should return the current `pc.remoteDescription`', function () {
        expect(peerConnection.getRemoteDescription()).to.equal(rtcPC.remoteDescription);
      });
    });

    describe('setRemoteDescription', function () {
      it('should exist', function () {
        expect(peerConnection.setRemoteDescription).to.be.a('function');
      });

      it('should call pc.setRemoteDescription', function () {
        var setRemoteDescriptionStub = sinon.stub(rtcPC, 'setRemoteDescription');

        peerConnection.setRemoteDescription({
          sdp: 'ABD',
          type: 'offer'
        });

        expect(setRemoteDescriptionStub.called).to.equal(true);
        expect(setRemoteDescriptionStub.getCall(0).args[0] instanceof RTCSessionDescription).to.equal(true);
        expect(setRemoteDescriptionStub.getCall(0).args[1]).to.be.a('function');
        expect(setRemoteDescriptionStub.getCall(0).args[2]).to.be.a('function');

        setRemoteDescriptionStub.restore();
      });

    });

    describe('getLocalDescription', function () {
      it('should exist', function () {
        expect(peerConnection.getLocalDescription).to.be.a('function');
      });

      it('should return the `localDescription` of its RTCPeerConnection`', function () {
        var localSDP = 'ABCD';
        rtcPC.localDescription = localSDP;

        expect(peerConnection.getLocalDescription()).to.equal(localSDP);
      });
    });

    describe('acceptSdpOffer', function () {
      var acceptOpts,
        setRemoteDescriptionStub;

      beforeEach(function () {
        acceptOpts = {
          remoteSdp: description.sdp,
          onSuccess: function () { return; }
        };

        onSuccessSpy = sinon.spy(acceptOpts, 'onSuccess');
      });

      afterEach(function () {
        onSuccessSpy.restore();
      });

      it('should exist', function () {
        expect(peerConnection.acceptSdpOffer).to.be.a('function');
      });

      it('should set the `pc.remoteDescription` if we have a remoteDescription', function () {
        setRemoteDescriptionStub = sinon.stub(rtcPC, 'setRemoteDescription');

        peerConnection.acceptSdpOffer(acceptOpts);

        expect(rtcSessionDescriptionStub.getCall(0).args[0]).to.eql({
          sdp: acceptOpts.remoteSdp,
          type: 'offer'
        });
        expect(setRemoteDescriptionStub.getCall(0).args[0] instanceof RTCSessionDescription).to.equal(true);
        expect(setRemoteDescriptionStub.getCall(0).args[1]).to.be.a('function');
        expect(setRemoteDescriptionStub.getCall(0).args[2]).to.be.a('function');

        setRemoteDescriptionStub.restore();
      });

      describe('pc.setRemoteDescription: Success', function () {

        var createAnswerStub;

        beforeEach(function () {
          setRemoteDescriptionStub = sinon.stub(rtcPC, 'setRemoteDescription', function (description, success, error) {
            success();
          });
        });

        afterEach(function () {
          setRemoteDescriptionStub.restore();
        });

        it('should call `pc.createAnswer`', function () {
          var expectedConstraints = {};

          createAnswerStub = sinon.stub(rtcPC, 'createAnswer');

          createOptionsIncoming.mediaType = 'video';

          expectedConstraints.audio = true;
          expectedConstraints.video = (createOptionsIncoming.mediaType === 'video');

          peerConnection.acceptSdpOffer(acceptOpts);

          expect(createAnswerStub.getCall(0).args[0]).to.be.a('function');
          expect(createAnswerStub.getCall(0).args[1]).to.be.a('function');
          expect(createAnswerStub.getCall(0).args[2].mandatory.OfferToReceiveAudio).to.equal(expectedConstraints.audio);
          expect(createAnswerStub.getCall(0).args[2].mandatory.OfferToReceiveVideo).to.equal(expectedConstraints.video);

          createAnswerStub.restore();
        });

        describe('pc.createAnswer: Success', function () {
          var localSDP;

          beforeEach(function () {
            createAnswerStub = sinon.stub(rtcPC, 'createAnswer', function (success) {
              success(description);
            });
          });

          afterEach(function () {
            createAnswerStub.restore();
          });

          // NOTE: Ok to `xit`. Looks like this SDP manipulation is not necessary
          xit('should call `sdpFilter.processChromeSDPOffer` with the answer\'s SDP', function () {
            var processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer');

            factories.createPeerConnection(createOptionsIncoming);

            expect(processChromeSDPOfferStub.called).to.equal(true);
            expect(processChromeSDPOfferStub.calledWith(localSDP)).to.equal(true);
          });

          xdescribe('processSDP: Error', function () {

            it('should throw an error if it fails to process the SDP', function () {
              var processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
                throw new Error('BAD SDP.');
              });
              expect(factories.createPeerConnection.bind(factories, createOptionsIncoming)).to.throw('Could not process Chrome offer SDP.');
              processChromeSDPOfferStub.restore();
            });

            it('should not invoke `pc.setLocalDescription`');

          });

          it('should set the localDescription using the SDP', function () {
            var setLocalDescriptionStub;

            setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');

            peerConnection.acceptSdpOffer(acceptOpts);

            expect(setLocalDescriptionStub.called).to.equal(true);
            expect(setLocalDescriptionStub.calledWith({
              sdp: acceptOpts.remoteSdp,
              type: 'offer'
            })).to.equal(true);
            expect(setLocalDescriptionStub.getCall(0).args[1]).to.be.a('function');
            expect(setLocalDescriptionStub.getCall(0).args[2]).to.be.a('function');

            setLocalDescriptionStub.restore();
          });

          describe('pc.setLocalDescription: Success', function () {
            var  setLocalDescriptionStub;

            beforeEach(function () {
              setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription', function (desc, success) {
                success(description);
              });
            });

            afterEach(function () {
              setLocalDescriptionStub.restore();
            });

            it('should execute `onSuccess` callback if passed in', function () {
              peerConnection.acceptSdpOffer(acceptOpts);

              expect(rtcSessionDescriptionStub.called).to.equal(true);
              expect(rtcSessionDescriptionStub.getCall(0).args[0].sdp).to.equal(acceptOpts.remoteSdp);
              expect(rtcSessionDescriptionStub.getCall(0).args[0].type).to.equal('offer');
              expect(setRemoteDescriptionStub.getCall(0).args[0] instanceof RTCSessionDescription).to.equal(true);
              expect(createAnswerStub.getCall(0).args[0]).to.be.a('function');
              expect(createAnswerStub.getCall(0).args[1]).to.be.a('function');
              expect(createAnswerStub.getCall(0).args[2].mandatory.OfferToReceiveAudio).to.equal(expectedConstraints.audio);
              expect(createAnswerStub.getCall(0).args[2].mandatory.OfferToReceiveVideo).to.equal(expectedConstraints.video);
              expect(setLocalDescriptionStub.calledWith(description)).to.equal(true);
              expect(onSuccessSpy.called).to.equal(true);
            });

            it('should NOT execute `onSucces` callback if NOT passed in', function () {

              acceptOpts.onSuccess = undefined;

              peerConnection.acceptSdpOffer(acceptOpts);

              expect(onSuccessSpy.called).to.equal(false);
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

        describe('pc.createAnswer: Error', function () {

          beforeEach(function () {
            createAnswerStub = sinon.stub(rtcPC, 'createAnswer', function (success, error) {
              error();
            });
          });

          afterEach(function () {
            createAnswerStub.restore();
          });

          it('should throw an error if it fails to create the answer', function () {
            expect(factories.createPeerConnection.bind(factories, createOptionsIncoming)).to.throw('Failed to create answer.');
          });
        });
      });
    });
  });

  describe('Callbacks', function () {

    beforeEach(function () {
      rtcPeerConncetionStub = sinon.stub(window, 'RTCPeerConnection', function () {
        return rtcPC;
      });
    });
    afterEach(function () {
      rtcPeerConncetionStub.restore();
    });

    describe('onicecandidate', function () {
      var addStreamStub;
      beforeEach(function () {
        addStreamStub = sinon.stub(rtcPC, 'addStream');
        onSuccessSpy = sinon.spy(createOptionsOutgoing, 'onSuccess');

        factories.createPeerConnection(createOptionsOutgoing);
      });
      afterEach(function () {
        addStreamStub.restore();
        onSuccessSpy.restore();
      });

      it('should execute `onSuccess` with the local SDP', function () {

        rtcPC.onicecandidate({});

        expect(onSuccessSpy.called).to.equal(true);
        expect(onSuccessSpy.calledWith(description)).to.equal(true);
      });

      // NOTE: Ok to `xdescribe`: This branch of the code no longer exists
      xdescribe('processSDP: Success', function () {

        var fixedSDP,
          processChromeSDPOfferStub;

        beforeEach(function () {
          fixedSDP = 'FIXED';

          processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
            return fixedSDP;
          });

        });

        afterEach(function () {
          processChromeSDPOfferStub.restore();
        });

        xit('should call `sdpFilter.processChromeSDPOffer` with the offer\'s SDP', function () {

          // no event.candidate === end of canditates
          rtcPC.onicecandidate({});

          expect(processChromeSDPOfferStub.called).to.equal(true);
          console.log(processChromeSDPOfferStub.getCall(0).args[0] + ':' + description);
          expect(processChromeSDPOfferStub.calledWith(description)).to.equal(true);

        });

        xit('should call `pc.setLocalDescription` with the SDP', function () {
          var  setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription');

          rtcPC.onicecandidate({});

          expect(setLocalDescriptionStub.called).to.equal(true);
          expect(setLocalDescriptionStub.calledWith(description)).to.equal(true);
          expect(setLocalDescriptionStub.getCall(0).args[1]).to.be.a('function');
          expect(setLocalDescriptionStub.getCall(0).args[2]).to.be.a('function');

          setLocalDescriptionStub.restore();
        });

        xdescribe('pc.setLocalDescription: Success', function () {
          var  setLocalDescriptionStub;

          beforeEach(function () {
            setLocalDescriptionStub = sinon.stub(rtcPC, 'setLocalDescription', function (desc, success) {
              success();
            });
          });

          afterEach(function () {
            setLocalDescriptionStub.restore();
          });

        });

        xdescribe('pc.setLocalDescription: Error', function () {
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
            expect(rtcPC.onicecandidate.bind(rtcPC, {})).to.throw('Could not set the localDescription.');
          });
        });

      });
      // NOTE: Ok to `xdescribe`: This branch of the code no longer exists
      xdescribe('processSDP: Error', function () {

        xit('should throw an error if it fails to process the SDP', function () {
          var processChromeSDPOfferStub = sinon.stub(sdpFilter, 'processChromeSDPOffer', function () {
            throw new Error();
          });

          expect(rtcPC.onicecandidate.bind(rtcPC, {})).to.throw('Could not process Chrome offer SDP.');

          processChromeSDPOfferStub.restore();
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

          peerConnection = factories.createPeerConnection(createOptionsOutgoing);

          event = {remoteStream : '123'};

          onaddstreamSpy = sinon.spy(rtcPC, 'onaddstream');

          peerConnection.onRemoteStream = function () { return; };
          onRemoteStreamSpy = sinon.spy(createOptionsOutgoing, 'onRemoteStream');

          // Here's where we simulate the event!!!
          rtcPC.onaddstream(event);
        });

        afterEach(function () {
          onRemoteStreamSpy.restore();
          onaddstreamSpy.restore();
        });

        it('should call `onRemoteStream` callback with the remote stream', function () {

          expect(onRemoteStreamSpy.calledAfter(onaddstreamSpy)).to.equal(true);
          expect(onRemoteStreamSpy.calledWith(event.stream)).to.equal(true);

        });
      });
    });

  });
});
