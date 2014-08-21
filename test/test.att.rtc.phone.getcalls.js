/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/

describe('getCalls', function () {

  var emitterCall,
    firstCall,
    secondCall,
    onSpy,
    offSpy,
    addCallOpts,
    callHoldStub,
    createEventEmitterStub,
    factories,
    Call,
    Session,
    session,
    ums,
    getUserMediaStub,
    emitterPhone,
    phone,
    Phone,
    publishStub,
    sessionStub,
    eventData,
    dialOpts;

  before(function () {
    factories = ATT.private.factories;
    Call = ATT.rtc.Call;
    Session = ATT.rtc.Session;
    ums = ATT.UserMediaService;
    Phone = ATT.private.Phone;

    eventData = {
      abc: 'abc'
    };

    dialOpts = {
      destination: '1231234538',
      mediaType: 'video',
      localMedia: {},
      remoteMedia: {}
    };
  });

  beforeEach(function () {

    emitterPhone = factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitterPhone;
    });

    session = new Session();
    session.setId('ABC');
    sessionStub = sinon.stub(ATT.rtc, 'Session', function () {
      return session;
    });

    phone = new Phone();
    sessionStub.restore();
    createEventEmitterStub.restore();

    emitterCall = factories.createEventEmitter();
    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitterCall;
    });

    firstCall = new Call({
      id: 'firstCall',
      breed: 'call',
      peer: '1234567',
      type: 'abc',
      mediaType: 'video'
    });
    createEventEmitterStub.restore();

    emitterCall = factories.createEventEmitter();
    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitterCall;
    });
    secondCall = new Call({
      id: 'secondCall',
      breed: 'call',
      peer: '1234567',
      type: 'abc',
      mediaType: 'video'
    });
    createEventEmitterStub.restore();

    callHoldStub = sinon.stub(firstCall, 'hold');

    onSpy = sinon.spy(firstCall, 'on');
    offSpy = sinon.spy(firstCall, 'off');

    addCallOpts = {
      localMedia: 'localMedia',
      remoteMedia: 'remoteMedia',
      destination: '1234567890',
      mediaType: 'video'
    };

    session.currentCall = firstCall;

    getUserMediaStub = sinon.stub(ums, 'getUserMedia');

    publishStub = sinon.stub(emitterPhone, 'publish');
  });

  afterEach(function () {
    callHoldStub.restore();
    onSpy.restore();
    offSpy.restore();
    getUserMediaStub.restore();
    publishStub.restore();
  });

  it('should exist', function () {
    expect(phone.getCalls).to.be.a('function');
  });

  it('should return a list of all the existing calls', function () {
    var callsInSession,
      calls;

    expect(phone.getCalls()).to.be.an('Array');

    callsInSession = session.getCalls();

    callsInSession[firstCall.id()] = firstCall;
    callsInSession[secondCall.id()] = secondCall;

    calls = phone.getCalls();
    expect(Object.keys(callsInSession).length).to.equal(calls.length);
    expect([
      {
        peer: firstCall.peer(),
        state: firstCall.getState()
      },
      {
        peer: secondCall.peer(),
        state: secondCall.getState()
      }
    ]).to.eql(calls);
  });
});