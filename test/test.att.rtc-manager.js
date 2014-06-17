/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL*/

describe.only('RTC Manager', function () {
  'use strict';

  describe('createRTCManager', function () {
    it('should exist on ATT.factories', function () {
      expect(ATT.factories.createRTCManager).to.be.a('function');
    });

    it('should return an instance of RTCManager', function () {

      var factories = ATT.factories,
        resourceManagerStub,
        options;

      resourceManagerStub = {
        getLogger : function () {
          return {
            logDebug : function () {}
          };
        }
      };

      options = {
        userMediaSvc: {},
        rtcEvent: {},
        errorManager: {},
        peerConnSvc: {},
        resourceManager: resourceManagerStub
      };

      expect(factories.createRTCManager.bind(factories, options)).to.not.throw(Error);
      expect(factories.createRTCManager(options)).to.be.an('object');
    });
  });

  describe('Methods', function () {
    var rtcManager,
      options,
      resourceManager,
      rtcEvent,
      userMediaSvc,
      peerConnSvc,
      factories;

    beforeEach(function () {
      factories = ATT.factories;
      resourceManager = Env.resourceManager.getInstance();
      rtcEvent = ATT.RTCEvent.getInstance();
      userMediaSvc = ATT.UserMediaService;
      peerConnSvc = ATT.PeerConnectionService;

      options = {
        errorManager: ATT.Error,
        resourceManager: resourceManager,
        rtcEvent: rtcEvent,
        userMediaSvc: userMediaSvc,
        peerConnSvc: peerConnSvc,
        factories: factories
      };

      rtcManager = ATT.factories.createRTCManager(options);

    });

    describe('connectSession', function () {
      it('should exist', function () {
        expect(rtcManager.connectSession).to.be.a('function');
      });

      describe('Success', function () {
        var doOperationStub,
          onSuccessSpy,
          onReadySpy;

        beforeEach(function () {
          doOperationStub = sinon.stub(resourceManager, 'doOperation', function (name, options) {
            var response = {
              getResponseHeader : function (name) {
                switch (name) {
                case 'Location':
                  return '123/123/123/123/123';
                case 'x-expires':
                  return '1234';
                default:
                  break;
                }
              }
            };
            options.success(response);
          });
          onSuccessSpy = sinon.spy();
          onReadySpy = sinon.spy();

          options.onSuccess = onSuccessSpy;
          rtcManager.connectSession(options);
        });

        it('should call doOperation on the resourceManager with `createWebRTCSession`', function () {
          expect(doOperationStub.calledWith('createWebRTCSession')).to.equal(true);
          doOperationStub.restore();
        });

        it('should execute the onSuccess callback', function () {
          expect(onSuccessSpy.called).to.equal(true);
        });
        it('should call EventManager.setupEventChannel with the session id');
        it('should execute onReady on receiving a `listening` event');
      });

    });

    describe('disconnectSession', function () {
      it('should exist', function () {
        expect(rtcManager.disconnectSession).to.be.a('function');
      });
    });
  });

});