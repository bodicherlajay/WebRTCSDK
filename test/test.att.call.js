/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global describe, it, afterEach, beforeEach, before, sinon, expect, assert, xit*/

describe.only('Call', function () {
  
  it('Should have a public constructor under ATT.private', function () {
    expect(ATT.private.Call).to.be.a('function');
  });

  it('Should fail if no input options specified a call object', function () {
    var fn = function (options) {
      new ATT.private.Call(options);
    };
    expect(fn).to.throw('No input provided');
    expect(fn.bind(null, {})).to.throw('No peer provided');
    expect(fn.bind(null, { peer: '12345' })).to.throw('No mediaType provided');
  });

  it('Should create a call object', function () {
    var call = new ATT.private.Call({
      peer: '12345',
      mediaType: 'audio'
    });
    expect(call).to.be.an('object');
  });

  describe('method', function () {
    var call;

    beforeEach(function () {
      call = new ATT.private.Call({
        peer: '12345',
        mediaType: 'video'
      });
    });

    describe('On', function () {

      it('Should exist', function () {
        expect(call.on).to.be.a('function');
      });

      it('Should fail if event is not recognized', function () {
        expect(call.on.bind(call, 'unknown')).to.throw(Error);
      });

      it('Should register callback for known events', function () {
        var fn = sinon.spy();
        expect(call.on.bind(call, 'connecting', fn)).to.not.throw(Error);
      });
    });

    describe('Connect', function () {
      var onConnectingSpy,
        onCallingSpy,
        onEstablishedSpy;

      beforeEach(function () {

        onConnectingSpy = sinon.spy();
        onCallingSpy = sinon.spy();
        onEstablishedSpy = sinon.spy();
        onErrorSpy = sinon.spy();

        call.on('connecting', onConnectingSpy);
        call.on('calling', onCallingSpy);
        call.on('established', onEstablishedSpy);
      });

      it('Should exist', function () {
        expect(call.connect).to.be.a('function');
      });

      it('Should execute the onConnecting callback immediately', function (done) {
        call.connect();

        setTimeout(function () {
          try {
            expect(onConnectingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);

      });

      it('Should execute the onCalling callback on setting the call id on the call', function (done) {
        var callId = '12345';

        call.setCallId(callId);

        setTimeout(function () {
          try {
            expect(call.id).to.equal(callId);
            expect(onCallingSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('Should execute the onEstablished callback on setting the remote SDP', function () {
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
      var onDisconnectedSpy;

      it('Should exist', function () {
        expect(call.disconnect).to.be.a('function');
      });

      it('Should execute the onDisconnected callback if no error', function () {
        call.disconnect();

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
