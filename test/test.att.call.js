/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit*/

describe('Call', function () {

  'use strict';

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
      var options = {
          id: '12334',
          peer: '12345',
          mediaType: 'audio',

        },
        call;

      call = new ATT.rtc.Call(options);

      expect(call).to.be.an('object');
      expect(call.id).to.equal(options.id);
      expect(call.peer).to.equal(options.peer);
      expect(call.mediaType).to.equal(options.mediaType);
    });
  });

  describe('method', function () {
    var call,
      onDialingSpy,
      onConnectingSpy,
      onEstablishedSpy,
      onDisconnectingSpy,
      onDisconnectedSpy;

    beforeEach(function () {
      call = new ATT.rtc.Call({
        peer: '12345',
        mediaType: 'video'
      });

      onDialingSpy = sinon.spy();
      onConnectingSpy = sinon.spy();
      onEstablishedSpy = sinon.spy();
      onDisconnectingSpy = sinon.spy();
      onDisconnectedSpy = sinon.spy();

      call.on('dialing', onDialingSpy);
      call.on('connecting', onConnectingSpy);
      call.on('established', onEstablishedSpy);
      call.on('disconnecting', onDisconnectingSpy);
      call.on('disconnected', onDisconnectedSpy);

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
          subscribeSpy = sinon.spy(ATT.event, 'subscribe');

        expect(call.on.bind(call, 'dialing', fn)).to.not.throw(Error);

        expect(subscribeSpy.called).to.equal(true);

        subscribeSpy.restore();

      });
    });

    describe('Connect', function () {

      it('Should exist', function () {
        expect(call.connect).to.be.a('function');
      });

      it('Should trigger `dialing` event immediately', function (done) {
        call.connect();

        setTimeout(function () {
          try {
            expect(onDialingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);

      });

      it('should execute RTCManager.connectCall', function () {
        var connectCallSpy = sinon.spy();
        expect(connectCallSpy.called).to.equal(true);
      });

      describe('success on connectCall', function () {

        it('should execute Call.setId with the newly created call id');

      });

      it('Should publish the `established` event on setting the remote SDP', function (done) {
        var remoteSdp = 'JFGLSDFDJKS';

        call.setRemoteSdp(remoteSdp);

        setTimeout(function () {
          try {
            expect(call.remoteSdp).to.equal(remoteSdp);
            expect(onEstablishedSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('Should execute the onError callback if there is an error');
    });

    describe('Disconnect', function () {

      it('Should exist', function () {
        expect(call.disconnect).to.be.a('function');
      });

      it('Should execute the onDisconnecting callback if no error', function (done) {
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
