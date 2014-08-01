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


    describe('connectConference', function () {
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
          localSdp: localSdp,
          onSuccess: onSuccessSpy,
          onRemoteStream : onRemoteStreamSpy,
          onError: onErrorSpy
        };
      });
      it('should exist', function () {
        expect(rtcManager.connectConference).to.be.a('function');
      });
      // TODO: can we reuse startCall apiconfig?
      it('should execute `doOperation(createConference)` with required params', function () {
        doOperationStub = sinon.stub(resourceManager, 'doOperation');

        rtcManager.connectConference(connectConfOpts);

        expect(doOperationStub.called).to.equal(true);
        expect(doOperationStub.getCall(0).args[0]).to.equal('createConference');
        expect(doOperationStub.getCall(0).args[1]).to.be.an('object');
        expect(doOperationStub.getCall(0).args[1].data).eql({
          conferenceModifications: {
            sdp: localSdp
          }
        });
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
          }, 100);

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
          }, 100);

        });
      });
    });
  });
});