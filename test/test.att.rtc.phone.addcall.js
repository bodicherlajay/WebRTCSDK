/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/


describe('[US221924] addCall', function () {

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
    expect(phone.addCall).to.be.a('function');
  });

  it('[27001] should be published with error event if no options provided', function () {
    phone.addCall();

    expect(ATT.errorDictionary.getSDKError('27001')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27001')
    })).to.equal(true);
  });

  it('[27002] should be published with error event if no local media provided', function () {
    phone.addCall({});

    expect(ATT.errorDictionary.getSDKError('27002')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27002')
    })).to.equal(true);
  });

  it('[27003] should be published with error event if no remote media provided', function () {
    phone.addCall({
      localMedia: 'localMedia'
    });

    expect(ATT.errorDictionary.getSDKError('27003')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27003')
    })).to.equal(true);
  });

  it('[27004] should be published with error event if no destination provided', function () {
    phone.addCall({
      localMedia: 'localMedia',
      remoteMedia: 'remoteMedia'
    });

    expect(ATT.errorDictionary.getSDKError('27004')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27004')
    })).to.equal(true);
  });

  it('[27005] should be published with error event if invalid phone number provided', function () {
    phone.addCall({
      localMedia: 'localMedia',
      remoteMedia: 'remoteMedia',
      destination: '12345'
    });

    expect(ATT.errorDictionary.getSDKError('27005')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27005')
    })).to.equal(true);
  });

  it('[27006] should be published with error event if invalid SIP URI provided', function () {
    phone.addCall({
      localMedia: 'localMedia',
      remoteMedia: 'remoteMedia',
      destination: 'abcd@@@'
    });

    expect(ATT.errorDictionary.getSDKError('27006')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27006')
    })).to.equal(true);
  });

  it('[27007] should be published with error event if invalid media constraints provided', function () {
    phone.addCall({
      localMedia: 'localMedia',
      remoteMedia: 'remoteMedia',
      destination: '1234567890',
      mediaType: 'invalid'
    });

    expect(ATT.errorDictionary.getSDKError('27007')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27007')
    })).to.equal(true);
  });

  it('[27008] should be published with error event if user is not logged in', function () {

    session.setId(null);

    phone.addCall(addCallOpts);

    expect(ATT.errorDictionary.getSDKError('27008')).to.be.an('object');
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27008')
    })).to.equal(true);
  });

  it('[27009] should be published with error event if no existing call', function () {

    session.currentCall = null;

    phone.addCall(addCallOpts);

    console.log(session.getId());

    expect(ATT.errorDictionary.getSDKError('27009')).to.be.an('object');
    console.log('args0: ', publishStub.getCall(0).args[1]);
    expect(publishStub.calledWith('error', {
      error: ATT.errorDictionary.getSDKError('27009')
    })).to.equal(true);
  });

  it('[27000] should be published with error event if there is an unexpected exception', function () {

    callHoldStub.restore();

    callHoldStub = sinon.stub(firstCall, 'hold', function () {
      throw error;
    });

    phone.addCall(addCallOpts);

    expect(ATT.errorDictionary.getSDKError('27000')).to.be.an('object');
    expect(publishStub.calledWithMatch('error', {
      error: ATT.errorDictionary.getSDKError('27000')
    })).to.equal(true);
  });

  it('should register handler to dial the second call when getting the `held` event', function () {

    phone.addCall(addCallOpts);

    expect(onSpy.calledWith('held')).to.equal(true);
  });

  it('should execute Call.hold on the current call', function () {

    phone.addCall(addCallOpts);

    expect(callHoldStub.called).to.equal(true);
  });

  describe('Events for AddCall', function () {

    describe('held', function () {

      beforeEach(function () {


        firstCall.setId('123');

        console.log('session:' + session.currentCall.id());

        phone.addCall(addCallOpts);

        // assume call.hold is successful
        firstCall.setState('held');
      });

      it('should de-register handler to dial a second call', function (done) {

        emitterCall.publish('held', eventData);

        setTimeout(function () {
          try {
            expect(offSpy.calledWith('held')).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);

      });

      it('should put the held call on the stack', function (done) {
        var calls,
          keys,
          callOnHold;

        setTimeout(function () {
          try {

            calls = session.getCalls();
            console.log('calls' + JSON.stringify(calls));
            keys = Object.keys(calls);
            callOnHold = calls[keys[0]];

            expect(keys.length).to.equal(1);
            expect(callOnHold.getState()).to.equal('held');
            done();
          } catch (e) {
            done(e);
          }
        }, 20);
      });

      it('[should call dial method] should publish `dialing` (assuming it calls dial)', function (done) {

        emitterCall.publish('held', eventData);

        setTimeout(function () {
          try {
            expect(publishStub.calledWith('dialing')).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

    });

    describe('disconnected', function () {

      var createCallStub;

      beforeEach(function (done) {

        createCallStub = sinon.stub(session, 'createCall', function () {
          session.currentCall = firstCall;
          session.pendingCall = null;
          session.addCall(firstCall);
          return firstCall;
        });

        phone.dial(dialOpts);// registers for events on the first call
        createCallStub.restore();

        // add a second call & hold the first one
        createCallStub = sinon.stub(session, 'createCall', function () {
          // simulate successful dial of a Second Call
          session.currentCall = secondCall;
          session.pendingCall = null;
          session.addCall(secondCall);
          return secondCall;
        });
        phone.addCall(addCallOpts);

        // simulate successful holding of the first call
        firstCall.setState('held');

        setTimeout(function () {
          createCallStub.restore();
          done();
        }, 20);
      });

      describe('`disconnected` event from the Active call when a call is on hold', function () {

        it('should resume the call on hold', function (done) {
          var calls,
            keys,
            callOnHold;

          // Assume disconnect of the secondCall was successful
          console.log('test', session.currentCall.id());
          session.currentCall.setState('disconnected');

          setTimeout(function () {
            try {
              calls = session.getCalls();
//            console.log('keys:', calls);
              keys = Object.keys(calls);
              callOnHold = calls[keys[0]];
//            console.log('currentcall:' + session.currentCall.id());

              expect(session.currentCall.id()).to.equal(firstCall.id());
              done();
            } catch (e) {
              done(e);
            }
          }, 20);
        });
      });

      describe('`disconnected event from the Call on hold when there\'s an active call', function () {
        it('should delete the call on hold', function (done) {
          var calls = phone.getSession().getCalls();

          // Assume disconnect of the call that is on hold
          firstCall.setState('disconnected');

          setTimeout(function () {
            try {
              console.log(Object.keys(calls));
              expect(calls[firstCall.id()]).to.equal(undefined);
              done();
            } catch (e) {
              done(e);
            }
          }, 20);

        });
      });
    });
  });

});