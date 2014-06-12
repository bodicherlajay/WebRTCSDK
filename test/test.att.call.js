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
  describe('On method', function () {
    var call;

    beforeEach(function () {
      call = new ATT.private.Call({
        peer: '12345',
        mediaType: 'video'
      });
    });

    it('Should exist', function () {
      expect(call.on).to.be.a('function');
    });

    it('Should fail if event is not recognized', function () {
      expect(call.on.bind(call, 'unknown')).to.throw(Error);
    });

    it('Should register callback for events', function () {
      expect(call.on.bind(call, 'connected')).to.not.throw(Error);
    });
  });

  describe('Connect method', function () {
    var call;

    function onConnected() { }

    beforeEach(function () {
      call = new ATT.private.Call({
        peer: '12345',
        mediaType: 'video'
      });

      call.on('connected', onConnected);
    });

    it('Should exist', function () {
      expect(call.connect).to.be.a('function');
    });

    it('Should execute the onConnected callback if connected successfully', function () {
      var onConnectedSpy = sinon.spy(onConnected);

      expect(onConnectedSpy.called).to.equal(true);
    });

    it('Should execute the onError callback if there is an error');
  });

  describe('Disconnect method', function () {
    it('Should exist');

    it('Should execute the onDisconnected callback if no error');

    it('Should execute the onError callback if there is an error');
  });

});
