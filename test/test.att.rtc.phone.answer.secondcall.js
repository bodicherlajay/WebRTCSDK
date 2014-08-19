/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/


describe('[US293718] Answer SecondCall', function () {
  'use strict';

  var phone,
    session,
    firstCall,
    incomingCall,
    emitterPhone,
    createEventEmitterStub,
    factories,
    ums,
    Phone,
    Call,
    firstCallOpts,
    incomingCallOpts,
    answerHoldOpts,
    answerEndOpts,
    callOnSpy,
    callHoldStub,
    callDisconnectStub,
    getUserMediaStub,
    publishStub;

  before(function () {
    factories = ATT.private.factories;
    ums = ATT.UserMediaService;
    Phone = ATT.private.Phone;
    Call = ATT.rtc.Call;

    firstCallOpts = {
      id: 'firstCallId',
      breed: 'call',
      type: ATT.CallTypes.OUTGOING,
      peer: '1111',
      mediaType: 'audio',
      sessionInfo: {
        sessionId: 'sessionId',
        token: 'token'
      }
    };

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

    answerHoldOpts = {
      localMedia: 'localMedia',
      remoteMedia: 'remoteMedia',
      action : 'hold'
    };

    answerEndOpts = {
      localMedia: 'localMedia',
      remoteMedia: 'remoteMedia',
      action : 'end'
    };
  });

  beforeEach(function () {

    ATT.private.pcv = 2;
    getUserMediaStub = sinon.stub(ums, 'getUserMedia');

    emitterPhone = factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitterPhone;
    });

    phone = new Phone();

    createEventEmitterStub.restore();

    publishStub = sinon.stub(emitterPhone, 'publish');

    session = phone.getSession();

    session.setId('sessionId');

    firstCall = new Call(firstCallOpts);
    incomingCall = new Call(incomingCallOpts);

    session.currentCall = firstCall;
    session.pendingCall = incomingCall;

    callOnSpy = sinon.spy(firstCall, 'on');
    callHoldStub = sinon.stub(firstCall, 'hold');
    callDisconnectStub = sinon.stub(firstCall, 'disconnect');
  });

  afterEach(function () {
    getUserMediaStub.restore();
    callOnSpy.restore();
    callHoldStub.restore();
    callDisconnectStub.restore();
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

  it('should register for `held` event on firstCall if action == `hold`', function () {
    phone.answer(answerHoldOpts);

    expect(callOnSpy.calledWith('held')).to.equal(true);
  });

  it('should register for `disconnected` event on firstCall if action == `end`', function () {
    phone.answer(answerEndOpts);

    expect(callOnSpy.calledWith('disconnected')).to.equal(true);
  });

  it('should NOT register for `held` or `disconnected` events if there is no current call', function () {
    session.currentCall = null;
    phone.answer(answerHoldOpts);

    expect(callOnSpy.called).to.equal(false);
  });

  it('should execute Call.hold on the current Call if the action == `held`', function () {
    phone.answer(answerHoldOpts);

    expect(callHoldStub.called).to.equal(true);
    expect(callHoldStub.calledAfter(callOnSpy)).to.equal(true);
  });

  it('should execute Call.disconnect on the current Call if the action == `end`', function () {
    phone.answer(answerEndOpts);

    expect(callDisconnectStub.called).to.equal(true);
    expect(callDisconnectStub.calledAfter(callOnSpy)).to.equal(true);
  });

  it('should NOT execute ums.getUserMedia if there is a currentCall', function () {
    phone.answer(answerEndOpts);
    expect(getUserMediaStub.called).to.equal(false);
  });

  describe('Events on first call', function () {

    describe('held', function () {

      beforeEach(function () {
        phone.answer(answerHoldOpts);
      });

      it('should execute ums.getUserMedia', function (done) {
        setTimeout(function () {
          firstCall.setState('held');

          setTimeout(function () {
            try {
              expect(getUserMediaStub.called).to.equal(true);
              expect(getUserMediaStub.calledAfter(callHoldStub)).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 50);

        }, 10);

      });

      describe('disconnected', function () {

        beforeEach(function () {
          phone.answer(answerEndOpts);
        });

        it('should execute ums.getUserMedia', function (done) {
          setTimeout(function () {
            firstCall.setState('disconnected');

            setTimeout(function () {
              try {
                expect(getUserMediaStub.called).to.equal(true);
                expect(getUserMediaStub.calledAfter(callDisconnectStub)).to.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            }, 50);

          }, 10);

        });

      });
    });
  });

});
