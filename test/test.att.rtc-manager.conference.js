/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe('RTCManager [Conference]', function () {
  'use strict';

  var factories,
    resourceManager,
    apiConfig,
    rtcManager,
    optionsForRTCM,
    userMediaSvc,
    peerConnSvc;

  beforeEach(function (){
    factories = ATT.private.factories;
    apiConfig = ATT.private.config.api;
    userMediaSvc = ATT.UserMediaService;
    peerConnSvc = ATT.PeerConnectionService;

  });

  describe('Methods', function () {
    var doOperationStub;

    beforeEach(function () {
      resourceManager = factories.createResourceManager(apiConfig);
      optionsForRTCM = {
        resourceManager: resourceManager,
        userMediaSvc: userMediaSvc,
        peerConnSvc: peerConnSvc
      };
      rtcManager = new ATT.private.RTCManager(optionsForRTCM);
    });


    describe('connectConference [CREATE]', function () {
      var  connectConfOpts,
        onSuccessSpy,
        onRemoteStreamSpy,
        onErrorSpy,
        localSdp;
      beforeEach(function () {
        localSdp = '123';
        onSuccessSpy = sinon.spy();
        onRemoteStreamSpy = sinon.spy();
        onErrorSpy = sinon.spy();

        connectConfOpts = {
          description: {
            sdp: localSdp,
            type: 'offer'
          },
          sessionId: '123',
          token : 'token',
          breed: 'conference', // `conference` or `call`
          peer: 'junito',
          onSuccess: onSuccessSpy,
          onRemoteStream : onRemoteStreamSpy,
          onError: onErrorSpy
        };
      });
      it('should exist', function () {
        expect(rtcManager.connectConference).to.be.a('function');
      });

      it('should throw an error if the call type is not defined', function () {
        connectConfOpts.breed = undefined;
        expect(rtcManager.connectConference.bind(rtcManager, connectConfOpts)).to.throw('No call type defined.');
      });

      it('should execute `doOperation(createCall)` [breed === call] with required params', function () {
        var params;

        connectConfOpts.breed = 'call';

        params = {
          url : {
            sessionId: connectConfOpts.sessionId,
            type: connectConfOpts.type
          },
          headers : {
            Authorization : 'Bearer ' + connectConfOpts.token
          }
        };

        doOperationStub = sinon.stub(resourceManager, 'doOperation');


        rtcManager.connectConference(connectConfOpts);

        expect(doOperationStub.called).to.equal(true);
        expect(doOperationStub.getCall(0).args[0]).to.equal('createCall');
        expect(doOperationStub.getCall(0).args[1]).to.be.an('object');
        expect(doOperationStub.getCall(0).args[1].params.url.sessionId).to.equal(params.url.sessionId);
        expect(doOperationStub.getCall(0).args[1].params.url.type).to.equal(params.url.type);
        expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + connectConfOpts.token);
        expect(doOperationStub.getCall(0).args[1].data.call.calledParty).to.equal(connectConfOpts.peer);
        expect(doOperationStub.getCall(0).args[1].data.call.sdp).to.equal(connectConfOpts.description.sdp);
        expect(doOperationStub.getCall(0).args[1].success).to.be.a('function');
        expect(doOperationStub.getCall(0).args[1].error).to.be.a('function');

        doOperationStub.restore();
      });

      it('should execute `doOperation(createCall)`[breed === conference] with required params', function () {
        var params;

        connectConfOpts.type = 'conference';

        params = {
          url : {
            sessionId: connectConfOpts.sessionId,
            type: connectConfOpts.type
          },
          headers : {
            Authorization : 'Bearer ' + connectConfOpts.token
          }
        };

        doOperationStub = sinon.stub(resourceManager, 'doOperation');


        rtcManager.connectConference(connectConfOpts);

        expect(doOperationStub.called).to.equal(true);
        expect(doOperationStub.getCall(0).args[0]).to.equal('createCall');
        expect(doOperationStub.getCall(0).args[1]).to.be.an('object');
        expect(doOperationStub.getCall(0).args[1].params.url.sessionId).to.equal(params.url.sessionId);
        expect(doOperationStub.getCall(0).args[1].params.url.type).to.equal(params.url.type);
        expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + connectConfOpts.token);
        expect(doOperationStub.getCall(0).args[1].data.conference.sdp).to.equal(connectConfOpts.description.sdp);
        expect(doOperationStub.getCall(0).args[1].success).to.be.a('function');
        expect(doOperationStub.getCall(0).args[1].error).to.be.a('function');

        doOperationStub.restore();
      });

      describe('doOperation: Success', function () {
        var conferenceId = 'SuperDuperID',
          response;

        response = {
          getResponseHeader: function (name) {
            switch (name) {
            case 'Location':
              return '/RTC/v1/sessions/0045-ab42-89a2/conferences/' + conferenceId;
            case 'x-state':
              return 'invitation-sent'; // seconds
            default:
              break;
            }
          }
        };
        beforeEach(function () {
          doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
            setTimeout(function () {
              options.success(response);
            }, 0);
          });
        });

        afterEach(function () {
          doOperationStub.restore();
        });
        it('should execute `onSuccess` with required params: [conference ID, state:x-state]', function (done) {
          rtcManager.connectConference(connectConfOpts);
          setTimeout(function () {
            try {
              expect(onSuccessSpy.called).to.equal(true);
              expect(onSuccessSpy.getCall(0).args[0].id).to.equal(conferenceId);
              expect(onSuccessSpy.getCall(0).args[0].state).to.equal('invitation-sent');
              done();
            } catch (e) {
              done(e);
            }
          }, 10);

        });
      });

      describe('doOperation: Error', function () {
        var err = {}
        beforeEach(function () {
          doOperationStub = sinon.stub(resourceManager, 'doOperation', function (operationName, options) {
            setTimeout(function () {
              options.error(err);
            }, 0);
          });
        });

        afterEach(function () {
          doOperationStub.restore();
        });
        it('should execute `onError` callback for `connectConference`', function (done) {
          rtcManager.connectConference(connectConfOpts);
          setTimeout(function () {
            try {
              expect(onErrorSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);

        });
      });
    });

    describe('removeParticipant', function () {
      var onSuccessSpy,
        onErrorSpy;

      beforeEach(function () {
        doOperationStub = sinon.stub(resourceManager, 'doOperation');

        onSuccessSpy = sinon.spy();
        onErrorSpy = sinon.spy();

        rtcManager.removeParticipant({
          sessionInfo: {},
          confId: '123',
          onSuccess: onSuccessSpy,
          onError: onErrorSpy,
          participant: 'jobs@apple.com'
        });
      });

      afterEach(function () {
        doOperationStub.restore();
      });

      it('should exist', function () {
        expect(rtcManager.removeParticipant).to.be.a('function');
      });

      it('should call resourceManager.doOperation', function () {
        expect(doOperationStub.calledWith('removeParticipant')).to.equal(true);
        expect(doOperationStub.getCall(0).args[1].params).to.be.an('object');
        expect(doOperationStub.getCall(0).args[1].success).to.be.a('function');
        expect(doOperationStub.getCall(0).args[1].error).to.be.a('function');
      });

      describe('Invalid parameters', function () {
        it('should throw an error if invalid `options` are passed', function () {
          expect(rtcManager.removeParticipant.bind(rtcManager)).to.throw('No `options` passed');
          expect(rtcManager.removeParticipant.bind(rtcManager, {
            confId: {},
            participant: 'joe'
          })).to.throw('No `sessionInfo` passed');
          expect(rtcManager.removeParticipant.bind(rtcManager, {
            sessionInfo: {},
            participant: 'joe'
          })).to.throw('No `confId` passed');
          expect(rtcManager.removeParticipant.bind(rtcManager, {
            sessionInfo: {},
            participant: 'joe',
            confId: '1234'
          })).to.throw('No `onSuccess` callback passed');
          expect(rtcManager.removeParticipant.bind(rtcManager, {
            sessionInfo: {},
            confId: '123',
            participant: 'joe',
            onSuccess: function () {}
          })).to.not.throw(Error);
        });
      });

      describe('Success on doOperation', function () {
        var onSuccessSpy,
          response;

        beforeEach(function () {
          onSuccessSpy = sinon.spy();
        });

        it('should call `options.onSuccess` if response.getResponseHeader() === `remove-pending`', function (done) {

          // ==== Positive case
          response = {
            getResponseHeader: function (name) {
              switch(name) {
                case 'x-state':
                  return 'remove-pending';
              }
            }
          };

          doOperationStub.restore();

          doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
            setTimeout(function () {
              options.success(response);
            }, 0);
          });

          rtcManager.removeParticipant({
            sessionInfo: {},
            confId: '123',
            onSuccess: onSuccessSpy,
            participant: 'waldo'
          });

          setTimeout(function () {
            try {
              expect(onSuccessSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 10);
        });
      });

      describe('Error on doOperation', function () {
        var onErrorSpy,
          error,
          createAPIErrorCodeStub;

        beforeEach(function () {
          onErrorSpy = sinon.spy();
        });

        afterEach(function () {
          createAPIErrorCodeStub.restore();
        });

        it('should call `options.onError` if resourceManager returns an error', function () {
          error = {
            message: 'error',
            HttpStatusCode: '400'
          };

          createAPIErrorCodeStub = sinon.stub(ATT.Error, 'createAPIErrorCode', function () {
            return error;
          });

          doOperationStub.restore();

          doOperationStub = sinon.stub(resourceManager, 'doOperation', function(operationName, options) {
            options.error(error);
          });

          rtcManager.removeParticipant({
            sessionInfo: {},
            confId: '123',
            onSuccess: function () { },
            onError: onErrorSpy,
            participant: 'waldo'
          });

          expect(onErrorSpy.calledWith(error)).to.equal(true);
        });
      });
    });

    describe('acceptMediaModifications', function () {

      it('should exist', function () {
        expect(rtcManager.acceptMediaModifications).to.be.a('function');
      });

      it('should execute resourceManager.doOperation', function () {
        var modOptions = {
          breed: 'conference',
          sessionId: 'sessionId',
          callId: 'callId',
          token: 'token',
          modId: 'modId',
          sdp: 'sdp'
        };
        doOperationStub = sinon.stub(resourceManager, 'doOperation');

        rtcManager.acceptMediaModifications(modOptions);

        expect(doOperationStub.calledWith('acceptModifications')).to.equal(true);
        expect(doOperationStub.getCall(0).args[1].params.url[0]).to.equal(modOptions.sessionId);
        expect(doOperationStub.getCall(0).args[1].params.url[1]).to.equal('conferences');
        expect(doOperationStub.getCall(0).args[1].params.url[2]).to.equal(modOptions.callId);
        expect(doOperationStub.getCall(0).args[1].params.headers.Authorization).to.equal('Bearer ' + modOptions.token);
        expect(doOperationStub.getCall(0).args[1].params.headers['x-modId']).to.equal(modOptions.modId);
        expect(doOperationStub.getCall(0).args[1].data.conferenceModifications.sdp).to.equal(modOptions.sdp);
        expect(doOperationStub.getCall(0).args[1].success).to.be.a('function');
        expect(doOperationStub.getCall(0).args[1].error).to.be.a('function');

        doOperationStub.restore();
      });


    });
  });
});