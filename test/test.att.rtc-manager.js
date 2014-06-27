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
    factories = ATT.private.factories;
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
    eventManagerStub = ATT.private.factories.createEventManager(optionsForEM);
    createEventManagerStub = sinon.stub(ATT.private.factories, 'createEventManager', function () {
      return eventManagerStub;
    });
  });

  afterEach(function () {
    createEventManagerStub.restore();
  });

  describe('Singleton', function () {

    it('should export ATT.private.rtcManager', function () {
      expect(ATT.private.rtcManager).to.be.a('object');
    });

    it('should have a method getRTCManager', function () {
      expect(ATT.private.rtcManager.getRTCManager).to.be.a('function');
    });

    it('should return an instance of RTCManager', function () {
      var rtcMgr = ATT.private.rtcManager.getRTCManager();
      expect(rtcMgr instanceof ATT.private.RTCManager).to.equal(true);
    });

    it('should always return the same instance', function () {
      var rtcMgr1 = ATT.private.rtcManager.getRTCManager(),
        rtcMgr2 = ATT.private.rtcManager.getRTCManager();
      expect(rtcMgr1 === rtcMgr2).to.equal(true);
    });
  });

  describe('Pseudo Class', function () {
    var optionsForRTCM,
      rtcEvent,
      userMediaSvc,
      peerConnSvc;

    beforeEach(function () {

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


    });

    it('should export ATT.private.RTCManager', function () {
      expect(ATT.private.RTCManager).to.be.a('function');
    });

    describe('ATT.private.RTCManager Constructor', function () {
      var rtcMgr;

      it('should return an instance of RTCManager', function () {
        rtcMgr = new ATT.private.RTCManager(optionsForRTCM);
        expect(rtcMgr instanceof ATT.private.RTCManager).to.equal(true);
      });

      it('should create an event manager object', function () {
        rtcMgr = new ATT.private.RTCManager(optionsForRTCM);

        expect(createEventManagerStub.called).to.equal(true);
      });
    });

    describe('Methods', function () {
      var rtcManager,
        setupStub,
        stopStub;

      beforeEach(function () {

        setupStub = sinon.stub(eventManagerStub, 'setup', function () {
          ATT.event.publish('listening');
        });

        stopStub = sinon.stub(eventManagerStub, 'stop', function () {
          ATT.event.publish('stop-listening');
        });

        rtcManager = new ATT.private.RTCManager(optionsForRTCM);

      });

      afterEach(function () {
        setupStub.restore();
        stopStub.restore();
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
            onSessionConnected: function () {
            }
          })).to.throw('Callback onSessionReady not defined.');
          expect(rtcManager.connectSession.bind(rtcManager, {
            token: '123',
            onSessionReady: function () {
            }
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
            onSessionReadySpy,
            optionsForConn;

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

            optionsForConn = {
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

        var doOperationSpy,
          optionsForDisconn,
          onSessionDisconnectedSpy;

        beforeEach(function () {
          doOperationSpy = sinon.spy(resourceManagerStub, 'doOperation');
          onSessionDisconnectedSpy = sinon.spy();

          optionsForDisconn = {
            sessionId: 'sessionid',
            token: '123',
            onSessionDisconnected: onSessionDisconnectedSpy
          };

        });

        afterEach(function () {
          doOperationSpy.restore();
        });

        it('should exist', function () {
          expect(rtcManager.disconnectSession).to.be.a('function');
        });

        it('should throw an error if invalid options', function () {
          expect(rtcManager.disconnectSession.bind(rtcManager)).to.throw('No options defined.');
          expect(rtcManager.disconnectSession.bind(rtcManager, {})).to.throw('No session id defined.');
          expect(rtcManager.disconnectSession.bind(rtcManager, {
            sessionId: 'sessionid'
          })).to.throw('No token defined.');
          expect(rtcManager.disconnectSession.bind(rtcManager, {
            sessionId: 'sessionid',
            token: '123'
          })).to.throw('Callback onSessionDisconnected not defined.');
          expect(rtcManager.disconnectSession.bind(rtcManager, {
            sessionId: 'sessionid',
            token: '123',
            onSessionDisconnected: function () {
            }
          })).to.not.throw(Error);
        });

        it('should execute EventManager.stop', function () {
          rtcManager.disconnectSession(optionsForDisconn);

          expect(stopStub.calledBefore(doOperationSpy)).to.equal(true);
        });

        it('should call doOperation on the resourceManager with `deleteWebRTCSession`', function () {
          rtcManager.disconnectSession(optionsForDisconn);

          expect(doOperationSpy.called).to.equal(true);
          expect(doOperationSpy.getCall(0).args[0]).to.equal('deleteWebRTCSession');
        });

        describe('Success', function () {

          it('should execute the onSessionDisconnected callback', function () {
            rtcManager.disconnectSession(optionsForDisconn);

            expect(onSessionDisconnectedSpy.called).to.equal(true);
          });

        });
      });
    });
  });

});