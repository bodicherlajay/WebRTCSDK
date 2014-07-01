/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit*/

describe('Call', function () {

  'use strict';

  var options;

  beforeEach(function () {
    options = {
      peer: '12345',
      mediaType: 'audio'
    };
  });

  it('Should have a public constructor under ATT.rtc', function () {
    expect(ATT.rtc.Call).to.be.a('function');
  });

  describe('Constructor', function () {
    var createEventEmitterSpy,
      getRTCManagerSpy,
      call;

    beforeEach(function () {
      createEventEmitterSpy = sinon.spy(ATT.private.factories, 'createEventEmitter');
      getRTCManagerSpy = sinon.spy(ATT.private.rtcManager, 'getRTCManager');

      call = new ATT.rtc.Call(options);
    });

    afterEach(function () {
      createEventEmitterSpy.restore();
      getRTCManagerSpy.restore();
    });

    it('Should throw an error if invalid options', function () {
      var func = function (options) {
        return new ATT.rtc.Call(options);
      };
      expect(func).to.throw('No input provided');
      expect(func.bind(null, {})).to.throw('No peer provided');
    });

    it('Should create a call object with the options passed in', function () {
      expect(call).to.be.an('object');
      expect(call.id).to.equal(options.id);
      expect(call.peer).to.equal(options.peer);
      expect(call.mediaType).to.equal(options.mediaType);
    });

    it('should create an instance of event emitter', function () {
      expect(createEventEmitterSpy.called).to.equal(true);
    });

    it('should get an instance of RTCManager', function() {
      expect(getRTCManagerSpy.called).to.equal(true);
    })
  });

  describe('Methods', function () {
    var emitterEM,
      eventManager,
      rtcMgr,
      getRTCManagerStub,
      createEventEmitterStub,
      createEventManagerStub,
      call,
      onDialingSpy,
      onConnectingSpy,
      onConnectedSpy,
      onDisconnectingSpy,
      onDisconnectedSpy;

    beforeEach(function () {
      emitterEM = ATT.private.factories.createEventEmitter();

      createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
        return emitterEM;
      });

      eventManager = ATT.private.factories.createEventManager({
        resourceManager: {
          getLogger: function () {
            return {
              logDebug: function () {}
            }
          }
        }
      });

      createEventManagerStub = sinon.stub(ATT.private.factories, 'createEventManager', function () {
        return eventManager;
      });

      rtcMgr = ATT.private.rtcManager.getRTCManager();

      getRTCManagerStub = sinon.stub(ATT.private.rtcManager, 'getRTCManager', function () {
        return rtcMgr;
      });

      createEventEmitterStub.restore();

      call = new ATT.rtc.Call({
        peer: '12345',
        mediaType: 'video'
      });

      onDialingSpy = sinon.spy();
      onConnectingSpy = sinon.spy();
      onConnectedSpy = sinon.spy();
      onDisconnectingSpy = sinon.spy();
      onDisconnectedSpy = sinon.spy();

      call.on('dialing', onDialingSpy);
      call.on('connecting', onConnectingSpy);
      call.on('connected', onConnectedSpy);
      call.on('disconnecting', onDisconnectingSpy);
      call.on('disconnected', onDisconnectedSpy);
    });

    afterEach(function () {
      createEventManagerStub.restore();
      getRTCManagerStub.restore();
    });

    describe('On', function () {

      it('Should exist', function () {
        expect(call.on).to.be.a('function');
      });

      it('Should fail if event is not recognized', function () {
        expect(call.on.bind(call, 'unknown')).to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy(),
          unsubscribeSpy = sinon.spy(emitter, 'unsubscribe'),
          subscribeSpy = sinon.spy(emitter, 'subscribe');

        expect(call.on.bind(call, 'dialing', fn)).to.not.throw(Error);

        expect(unsubscribeSpy.called).to.equal(true);
        expect(subscribeSpy.called).to.equal(true);

        unsubscribeSpy.restore();
        subscribeSpy.restore();

      });
    });

    describe('Connect', function () {

      var connectCallStub,
        setIdSpy,
        onSpy,
        setRemoteSdpSpy,
        remoteSdp;

      beforeEach(function () {
        remoteSdp = 'JFGLSDFDJKS';

        connectCallStub = sinon.stub(rtcMgr, 'connectCall', function (options) {
          options.onCallConnecting({
            callId: '1234'
          });
          emitterEM.publish('remote-sdp-set', remoteSdp);
        });

        // TODO: Cleanup later. eventManager seems to be a different instance
        onSpy = sinon.stub(rtcMgr, 'on', function (event, handler) {
          eventManager.on(event, handler);
        });

        setIdSpy = sinon.spy(call, 'setId');
        setRemoteSdpSpy = sinon.spy(call, 'setRemoteSdp');

        call.connect({
          onCallConnecting: function () {}
        });
      });

      afterEach(function () {
        connectCallStub.restore();
        setIdSpy.restore();
        onSpy.restore();
        setRemoteSdpSpy.restore();
      });

      it('Should exist', function () {
        expect(call.connect).to.be.a('function');
      });

      it('Should trigger `dialing` event immediately', function (done) {
        setTimeout(function () {
          try {
            expect(onDialingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should register for event `remote-sdp-set` from RTCManager', function () {
        expect(onSpy.calledWith('remote-sdp-set')).to.equal(true);
        expect(onSpy.getCall(0).args[1]).to.be.a('function');
      });

      it('should execute RTCManager.connectCall', function () {
        expect(connectCallStub.called).to.equal(true);
      });

      describe('success on connectCall', function () {

        it('should execute Call.setId with the newly created call id', function () {
          expect(setIdSpy.called).to.equal(true);
        });

      });

      describe('success events', function () {

        it('should execute setRemoteSdp on getting a `remote-sdp-set` event from RTCManager', function (done) {
          setTimeout(function () {
            try {
              expect(setRemoteSdpSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });

        it('Should publish the `connected` event on setting the remote SDP', function (done) {
          setTimeout(function () {
            try {
              expect(call.remoteSdp).to.equal(remoteSdp);
              expect(onConnectedSpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);
        });
      });

      it('Should execute the onError callback if there is an error');
    });

    describe('Disconnect', function () {

      it('Should exist', function () {
        expect(call.disconnect).to.be.a('function');
      });

      it('Should trigger `disconnecting` event immediately', function (done) {
        call.disconnect();

        setTimeout(function () {
          try {
            expect(onDisconnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });

    describe('SetId', function () {

      it('Should exist', function () {
        expect(call.setId).to.be.a('function');
      });

      it('should set the newly created call id on the call');

      it('Should publish the `connecting` event if call id is not null', function (done) {
        var callId = '12345';

        call.setId(callId);

        setTimeout(function () {
          try {
            expect(onConnectingSpy.called).to.equal(true);
            expect(call.id).to.equal(callId);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('Should publish the `disconnected` event if call id is null', function (done) {
        call.setId(null);

        setTimeout(function () {
          try {
            expect(onDisconnectedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });

  });

});
