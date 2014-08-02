/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('Call [Conference]', function () {
  "use strict";

  var Call,
    restClientStub;

  beforeEach(function () {
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

      addParticipantStub = sinon.stub(rtcMgr, 'addParticipant', function (options) {
        options.onParticipantPending(modId);
      });

      outgoingConference = new ATT.rtc.Call(optionsOutgoing);

      setStateStub = sinon.stub(outgoingConference, 'setState');
    });

    afterEach(function () {
      addParticipantStub.restore();
      getRTCManagerStub.restore();
      createEEStub.restore();
      setStateStub.restore();
    });

    describe('addParticipant', function () {

      it('should exist', function () {
        expect(outgoingConference.addParticipant).to.be.a('function');
      });

      it('should call rtcManager.addParticipant', function () {
        outgoingConference.addParticipant('12345');
        expect(addParticipantStub.called).to.equal(true);
        expect(addParticipantStub.getCall(0).args[0].sessionInfo).to.be.an('object');
        expect(addParticipantStub.getCall(0).args[0].participant).to.equal('12345');
        expect(addParticipantStub.getCall(0).args[0].confId).to.equal(outgoingConference.id());
        expect(addParticipantStub.getCall(0).args[0].onParticipantPending).to.be.a('function');
        expect(addParticipantStub.getCall(0).args[0].onError).to.be.a('function');
      });

      describe('Success on rtcManager.addParticipant', function () {
        var setParticipantStub;

        it('should call `setParticipant`', function () {
          setParticipantStub = sinon.stub(outgoingConference, 'setParticipant');

          outgoingConference.addParticipant('4250001');

          expect(setParticipantStub.calledWith('4250001', 'invitee', modId)).to.equal(true);
        });

        it('should publish `participant-pending` when rtcMgr invokes `onParticipantPending` callback', function () {
          outgoingConference.addParticipant('12345');

          expect(setStateStub.calledOnce).to.equal(true);
          expect(setStateStub.calledWith('participant-pending')).to.equal(true);
        });
      });

      describe('Error on rtcManager.addParticipant', function () {
        var error;

        beforeEach(function () {
          addParticipantStub.restore();

          error = {
            message: 'error'
          };

          addParticipantStub = sinon.stub(rtcMgr, 'addParticipant', function (options) {
            options.onError(error);
          });
        });


        it('should publish `error` when rtcMgr invokes `onError` callback', function (done) {

          outgoingConference.addParticipant('12345');

          setTimeout(function () {
            try {
              expect(publishStub.calledOnce).to.equal(true);
              expect(publishStub.calledWith('error', error)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });
      });
    });

    describe('[US233244] participants', function () {

      it('should exist', function () {
        expect(outgoingConference.participants).to.be.a('function');
      });

      it('should return `empty` object if no participants were set', function () {
        var participants = outgoingConference.participants();

        expect(participants).to.be.an('object');
        expect(Object.keys(participants).length).to.equal(0);
      });

      it('should return `participants` list', function () {
        outgoingConference.setParticipant('456', 'invitee', '123');

        var participants = outgoingConference.participants();
        expect(participants).to.be.an('object');
        expect(participants['123']).to.be.an('object');
        expect(participants['123'].status).to.equal('invitee');
        expect(participants['123'].participant).to.equal('456');
        expect(participants['123'].id).to.equal('123');
      });
    });

    describe('setParticipant', function () {

      it('should exist', function () {
        expect(outgoingConference.setParticipant).to.be.a('function');
      });

      it('should add the new participant to the list', function () {
        var participants;

        outgoingConference.setParticipant('raman@raman.com', 'invitee', 'abc123');
        outgoingConference.setParticipant('4250000001', 'accepted', 'cba123');
        outgoingConference.setParticipant('toyin@toyin.com', 'accepted', 'efg456');

        participants = outgoingConference.participants();
        expect(participants['abc123'].status).equal('invitee');
        expect(participants['cba123'].participant).equal('4250000001');
        expect(participants['efg456'].id).equal('efg456');
      });
    });

    describe('updateParticipant', function () {
      it('should exist', function () {
        expect(outgoingConference.updateParticipant).to.be.a('function');
      });

      it('should update the status of that specific participant', function () {
        var participants;

        outgoingConference.setParticipant('raman@raman.com', 'invitee', 'abc123');
        outgoingConference.setParticipant('4250000001', 'invitee', 'cba123');
        outgoingConference.updateParticipant('abc123', 'accepted');

        participants = outgoingConference.participants();
        expect(participants['abc123'].status).equal('accepted');

        // don't touch the other guy
        expect(participants['cba123'].status).equal('invitee');
      });

      it('should call setState with `connected` if [status === `accepted`]', function () {
        outgoingConference.setParticipant('raman@raman.com', 'invitee', 'abc123');
        outgoingConference.updateParticipant('abc123', 'accepted');

        expect(setStateStub.calledWith('connected')).to.equal(true);
      });

      it('should call setState with `rejected` if [status === `rejected`]', function () {
        outgoingConference.setParticipant('raman@raman.com', 'invitee', 'abc123');
        outgoingConference.updateParticipant('abc123', 'rejected');

        expect(setStateStub.calledWith('rejected')).to.equal(true);
      });
    });

    describe('connect', function () {
      var createPeerConnectionStub,
        optionsOutgoingVideo,
        outgoingVideoConference,
        pcOptions;

      beforeEach(function () {
        optionsOutgoingVideo = {
          breed: 'conference',
          peer: '12345',
          mediaType: 'video',
          type: ATT.CallTypes.OUTGOING,
          sessionInfo : {sessionId : '12345', token : '123'}
        };
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

        it('should execute createPeerConnection with mediaConstraints, localStream and remoteSdp', function () {

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

          var localSDP,
            connectConferenceStub,
            pcOnSuccessSpy,
            peerConnection;

          beforeEach(function () {

            localSDP = 'ABCD';
            peerConnection = {
              getLocalSDP: function () {
                return localSDP;
              }
            };
            createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
              setTimeout(function () {
                pcOnSuccessSpy = sinon.spy(options, 'onSuccess');
                options.onSuccess(localSDP);
                pcOnSuccessSpy.restore();
              }, 100);

              return peerConnection;
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
              expect(connectConferenceStub.getCall(0).args[0].localSdp).to.equal(outgoingVideoConference.localSdp());
              expect(connectConferenceStub.getCall(0).args[0].onSuccess).to.be.a('function');
              expect(connectConferenceStub.getCall(0).args[0].onError).to.be.a('function');
              connectConferenceStub.restore();
              done();
            }, 200);
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
              }, 200);

            });
            it('should execute `conf.setState` with state `connected` ', function (done) {

              outgoingVideoConference.connect();

              setTimeout(function () {
                expect(onSuccessSpy.called).to.equal(true);
                expect(outgoingVideoConference.getState()).to.equal('connected');
                expect(publishStub.calledOnce).to.equal(true);
                expect(publishStub.getCall(0).args[0]).to.equal('connected');
                done();
              }, 200);
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
                }, 50);
              });
            })

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
              }, 200);
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
            remoteSdp: 'abc',
            sessionInfo : {
              sessionId : '123',
              token : 'token'
            }
          };

          incomingConf = new ATT.rtc.Call(optionsIncomingConf);
        });
        it('should execute createPeerConnection with mediaConstraints, localStream and remoteSdp for incoming conference', function () {

          createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection');
          incomingConf.connect();

          expect(createPeerConnectionStub.called).to.equal(true);
          expect(createPeerConnectionStub.getCall(0).args[0]).to.be.an('object');
          expect(createPeerConnectionStub.getCall(0).args[0].mediaType).to.equal(incomingConf.mediaType());
          expect(createPeerConnectionStub.getCall(0).args[0].stream).to.equal(incomingConf.localStream());
          expect(createPeerConnectionStub.getCall(0).args[0].remoteSdp).to.equal(incomingConf.remoteSdp());
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
              localSdp,
              peerConnection;

            beforeEach(function () {
              localSdp = '123';
              rtcPCStub = sinon.stub(window, 'RTCPeerConnection');

              peerConnection = {
                getLocalSDP: function () {
                  return localSdp;
                }
              };
              createPeerConnectionStub = sinon.stub(factories, 'createPeerConnection', function (options) {
                setTimeout(function () {
                  options.onSuccess(localSdp);
                }, 0);
                return peerConnection;
              });
            });

            afterEach(function () {
              createPeerConnectionStub.restore();
              rtcPCStub.restore();
            });

            it('should execute RTCManager.connectConference with localSdp', function (done) {

              var getLocalSDPStub = sinon.stub(peerConnection, 'getLocalSDP', function () {
                return localSdp;
              });
              connectConferenceStub = sinon.stub(rtcMgr, 'connectConference');

              incomingConf.connect();

              setTimeout(function () {
                expect(connectConferenceStub.called).to.equal(true);
                expect(connectConferenceStub.getCall(0).args[0]).to.be.an('object');
                expect(connectConferenceStub.getCall(0).args[0].localSdp).to.not.equal(null);
                expect(connectConferenceStub.getCall(0).args[0].localSdp).to.equal(incomingConf.localSdp());
                expect(connectConferenceStub.getCall(0).args[0].sessionInfo).to.equal(optionsIncomingConf.sessionInfo);
                expect(connectConferenceStub.getCall(0).args[0].onSuccess).to.be.a('function');
                expect(connectConferenceStub.getCall(0).args[0].onError).to.be.a('function');

                getLocalSDPStub.restore();
                connectConferenceStub.restore();
                done();
              }, 100);

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
              }, 100);
            });
          });
        });

      });

    });
  });
});