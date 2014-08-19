/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/


describe('[US293718] Answer SecondCall', function () {
  'use strict';

  var phone,
    session,
    incomingCall,
    emitterPhone,
    createEventEmitterStub,
    factories,
    Phone,
    Call,
    incomingCallOpts,
    publishStub;

  before(function () {
    factories = ATT.private.factories;
    Phone = ATT.private.Phone;
    Call = ATT.rtc.Call;

    incomingCallOpts = {
      breed: 'call',
      id: 'callId',
      type: ATT.CallTypes.INCOMING,
      peer: '12345',
      mediaType: 'video',
      sessionInfo: {
        sessionId: 'sessionId',
        token: 'token'
      }
    };
  });

  beforeEach(function () {
    emitterPhone = factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitterPhone;
    });

    phone = new Phone();

    publishStub = sinon.stub(emitterPhone, 'publish');

    session = phone.getSession();

    session.setId('sessionId');

    incomingCall = new Call(incomingCallOpts);

    session.pendingCall = incomingCall;
  });

  afterEach(function () {
    createEventEmitterStub.restore();
    publishStub.restore();
  });

  it('[5005] should be published with error event if the action is not `hold` or `end', function () {

    phone.answer({
      localMedia: 'localMedia',
      remoteMedia: 'remoteMedia',
      action : 'no'
    });

    expect(ATT.errorDictionary.getSDKError('5005')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('5005')
    })).to.equal(true);
  });

});
