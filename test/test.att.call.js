/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit*/

describe.only('Call', function () {

  'use strict';

  var options,
    emitterEM,
    emitterCall,
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
    onDisconnectedSpy,
    remoteSdp;

  before(function () {
    options = {
      peer: '12345',
      mediaType: 'audio'
    };

    emitterEM = ATT.private.factories.createEventEmitter();

    remoteSdp = 'JFGLSDFDJKS';

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

    emitterCall = ATT.private.factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
      return emitterCall;
    });

    call = new ATT.rtc.Call(options);

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

  after(function () {
    createEventEmitterStub.restore();
    createEventManagerStub.restore();
    getRTCManagerStub.restore();
  });

  it('Should have a public constructor under ATT.rtc', function () {
    expect(ATT.rtc.Call).to.be.a('function');
  });

  describe('Constructor', function () {

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
      expect(createEventEmitterStub.called).to.equal(true);
    });

    it('should get an instance of RTCManager', function() {
      expect(getRTCManagerStub.called).to.equal(true);
    })
  });

  describe('Methods', function () {

    describe('On', function () {

      it('Should exist', function () {
        expect(call.on).to.be.a('function');
      });

      it('Should fail if event is not recognized', function () {
        expect(call.on.bind(call, 'unknown')).to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy(),
          unsubscribeSpy = sinon.spy(emitterCall, 'unsubscribe'),
          subscribeSpy = sinon.spy(emitterCall, 'subscribe');

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
        onStub;

      before(function () {

        connectCallStub = sinon.stub(rtcMgr, 'connectCall', function (options) {
          options.onCallConnecting({
            callId: '1234'
          });
        });

        onStub = sinon.spy(rtcMgr, 'on');

        setIdSpy = sinon.spy(call, 'setId');

        call.connect({
          onCallConnecting: function () {}
        });
      });

      after(function () {
        connectCallStub.restore();
        setIdSpy.restore();
        onStub.restore();
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
        expect(onStub.calledWith('remote-sdp-set')).to.equal(true);
        expect(onStub.getCall(0).args[1]).to.be.a('function');
      });

      it('should execute RTCManager.connectCall', function () {
        expect(connectCallStub.called).to.equal(true);
      });

      describe('success on connectCall', function () {

        it('should execute Call.setId with the newly created call id', function () {
          expect(setIdSpy.called).to.equal(true);
        });

      });

      it('Should execute the onError callback if there is an error');
    });

    describe('Connect Events', function () {

      var setRemoteSdpSpy,
        onEstablishedHandlerSpy,
        connectCallStub;

      before(function () {
        setRemoteSdpSpy = sinon.spy(call, 'setRemoteSdp');
        onEstablishedHandlerSpy = sinon.spy();
        connectCallStub = sinon.stub(rtcMgr, 'connectCall', function () {});

        call.on('established', onEstablishedHandlerSpy);

        call.connect(options);
      });

      after(function () {
        setRemoteSdpSpy.restore();
        connectCallStub.restore();
      });

      it('should execute setRemoteSdp on getting a `remote-sdp-set` event from eventManager', function (done) {

        emitterEM.publish('remote-sdp-set', remoteSdp);

        setTimeout(function () {
          try {
            expect(setRemoteSdpSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should publish `established` event on getting a `media-established` event from RTC Manager', function (done) {
        emitterEM.publish('media-established');

        setTimeout(function () {
          try {
            expect(onEstablishedHandlerSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
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

    describe('setId', function () {

      it('Should exist', function () {
        expect(call.setId).to.be.a('function');
      });

      it('should set the newly created call id on the call', function () {
        var callId = '12345';

        call.setId(callId);

        expect(call.id).to.equal(callId);
      });

      it('Should publish the `connecting` event if call id is not null', function (done) {
        var callId = '12345';

        call.setId(callId);

        setTimeout(function () {
          try {
            expect(onConnectingSpy.called).to.equal(true);
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

    describe('setRemoteSdp', function () {

      it('should exist', function () {
        expect(call.setRemoteSdp).to.be.a('function');
      });

      it('Should publish the `connected` event on setting the remote SDP', function (done) {
        call.setRemoteSdp(remoteSdp);

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

  });

});
