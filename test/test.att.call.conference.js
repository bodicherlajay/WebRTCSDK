/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call [Conference]', function () {
  "use strict";

  var Call,
    restClientStub,
    factories,
    optionsOutgoingVideo;

  beforeEach(function () {

    optionsOutgoingVideo = {
      breed: 'conference',
      peer: '12345',
      mediaType: 'video',
      type: ATT.CallTypes.OUTGOING,
      sessionInfo : {sessionId : '12345', token : '123'}
    };

    factories = ATT.private.factories;
    restClientStub = sinon.stub(RESTClient.prototype, 'ajax');
    Call = ATT.rtc.Call;
  });

  afterEach(function () {
    restClientStub.restore();
  });

  describe('Constructor', function () {

    it('should create conference Call object with valid parameters ', function () {
      var options,
        conference;

      options = {
        breed: 'conference',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'}
      };

      conference = new Call(options);

      expect(conference instanceof Call).to.equal(true);
      expect(conference.breed()).to.equal('conference');
      expect(conference.participants).to.be.a('function');
    });
  });

  describe('Methods', function () {

    var optionsOutgoing,
      outgoingConference,
      addParticipantStub,
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
      setStateStub,
      modId;

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
        breed: 'conference',
        peer: '12345',
        mediaType: 'audio',
        type: ATT.CallTypes.OUTGOING,
        sessionInfo : {sessionId : '12345', token : '123'},
        id: '1234'
      };

      modId = 'abc123';

      emitter = ATT.private.factories.createEventEmitter();

      createEEStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitter;
      });

      publishStub = sinon.stub(emitter, 'publish');

      outgoingConference = new ATT.rtc.Call(optionsOutgoing);

      setStateStub = sinon.stub(outgoingConference, 'setState');
    });

    afterEach(function () {
      getRTCManagerStub.restore();
      createEEStub.restore();
      setStateStub.restore();
    });

    describe('remoteSdp', function () {
      var createPeerConnctionStub,
        peerConnection;

      beforeEach(function () {
        peerConnection = {
          getRemoteDescription: function () { return; },
          setRemoteDescription: function () {}
        };
        createPeerConnctionStub = sinon.stub(factories, 'createPeerConnection', function () {
          return peerConnection;
        });
      });
      afterEach(function () {
        createPeerConnctionStub.restore();
      });

      it('should return the SDP given from `peerConnection`\s `remoteDescription`', function () {

        var getRemoteDescriptionStub,
          remoteDesc = {
            sdp: '213',
            type: 'abc'
          };

        getRemoteDescriptionStub = sinon.stub(peerConnection, 'getRemoteDescription', function () {
          return remoteDesc;
        });
        // before connecting it should be null
        expect(outgoingConference.remoteSdp()).to.equal(null);

        outgoingConference.connect();
        // afterConnecting, it should call peerConnection.getRemoteDescription
        expect(outgoingConference.remoteSdp()).to.equal(remoteDesc.sdp);
        expect(getRemoteDescriptionStub.called).to.equal(true);

      });
    });

    describe('addParticipant', function () {

      it('should exist', function () {
        expect(outgoingConference.addParticipant).to.be.a('function');
      });

      it('should call rtcManager.addParticipant', function () {
        addParticipantStub = sinon.stub(rtcMgr, 'addParticipant');

        outgoingConference.addParticipant('12345');

        expect(addParticipantStub.called).to.equal(true);
        expect(addParticipantStub.getCall(0).args[0].sessionInfo).to.be.an('object');
        expect(addParticipantStub.getCall(0).args[0].invitee).to.equal('12345');
        expect(addParticipantStub.getCall(0).args[0].confId).to.equal(outgoingConference.id());
        expect(addParticipantStub.getCall(0).args[0].onSuccess).to.be.a('function');
        expect(addParticipantStub.getCall(0).args[0].onError).to.be.a('function');

        addParticipantStub.restore();
      });

      describe('Success on rtcManager.addParticipant', function () {
        var onSuccessSpy,
          invitations;

        beforeEach(function () {
          addParticipantStub = sinon.stub(rtcMgr, 'addParticipant', function (options) {
            onSuccessSpy = sinon.spy(options, 'onSuccess');
            options.onSuccess();
            onSuccessSpy.restore();
          });
        });

        afterEach(function () {
          addParticipantStub.restore();
        });

        it('should set the invitee to `invited`', function () {
          outgoingConference.addParticipant('johnny');

          invitations = outgoingConference.invitations();
          expect(invitations['johnny'].status).to.equal('invited');
        });

        it('should publish `response-pending` when rtcMgr invokes `onSuccess` callback', function () {
          outgoingConference.addParticipant('johnny');
          expect(publishStub.calledWith('response-pending')).to.equal(true);
          expect(publishStub.getCall(0).args[1].invitee).to.equal('johnny');
        });
      });

      describe('Error on rtcManager.addParticipant', function () {
        var error;

        beforeEach(function () {
          error = {
            message: 'error'
          };
        });

        afterEach(function () {
          addParticipantStub.restore();
        });

        it('should publish `error` when rtcMgr invokes `onError` callback', function (done) {

          addParticipantStub = sinon.stub(rtcMgr, 'addParticipant', function (options) {
            options.onError(error);
          });

          outgoingConference.addParticipant('12345');

          setTimeout(function () {
            try {
              expect(publishStub.calledOnce).to.equal(true);
              expect(publishStub.calledWith('error', error)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });

        it('should publish `error` if rtcMgr throws an error', function (done) {
          var error = {
            message: 'thrown!'
          };

          addParticipantStub = sinon.stub(rtcMgr, 'addParticipant', function () {
            throw error;
          });

          outgoingConference.addParticipant('12345');

          setTimeout(function () {
            try {
              expect(publishStub.calledOnce).to.equal(true);
              expect(publishStub.calledWith('error', error)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 50);
        });
      });
    });

    describe.skip('participants', function () {

      it('should exist', function () {
        expect(outgoingConference.participants).to.be.a('function');
      });

      it('should return `empty` object if no participants were set', function () {
        var participants = outgoingConference.participants();

        expect(participants).to.be.an('object');
        expect(Object.keys(participants).length).to.equal(0);
      });

      it('should return `participants` list', function () {
        outgoingConference.setParticipant('john', 'invited', 'modId');
        outgoingConference.setParticipant('peter', 'invited', 'modId');

        var participants = outgoingConference.participants();

        expect(participants).to.be.an('object');
        expect(participants['john']).to.be.an('object');
        expect(participants['peter']).to.be.an('object');
      });
    });

    describe('connect', function () {
      var createPeerConnectionStub,
        outgoingVideoConference,
        pcOptions;

      beforeEach(function () {

        outgoingVideoConference = new Call(optionsOutgoingVideo);

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

          outgoingVideoConference.connect();

          expect(createPeerConnectionStub.calledOnce).to.equal(true);
          expect(createPeerConnectionStub.getCall(0).args[0].mediaType).to.equal(outgoingVideoConference.mediaType());
          expect(createPeerConnectionStub.getCall(0).args[0].stream).to.equal(outgoingVideoConference.localStream());
          expect(createPeerConnectionStub.getCall(0).args[0].onSuccess).to.be.a('function');
          expect(createPeerConnectionStub.getCall(0).args[0].onError).to.be.a('function');
          expect(createPeerConnectionStub.getCall(0).args[0].onRemoteStream).to.be.a('function');

          createPeerConnectionStub.restore();
        });

        describe('createPeerConnection: onSuccess', function () {

          var localDescription,
            connectConferenceStub,
            pcOnSuccessSpy,
            peerConnection;

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

            outgoingVideoConference.connect();

            setTimeout(function () {
              expect(pcOnSuccessSpy.calledOnce).to.equal(true);
              expect(connectConferenceStub.calledOnce).to.equal(true);
              expect(connectConferenceStub.calledAfter(pcOnSuccessSpy)).to.equal(true);
              expect(connectConferenceStub.getCall(0).args[0].sessionId).not.to.be.an('undefined');
              expect(connectConferenceStub.getCall(0).args[0].token).not.to.be.an('undefined');
              expect(connectConferenceStub.getCall(0).args[0].description.sdp).to.equal(localDescription.sdp);
              expect(connectConferenceStub.getCall(0).args[0].onSuccess).to.be.a('function');
              expect(connectConferenceStub.getCall(0).args[0].onError).to.be.a('function');
              connectConferenceStub.restore();
              done();
            }, 20);
          });

          describe('connectConference: Success', function () {
            var state,
              onSuccessSpy,
              response;

            beforeEach(function () {
              state = "connecting";
              response = {
                id : '1234',
                state : 'invitation-sent'
              };
              connectConferenceStub = sinon.stub(rtcMgr, 'connectConference', function (options){
                onSuccessSpy = sinon.spy(options, 'onSuccess');
                options.onSuccess(response);
                onSuccessSpy.restore();
              });
            });

            afterEach(function () {
              connectConferenceStub.restore();
            });

            it('should set the conference id', function (done) {
              outgoingVideoConference.connect();

              setTimeout(function () {
                expect(outgoingVideoConference.id()).to.equal(response.id);
                done();
              }, 20);

            });
            it('should execute `conf.setState` with state `connected` ', function (done) {

              outgoingVideoConference.connect();

              setTimeout(function () {
                expect(onSuccessSpy.called).to.equal(true);
                expect(outgoingVideoConference.getState()).to.equal('connected');
                expect(publishStub.calledOnce).to.equal(true);
                expect(publishStub.getCall(0).args[0]).to.equal('connected');
                done();
              }, 20);
            });
          });

          describe('connectConference: Error', function () {
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

              outgoingVideoConference.connect();

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
      });

      describe('connect [INCOMING]', function () {
        var incomingConf,
          optionsIncomingConf;

        beforeEach(function () {

          optionsIncomingConf = {
            breed: 'conference',
            peer: '12345',
            mediaType: 'video',
            type: ATT.CallTypes.INCOMING,
            remoteDescription: {
              sdp: '3242',
              type: 'offer'
            },
            sessionInfo : {
              sessionId : '123',
              token : 'token'
            }
          };

          incomingConf = new ATT.rtc.Call(optionsIncomingConf);
        });

        it('should execute `createPeerConnection` with `remoteDescription` for incoming conference', function () {

          createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection');

          incomingConf.connect();

          expect(createPeerConnectionStub.called).to.equal(true);
          expect(createPeerConnectionStub.getCall(0).args[0]).to.be.an('object');
          expect(createPeerConnectionStub.getCall(0).args[0].mediaType).to.equal(incomingConf.mediaType());
          expect(createPeerConnectionStub.getCall(0).args[0].stream).to.equal(incomingConf.localStream());
          expect(createPeerConnectionStub.getCall(0).args[0].remoteSdp)
            .to.equal(incomingConf.remoteSdp());
          expect(createPeerConnectionStub.getCall(0).args[0].onSuccess).to.be.a('function');
          expect(createPeerConnectionStub.getCall(0).args[0].onError).to.be.a('function');
          expect(createPeerConnectionStub.getCall(0).args[0].onRemoteStream).to.be.a('function');

          createPeerConnectionStub.restore();
        });

        describe('createPeerConnection callbacks', function () {

          describe('onSuccess', function () {

            var setLocalSdpStub,
              connectConferenceStub,
              rtcPCStub,
              localDescription,
              peerConnection,
              onSuccessSpy;

            beforeEach(function () {
              localDescription = {
                sdp: '213',
                type: 'abc'
              };
              rtcPCStub = sinon.stub(window, 'RTCPeerConnection');

              peerConnection = {
                getLocalDescription: function () {
                  return localDescription;
                }
              };

              createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
                setTimeout(function () {
                  onSuccessSpy = sinon.spy(options, 'onSuccess');
                  options.onSuccess(localDescription);
                  onSuccessSpy.restore();
                }, 0);
              });
            });

            afterEach(function () {
              createPeerConnectionStub.restore();
              rtcPCStub.restore();
            });

            it('should execute RTCManager.connectConference with localSdp', function (done) {

              connectConferenceStub = sinon.stub(rtcMgr, 'connectConference');

              incomingConf.setId('ABCD');

              incomingConf.connect();

              setTimeout(function () {
                expect(onSuccessSpy.called).to.equal(true);
                expect(connectConferenceStub.called).to.equal(true);
                expect(connectConferenceStub.getCall(0).args[0].conferenceId).to.equal(incomingConf.id());
                expect(connectConferenceStub.getCall(0).args[0].description).to.equal(localDescription);
                expect(connectConferenceStub.getCall(0).args[0].sessionInfo).to.equal(optionsIncomingConf.sessionInfo);
                expect(connectConferenceStub.getCall(0).args[0].onSuccess).to.be.a('function');
                expect(connectConferenceStub.getCall(0).args[0].onError).to.be.a('function');
                connectConferenceStub.restore();
                done();
              }, 10);

            });

            describe('RTCManager.connectConference callbacks', function () {

              describe('onSuccess', function () {

                var setStateStub;

                beforeEach(function () {

                  connectConferenceStub = sinon.stub(rtcMgr, 'connectConference', function (options) {
                    setTimeout(function () {
                      options.onSuccess();
                    }, 0);
                  });

                });

                afterEach(function () {
                  connectConferenceStub.restore();
                });

                it('should set the state to `connecting`', function (done) {
                  incomingConf.connect();

                  setTimeout(function () {
                    try {
                      expect(incomingConf.getState()).to.equal('connecting');
                      expect(publishStub.calledWith('connecting')).to.equal(true);
                      done();
                    } catch (e) {
                      done(e);
                    }
                  }, 100);

                });
              });

              describe('onError', function () {

                var error;
                beforeEach(function () {
                  error = 'fataler Fehler';

                  connectConferenceStub = sinon.stub(rtcMgr, 'connectConference', function (options) {
                    setTimeout(function () {
                      options.onError(error);
                    }, 0);
                  })
                });

                afterEach(function () {
                  connectConferenceStub.restore();
                });

                it('should publish an error with error data', function (done) {
                  incomingConf.connect();

                  setTimeout(function () {
                    expect(publishStub.calledWith('error')).to.equal(true);
                    expect(publishStub.calledWith('error', {
                      error: error
                    })).to.equal(true);
                    done();
                  }, 100);
                })
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

              var onStreamAddedSpy = sinon.spy();

              incomingConf.connect();

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
              var onErrorHandlerSpy = sinon.spy();

              incomingConf.connect();

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

    describe('disconnectConference', function () {

      var onSpy,
        confCall;

      beforeEach(function () {
        onSpy = sinon.spy(rtcMgr, 'on');
        confCall = new ATT.rtc.Call({
          breed: 'conference',
          peer: '12345',
          mediaType: 'audio',
          type: ATT.CallTypes.OUTGOING,
          sessionInfo : {sessionId : '12345', token : '123'}
        });
      });

      afterEach(function () {
        onSpy.restore();
      });

      it('Should exist', function () {
        expect(confCall.disconnectConference).to.be.a('function');
      });

      it('should execute confCall.setState with `disconnecting`', function () {

        confCall.disconnectConference();

        expect(confCall.getState()).to.equal('disconnecting');

      });

      it('should call rtcManager.disconnectCall', function () {
        var disconnectCallStub = sinon.stub(rtcMgr, 'disconnectCall');

        confCall.disconnectConference();

        expect(disconnectCallStub.called).to.equal(true);
        expect(disconnectCallStub.getCall(0).args[0].callId).to.equal(confCall.id());
        expect(disconnectCallStub.getCall(0).args[0].breed).to.equal(confCall.breed());
        expect(disconnectCallStub.getCall(0).args[0].sessionId).not.to.be.a('undefined');
        expect(disconnectCallStub.getCall(0).args[0].token).not.to.be.a('undefined');
        expect(disconnectCallStub.getCall(0).args[0].onSuccess).to.be.a('function');
        expect(disconnectCallStub.getCall(0).args[0].onError).to.be.a('function');

        disconnectCallStub.restore();
      });
    });
  });

  describe('Events', function () {
    var emitterEM,
        createEventEmitterStub,
        outgoingVideoConf,
        createPeerConnectionStub,
        remoteDesc,
        peerConnection,
        optionsforRTCM,
        rtcManager,
        getRTCManagerStub,
        resourceManager,
        apiConfig;

    beforeEach(function () {

      apiConfig = ATT.private.config.api;
      resourceManager = factories.createResourceManager(apiConfig);

      optionsforRTCM = {
        resourceManager: resourceManager,
        userMediaSvc: ATT.UserMediaService,
        peerConnSvc: ATT.PeerConnectionService
      };

      emitterEM = factories.createEventEmitter();
      createEventEmitterStub =  sinon.stub(factories, 'createEventEmitter', function () {
        return emitterEM;
      });
      rtcManager = new ATT.private.RTCManager(optionsforRTCM);
      createEventEmitterStub.restore();

      getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
        return rtcManager;
      });

      outgoingVideoConf = new Call(optionsOutgoingVideo);

      remoteDesc = {
        sdp: 'sdf',
        type: 'offer'
      };

      peerConnection = {
        getRemoteDescription: function () {
          return remoteDesc;
        },
        setRemoteDescription: function () {}
      };

      createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function () {
        return peerConnection;
      });

      outgoingVideoConf.connect();
    });

    afterEach(function () {
      getRTCManagerStub.restore();
      createPeerConnectionStub.restore();
    });

    describe('call-connected', function () {
      var setRemoteDescriptionStub;
      beforeEach(function () {
        setRemoteDescriptionStub = sinon.stub(peerConnection, 'setRemoteDescription');
      });

      afterEach(function () {
        setRemoteDescriptionStub.restore();
      });

      it('should set the remote description', function (done) {

        emitterEM.publish('call-connected', {
          type: 'conference',
          remoteSdp: 'remoteSdp'
        });

        setTimeout(function () {
          expect(setRemoteDescriptionStub.called).to.equal(true);
          expect(setRemoteDescriptionStub.getCall(0).args[0].sdp).to.equal('remoteSdp');
          expect(setRemoteDescriptionStub.getCall(0).args[0].type).to.equal('answer');
          done();
        }, 10);
      });

      it('should NOT set the remote description if it doesn\'t come in the event data', function (done) {

        emitterEM.publish('call-connected', {
          type: 'conference',
          remoteSdp: undefined
        });

        setTimeout(function () {
          expect(setRemoteDescriptionStub.called).to.equal(false);
          done();
        }, 10);
      });
    });

    describe('invitation-accepted', function () {
      var modifications;

      beforeEach(function () {
        modifications = {
          from: 'me@myplace.com',
          type: 'conference',
          modificationId: 'abc321',
          reason: 'success'
        };
      });

      it('should create a participant with `active` status', function (done) {

        var rtcMgrAddParticipantStub = sinon.stub(rtcManager, 'addParticipant');

        outgoingVideoConf.addParticipant(modifications.from);

        emitterEM.publish('media-mod-terminations', modifications);

        setTimeout(function () {
          try {
            var participantInfo = outgoingVideoConf.participants()[modifications.from];

            expect(participantInfo.status).to.equal('active');

            rtcMgrAddParticipantStub.restore();
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      it('should publish `invite-accepted`', function (done) {
        var rtcMgrAddParticipantStub = sinon.stub(rtcManager, 'addParticipant'),
          onInvitedAcceptedSpy = sinon.spy(),
          participants;

        outgoingVideoConf.addParticipant(modifications.from);

        outgoingVideoConf.on('invite-accepted', onInvitedAcceptedSpy);

        emitterEM.publish('media-mod-terminations', modifications);

        participants = outgoingVideoConf.participants();

        setTimeout(function () {
          try {
            expect(onInvitedAcceptedSpy.calledOnce).to.equal(true);
            expect(onInvitedAcceptedSpy.getCall(0).args[0].participants).to.equal(participants);
            rtcMgrAddParticipantStub.restore();
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });

    describe('invitation-rejected', function () {
      var modifications;

      beforeEach(function () {
        modifications = {
          from: 'me@myplace.com',
          type: 'conference',
          modificationId: 'abc321',
          reason: 'rejected'
        };
      });

      it('should set invitee with `rejected` status', function (done) {

        var rtcMgrAddParticipantStub = sinon.stub(rtcManager, 'addParticipant', function (options) {
          options.onSuccess();
        });

        outgoingVideoConf.addParticipant(modifications.from);

        emitterEM.publish('media-mod-terminations', modifications);

        setTimeout(function () {
          try {
            var invitationInfo = outgoingVideoConf.invitations()[modifications.from];
            expect(invitationInfo.status).to.equal('rejected');
            rtcMgrAddParticipantStub.restore();
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      it('should publish `rejected`', function (done) {
        var rtcMgrAddParticipantStub = sinon.stub(rtcManager, 'addParticipant', function (options) {
            options.onSuccess();
          }),
          onInvitedRejectedSpy = sinon.spy(),
          invitations;

        outgoingVideoConf.addParticipant(modifications.from);

        outgoingVideoConf.on('rejected', onInvitedRejectedSpy);

        emitterEM.publish('media-mod-terminations', modifications);

        invitations = outgoingVideoConf.invitations();

        setTimeout(function () {
          try {
            expect(onInvitedRejectedSpy.calledOnce).to.equal(true);
            expect(onInvitedRejectedSpy.getCall(0).args[0].invitations).to.equal(invitations);
            rtcMgrAddParticipantStub.restore();
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });
    });

    describe('media-modifications', function () {
      var setRemoteDescriptionStub;

      beforeEach(function () {
        setRemoteDescriptionStub = sinon.stub(peerConnection, 'setRemoteDescription');
      });
      afterEach(function () {
        setRemoteDescriptionStub.restore();
      });

      it('should set the remote description', function (done) {

        emitterEM.publish('media-modifications', {
          remoteSdp: 'abdc',
          modificationId: 'ID'
        });

        setTimeout(function () {
          expect(setRemoteDescriptionStub.called).to.equal(true);
          expect(setRemoteDescriptionStub.getCall(0).args[0].sdp).to.equal('abdc');
          expect(setRemoteDescriptionStub.getCall(0).args[0].type).to.equal('offer');
          done();
        }, 10);
      });
      it('should NOT set the remote description if it doesn\'t come in the event data', function (done) {

        emitterEM.publish('media-modifications', {
          remoteSdp: undefined,
          modificationId: 'ID'
        });

        setTimeout(function () {
          expect(setRemoteDescriptionStub.called).to.equal(false);
          done();
        }, 10);
      });
    });

    describe('media-mod-terminations', function () {

      var setRemoteDescriptionStub;

      beforeEach(function () {
        setRemoteDescriptionStub = sinon.stub(peerConnection, 'setRemoteDescription');
      });
      afterEach(function () {
        setRemoteDescriptionStub.restore();
      });

      it('should set the remoteSdp if it comes in the event', function (done) {

        emitterEM.publish('media-mod-terminations', {
          remoteSdp: 'abdcX',
          type: 'conference',
          modificationId: 'ID',
          reason: 'abdc',
          from: 'me'
        });

        setTimeout(function () {
          expect(setRemoteDescriptionStub.called).to.equal(true);
          expect(setRemoteDescriptionStub.getCall(0).args[0].sdp).to.equal('abdcX');
          // TODO: when should this be offer/answer???
          expect(setRemoteDescriptionStub.getCall(0).args[0].type).to.equal('offer');
          done();
        }, 10);
      })
    });

  });
});