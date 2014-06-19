/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL*/

describe('RTC Manager', function () {
  'use strict';

  var factories,
    resourceManagerStub,
    createEventManagerStub,
    eventManagerStub,
    optionsForEM;

  beforeEach(function () {
    factories = ATT.factories;
    resourceManagerStub = {
      doOperation: function (name, options) {
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
      },
      getLogger : function () {
        return {
          logDebug : function () {},
          logInfo: function () {}
        };
      }
    };
    optionsForEM = {
      errorManager: {},
      resourceManager: resourceManagerStub
    }
    eventManagerStub = ATT.factories.createEventManager(optionsForEM);
    createEventManagerStub = sinon.stub(ATT.factories, 'createEventManager', function () {
      return eventManagerStub;
    });

  });

  afterEach(function () {
    createEventManagerStub.restore();
  });

  describe('createRTCManager', function () {
    var options;

    beforeEach(function () {
      options = {
        userMediaSvc: {},
        rtcEvent: {},
        errorManager: {},
        peerConnSvc: {},
        resourceManager: resourceManagerStub
      };

    });

    it('should exist on ATT.factories', function () {
      expect(factories.createRTCManager).to.be.a('function');
    });

    it('should return an object', function () {
      expect(factories.createRTCManager(options)).to.be.an('object');
    });

    it('should not throw an error', function () {
      expect(factories.createRTCManager.bind(factories, options)).to.not.throw(Error);
    });

    it('should call ATT.factories.createEventManager', function () {
      factories.createRTCManager(options);
      expect(createEventManagerStub.called).to.equal(true);

    });
  });

  describe('Methods', function () {
    var rtcManager,
      resourceManager,
      rtcEvent,
      userMediaSvc,
      peerConnSvc,
      setupStub;


    beforeEach(function () {
      var optionsForRTCM;

      setupStub = sinon.stub(eventManagerStub, 'setup', function () {
        ATT.event.publish('listening');
      });

      rtcEvent = ATT.RTCEvent.getInstance();
      userMediaSvc = ATT.UserMediaService;
      peerConnSvc = ATT.PeerConnectionService;

      optionsForRTCM = {
        errorManager: ATT.Error,
        resourceManager: resourceManagerStub,
        rtcEvent: rtcEvent,
        userMediaSvc: userMediaSvc,
        peerConnSvc: peerConnSvc
      };

      rtcManager = factories.createRTCManager(optionsForRTCM);

    });

    afterEach(function () {
      setupStub.restore();
    });

    describe('connectSession', function () {
      it('should exist', function () {
        expect(rtcManager.connectSession).to.be.a('function');
      });

      describe('Success', function () {
        var onSuccessSpy,
          onSpy,
          doOperationSpy,
          onReadySpy;

        beforeEach(function () {

          ATT.appConfig = {
            EventChannelConfig: {
              endpoint: 'endpoint',
              type: 'longpolling'
            }
          };

          onSuccessSpy = sinon.spy();
          onReadySpy = sinon.spy();

          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');
          onSpy = sinon.spy(eventManagerStub, 'on');

          var optionsForConn = {
            token: '123',
            onSuccess: onSuccessSpy,
            onReady: onReadySpy
          };
          rtcManager.connectSession(optionsForConn);
        });

        afterEach(function () {
          onSpy.restore();
          doOperationSpy.restore();
        });

        it('should call doOperation on the resourceManager with `createWebRTCSession`', function () {
          expect(doOperationSpy.called).to.equal(true);
          expect(doOperationSpy.getCall(0).args[0]).to.equal('createWebRTCSession');
        });

        it('should execute the onSuccess callback', function () {
          expect(onSuccessSpy.called).to.equal(true);
        });

        it('Should subscribe to event listening from the event manager', function () {
          expect(onSpy.called).to.equal(true); //
          expect(onSpy.getCall(0).args[0]).to.equal('listening');
        });

        it('should call EventManager.setup with the session id', function () {
          expect(setupStub.called).to.equal(true);
        });

        it('should execute onReady on receiving a `listening` event', function (done) {

          setTimeout(function () {
            try {
              expect(onReadySpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

      });

    });

    describe('disconnectSession', function () {
      it('should exist', function () {
        expect(rtcManager.disconnectSession).to.be.a('function');
      });
    });
  });

});