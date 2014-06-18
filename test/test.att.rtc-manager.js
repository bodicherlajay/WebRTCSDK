/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL*/

describe('RTC Manager', function () {
  'use strict';

  var factories = ATT.factories,
    resourceManagerStub;

  resourceManagerStub = {
    getLogger : function () {
      return {
        logDebug : function () {},
        logInfo: function () {}
      };
    }
  };

  describe('createRTCManager', function () {
    it('should exist on ATT.factories', function () {
      expect(ATT.factories.createRTCManager).to.be.a('function');
    });

    it('should return an instance of RTCManager', function () {

     var options = {
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
      eventManager,
      resourceManager,
      rtcEvent,
      userMediaSvc,
      peerConnSvc,
      factories,
      setupStub;


    beforeEach(function () {
      var optionsForEM = {
          rtcEvent: {},
          errorManager: {},
          resourceManager: resourceManagerStub
        },
        optionsForRTCM;

      eventManager = ATT.factories.createEventManager(optionsForEM);
      setupStub = sinon.stub(eventManager, 'setup', function () {
        ATT.event.publish('listening');
      });

      factories = ATT.factories;
      resourceManager = Env.resourceManager.getInstance();
      rtcEvent = ATT.RTCEvent.getInstance();
      userMediaSvc = ATT.UserMediaService;
      peerConnSvc = ATT.PeerConnectionService;

      optionsForRTCM = {
        errorManager: ATT.Error,
        resourceManager: resourceManager,
        rtcEvent: rtcEvent,
        userMediaSvc: userMediaSvc,
        peerConnSvc: peerConnSvc,
        eventManager: eventManager,
        factories: factories
      };

      rtcManager = ATT.factories.createRTCManager(optionsForRTCM);

    });

    describe('connectSession', function () {
      it('should exist', function () {
        expect(rtcManager.connectSession).to.be.a('function');
      });

      describe('Success', function () {
        var doOperationStub,
          onSuccessSpy,
          onSpy,
          onReadySpy;

        beforeEach(function () {

          ATT.appConfig = {
            EventChannelConfig: {
              endpoint: 'endpoint',
              type: 'longpolling'
            }
          };

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

          onSpy = sinon.spy(eventManager, 'on');

          var optionsForConn = {
            token: '123',
            onSuccess: onSuccessSpy,
            onReady: onReadySpy
          };
          rtcManager.connectSession(optionsForConn);
        });

        it('should call doOperation on the resourceManager with `createWebRTCSession`', function () {
          expect(doOperationStub.calledWith('createWebRTCSession')).to.equal(true);
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

        it('should execute onReady on receiving a `listening` event', function () {

          setTimeout(function () {
            try {
              expect(onReadySpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

        afterEach(function() {
          doOperationStub.restore();
          onSpy.restore();
          setupStub.restore();
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