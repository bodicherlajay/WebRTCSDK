/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call V2', function () {
  'use strict';
  var Call,
    restClientStub,
    factories,
    optionsOutgoingVideo,
    newPeerConnection;

  beforeEach(function () {
    optionsOutgoingVideo = {
      breed: 'call',
      peer: '12345',
      mediaType: 'video',
      type: ATT.CallTypes.OUTGOING,
      sessionInfo : {sessionId : '12345', token : '123'}
    };

    newPeerConnection = {newPeerConnection : true};

    factories = ATT.private.factories;
    restClientStub = sinon.stub(RESTClient.prototype, 'ajax');
    Call = ATT.rtc.Call;
  });

  afterEach(function () {
    restClientStub.restore();
  });

  describe('Methods', function () {
    var optionsOutgoing,
      outgoingCall,
      rtcMgr,
      getRTCManagerStub,
      optionsforRTCM,
      resourceManager,
      apiConfig,
      factories,
      call,
      emitter,
      createEEStub,
      publishStub,
      setStateStub;

    beforeEach(function () {

      apiConfig = ATT.private.config.api;
      factories = ATT.private.factories;
      resourceManager = factories.createResourceManager(apiConfig);

      optionsforRTCM = {
        resourceManager: resourceManager,
        userMediaSvc: ATT.UserMediaService,
        peerConnSvc: ATT.PeerConnectionService
      };

      rtcMgr = new ATT.private.RTCManager(optionsforRTCM);

      getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
        return rtcMgr;
      });

      optionsOutgoing = {
        breed: 'call',
        peer: '12345',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'},
        id: '1234'
      };

      emitter = ATT.private.factories.createEventEmitter();

      createEEStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitter;
      });

      publishStub = sinon.stub(emitter, 'publish');

      outgoingCall = new ATT.rtc.Call(optionsOutgoing);

      setStateStub = sinon.stub(outgoingCall, 'setState');
    });

    afterEach(function () {
      getRTCManagerStub.restore();
      createEEStub.restore();
      setStateStub.restore();
    });
    describe('connect', function () {
      var createPeerConnectionStub,
        outgoingVideoCall,
        pcOptions;

      beforeEach(function () {

        outgoingVideoCall = new Call(optionsOutgoingVideo);

        pcOptions = {
          stream: 'localStream',
          mediaType: 'video',
          onSuccess: function () { return; },
          onError: function () { return; },
          onRemoteStream: function () { return; }
        };
      });

      describe('connect [OUTGOING]', function () {

        it('should execute createPeerConnection with mediaConstraints, localStream and remoteDescription', function () {

          createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection');

          outgoingVideoCall.connect(newPeerConnection);

          expect(createPeerConnectionStub.calledOnce).to.equal(true);
          expect(createPeerConnectionStub.getCall(0).args[0].mediaType).to.equal(outgoingVideoCall.mediaType());
          expect(createPeerConnectionStub.getCall(0).args[0].stream).to.equal(outgoingVideoCall.localStream());
          expect(createPeerConnectionStub.getCall(0).args[0].onSuccess).to.be.a('function');
          expect(createPeerConnectionStub.getCall(0).args[0].onError).to.be.a('function');
          expect(createPeerConnectionStub.getCall(0).args[0].onRemoteStream).to.be.a('function');

          createPeerConnectionStub.restore();
        });
        describe('createPeerConnection callbacks', function () {
          describe(' onSuccess', function () {

            var localDescription,
              connectConferenceStub,
              pcOnSuccessSpy;

            beforeEach(function () {

              localDescription = {
                sdp: 'ABDC',
                type: 'abc'
              };

              createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
                setTimeout(function () {
                  pcOnSuccessSpy = sinon.spy(options, 'onSuccess');
                  options.onSuccess(localDescription);
                  pcOnSuccessSpy.restore();
                }, 10);
              });
            });

            afterEach(function () {
              createPeerConnectionStub.restore();
            });

            it('should call `rtcManager.connectConference`', function (done) {
              connectConferenceStub = sinon.stub(rtcMgr, 'connectConference');

              outgoingVideoCall.connect(newPeerConnection);

              setTimeout(function () {
                expect(pcOnSuccessSpy.calledOnce).to.equal(true);
                expect(connectConferenceStub.calledOnce).to.equal(true);
                expect(connectConferenceStub.calledAfter(pcOnSuccessSpy)).to.equal(true);
                expect(connectConferenceStub.getCall(0).args[0].peer).not.to.be.an('undefined');
                expect(connectConferenceStub.getCall(0).args[0].breed).not.to.be.an('undefined');
                expect(connectConferenceStub.getCall(0).args[0].sessionId).not.to.be.an('undefined');
                expect(connectConferenceStub.getCall(0).args[0].token).not.to.be.an('undefined');
                expect(connectConferenceStub.getCall(0).args[0].description.sdp).to.equal(localDescription.sdp);
                expect(connectConferenceStub.getCall(0).args[0].onSuccess).to.be.a('function');
                expect(connectConferenceStub.getCall(0).args[0].onError).to.be.a('function');
                connectConferenceStub.restore();
                done();
              }, 20);
            });

            describe('connectCall: Success', function () {
              var state,
                onSuccessSpy,
                response;

              beforeEach(function () {
                state = "connecting";
                response = {
                  id: '1234',
                  state: 'invitation-sent'
                };
                connectConferenceStub = sinon.stub(rtcMgr, 'connectConference', function (options) {
                  onSuccessSpy = sinon.spy(options, 'onSuccess');
                  options.onSuccess(response);
                  onSuccessSpy.restore();
                });
              });

              afterEach(function () {
                connectConferenceStub.restore();
              });

              it('should set the Call id', function (done) {
                outgoingVideoCall.connect(newPeerConnection);

                setTimeout(function () {
                  expect(outgoingVideoCall.id()).to.equal(response.id);
                  done();
                }, 20);

              });
              it('should execute `call.setState` with state `connected` ', function (done) {

                outgoingVideoCall.connect(newPeerConnection);

                setTimeout(function () {
                  expect(onSuccessSpy.called).to.equal(true);
//                  expect(outgoingVideoCall.getState()).to.equal('connected');
//                  expect(publishStub.calledOnce).to.equal(true);
//                  expect(publishStub.getCall(0).args[0]).to.equal('connected');
                  done();
                }, 20);
              });
            });

            describe('connectCall: Error', function () {
              var onErrorSpy,
                cruelError;

              beforeEach(function () {
                cruelError = 'This is a cruel error.';
                connectConferenceStub = sinon.stub(rtcMgr, 'connectConference', function (options) {
                  setTimeout(function () {
                    onErrorSpy = sinon.spy(options, 'onError');
                    options.onError(cruelError);
                    onErrorSpy.restore();
                  }, 0);
                });
              });

              afterEach(function () {
                connectConferenceStub.restore();
              });

              it('should publish the error', function (done) {

                outgoingVideoCall.connect(newPeerConnection);

                setTimeout(function () {
                  expect(onErrorSpy.calledOnce).to.equal(true);
                  expect(publishStub.called).to.equal(true);
                  expect(publishStub.getCall(0).args[0]).to.equal('error');
                  expect(publishStub.getCall(0).args[1].error).to.equal(cruelError);
                  done();
                }, 20);
              });
            });
          });
          describe('onRemoteStream', function () {
            var myStream,
              onRemoteStreamSpy;

            beforeEach(function () {
              myStream = 'stream';
              createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
                onRemoteStreamSpy = sinon.spy(options, 'onRemoteStream');
                options.onRemoteStream(myStream);
                onRemoteStreamSpy.restore();
              });
            });
            afterEach(function () {
              createPeerConnectionStub.restore();
            });

            it('should call publish `stream-added` with the remote stream', function (done) {

              outgoingVideoCall.connect(newPeerConnection);

              setTimeout(function () {
                expect(onRemoteStreamSpy.called).to.equal(true);
                expect(publishStub.called).to.equal(true);
                expect(publishStub.calledAfter(onRemoteStreamSpy)).to.equal(true);
                expect(publishStub.getCall(0).args[0]).to.equal('stream-added');
                expect(publishStub.getCall(0).args[1].stream).to.equal(myStream);
                done();
              }, 10);

            });
          });
          describe('onError', function () {
            var error,
              onErrorSpy;
            beforeEach(function () {
              error = 'Acid Error';

              createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
                setTimeout(function () {
                  onErrorSpy = sinon.spy(options, 'onError');
                  options.onError(error);
                  onErrorSpy.restore();
                }, 0);
              })
            });
            afterEach(function () {
              createPeerConnectionStub.restore();
            });

            it('should publish `error` with error data', function (done) {

              outgoingVideoCall.connect(newPeerConnection);

              setTimeout(function () {
                expect(onErrorSpy.calledWith(error)).to.equal(true);
                expect(publishStub.calledWith('error', {
                  error: error
                })).to.equal(true);
                done();
              }, 10);
            });
          });
        });
      });


    });
  });

});

