/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global Env, ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit, URL*/

describe('RTC Manager', function () {
  'use strict';

  var factories,
    resourceManagerStub,
    createEventManagerStub,
    eventManagerStub,
    optionsForEM,
    sessionInfo,
    timeout;

  beforeEach(function () {
    factories = ATT.factories;
    timeout = 1234;// time in seconds
    sessionInfo = {
      sessionId : '123',
      timeout: timeout * 1000 // milliseconds
    };
    resourceManagerStub = {
      doOperation: function (name, options) {
        var response = {
          getResponseHeader : function (name) {
            switch (name) {
              case 'Location':
                return '123/123/123/123/' + sessionInfo.sessionId;
              case 'x-expires':
                return String(timeout); // seconds
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
    };
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

      it('should throw error if invalid options', function () {
        expect(rtcManager.connectSession.bind(rtcManager)).to.throw('No options defined.');
        expect(rtcManager.connectSession.bind(rtcManager, {})).to.throw('No token defined.');
        expect(rtcManager.connectSession.bind(rtcManager, {token: '123'})).to.throw('Callback onSessionConnected not defined.');
        expect(rtcManager.connectSession.bind(rtcManager, {
          token: '123',
          onSessionConnected: function () {}
        })).to.throw('Callback onSessionReady not defined.');
        expect(rtcManager.connectSession.bind(rtcManager, {
          token: '123',
          onSessionReady: function () {}
        })).to.throw('Callback onSessionConnected not defined.');
        expect(rtcManager.connectSession.bind(rtcManager, {
          token: '123',
          onSessionConnected: function () {},
          onSessionReady: function () {}
        })).to.not.throw(Error);
      });

      describe('Success', function () {
        var onSessionConnectedSpy,
          onSpy,
          doOperationSpy,
          onSessionReadySpy;

        beforeEach(function () {

          ATT.appConfig = {
            EventChannelConfig: {
              endpoint: 'endpoint',
              type: 'longpolling'
            }
          };

          onSessionConnectedSpy = sinon.spy();
          onSessionReadySpy = sinon.spy();

          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');
          onSpy = sinon.spy(eventManagerStub, 'on');

          var optionsForConn = {
            token: '123',
            onSessionConnected: onSessionConnectedSpy,
            onSessionReady: onSessionReadySpy
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

        it('should execute the onSessionConnected callback with `sessionId` and `timeout`', function () {
          var sessionId = onSessionConnectedSpy.getCall(0).args[0].sessionId,
            timeout = onSessionConnectedSpy.getCall(0).args[0].timeout;

          expect(onSessionConnectedSpy.called).to.equal(true);
          expect(sessionId).to.equal(sessionInfo.sessionId);
          expect(timeout).to.equal(sessionInfo.timeout);
        });

        it('Should subscribe to event listening from the event manager', function () {
          expect(onSpy.called).to.equal(true); //
          expect(onSpy.getCall(0).args[0]).to.equal('listening');
        });

        it('should call EventManager.setup with the session id', function () {
          expect(setupStub.called).to.equal(true);
        });

        it('should execute onSessionReady with data containing `sessionId` on receiving a `listening` event', function (done) {
          var sessionId;

          setTimeout(function () {
            try {
              expect(onSessionReadySpy.called).to.equal(true);
              sessionId = onSessionReadySpy.getCall(0).args[0].sessionId;
              expect(sessionId).to.equal(sessionInfo.sessionId);
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