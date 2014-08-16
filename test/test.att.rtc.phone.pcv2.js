/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/


describe('Phone [PCV2]', function () {
  'use strict';

  var Call,
    Session,
    Phone,
    phone,
    session,
    factories,
    ums,
    error,
    eventData,
    sessionStub,
    getUserMediaStub,
    emitterPhone,
    createEventEmitterStub,
    publishStub;

  before(function () {
    ATT.private.pcv = 2;
  });

  after(function () {
    ATT.private.pcv = 1;
  });

  beforeEach(function () {
    factories = ATT.private.factories;
    ums = ATT.UserMediaService;
    Phone = ATT.private.Phone;
    Call = ATT.rtc.Call;
    Session = ATT.rtc.Session;

    error = {
      error: 'test message'
    };

    eventData = {
      abc: 'abc'
    };

    session = new Session();
    session.setId('123');
    sessionStub = sinon.stub(ATT.rtc, 'Session', function () {
      return session;
    });

    emitterPhone = factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
      return emitterPhone;
    });

    publishStub = sinon.stub(emitterPhone, 'publish');

    phone = new Phone();
  });

  afterEach(function () {
    sessionStub.restore();
    createEventEmitterStub.restore();
    publishStub.restore();
  });

  describe('Methods', function () {

    var createCallStub,
      callConnectStub,
      localVideo,
      remoteVideo;

    beforeEach(function () {
      localVideo = document.createElement('video');
      remoteVideo = document.createElement('video');
    });

    describe('dial', function () {
      var dialOpts,
        outgoingCallOpts,
        outgoingCall;

      beforeEach(function () {
        dialOpts = {
          destination: '1231234538',
          mediaType: 'video',
          localMedia: {},
          remoteMedia: {}
        };

        outgoingCallOpts = {
          peer: '1234567123',
          breed : 'call',
          mediaType: 'video',
          type: ATT.CallTypes.OUTGOING,
          sessionInfo: {sessionId: '12345', token: '123'}
        };

        outgoingCall = new Call(outgoingCallOpts);

        createCallStub = sinon.stub(session, 'createCall', function () {
          return outgoingCall;
        });

        getUserMediaStub = sinon.stub(ums, 'getUserMedia');
      });

      afterEach(function () {
        createCallStub.restore();
        getUserMediaStub.restore();
      });

      it('should `ums.getUserMedia` if pcv == 2', function () {
        phone.dial(dialOpts);

        expect(getUserMediaStub.called).to.equal(true);
        expect(getUserMediaStub.getCall(0).args[0].mediaType).to.equal('video');
        expect(getUserMediaStub.getCall(0).args[0].localMedia).to.be.an('object');
        expect(getUserMediaStub.getCall(0).args[0].remoteMedia).to.be.an('object');
        expect(getUserMediaStub.getCall(0).args[0].onUserMedia).to.be.an('function');
        expect(getUserMediaStub.getCall(0).args[0].onMediaEstablished).to.be.an('function');
        expect(getUserMediaStub.getCall(0).args[0].onUserMediaError).to.be.an('function');
      });

      it('should NOT execute `ums.getUserMedia` if pcv != 2', function () {
        ATT.private.pcv = 1;
        phone.dial(dialOpts);

        expect(getUserMediaStub.called).to.equal(false);
        ATT.private.pcv = 2;
      });

      describe('getUserMedia :onUserMedia', function () {

        beforeEach(function () {
          getUserMediaStub.restore();

          getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
            options.onUserMedia({
              localStream: 'localStream'
            });
          });

          callConnectStub = sinon.stub(outgoingCall, 'connect');
        });

        afterEach(function () {
          callConnectStub.restore();
        });

        it('should call `call.connect`', function (done) {
          phone.dial(dialOpts);

          setTimeout(function () {
            try {
              expect(callConnectStub.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);

        });
      });

      describe('getUserMedia: onUserMediaError', function () {

        beforeEach(function () {
          getUserMediaStub.restore();

          getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
            options.onUserMediaError(error);
          });
        });

        it('[13005] should be published with error event', function () {
          phone.dial(dialOpts);

          expect(publishStub.calledWithMatch('error', {
            error: ATT.errorDictionary.getSDKError('13005')
          })).to.equal(true);
        });
      });
    });

    describe('[US221924] addCall', function () {

      var emitterCall,
        call,
        onSpy,
        offSpy,
        addCallOpts,
        callHoldStub;

      beforeEach(function () {
        createEventEmitterStub.restore();

        emitterCall = factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
          return emitterCall;
        });

        call = new Call({
          breed: 'call',
          peer: '1234567',
          type: 'abc',
          mediaType: 'video'
        });

        callHoldStub = sinon.stub(call, 'hold');

        onSpy = sinon.spy(call, 'on');
        offSpy = sinon.spy(call, 'off');

        addCallOpts = {
          localMedia: 'localMedia',
          remoteMedia: 'remoteMedia',
          destination: '1234567890',
          mediaType: 'video'
        };

        session.currentCall = call;

        getUserMediaStub = sinon.stub(ums, 'getUserMedia');
      });

      afterEach(function () {
        callHoldStub.restore();
        onSpy.restore();
        offSpy.restore();
        getUserMediaStub.restore();
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

        expect(ATT.errorDictionary.getSDKError('27009')).to.be.an('object');
        expect(publishStub.calledWith('error', {
          error: ATT.errorDictionary.getSDKError('27009')
        })).to.equal(true);
      });

      it('[27000] should be published with error event if there is an unexpected exception', function () {

        callHoldStub.restore();

        callHoldStub = sinon.stub(call, 'hold', function () {
          throw error;
        });

        phone.addCall(addCallOpts);

        expect(ATT.errorDictionary.getSDKError('27000')).to.be.an('object');
        expect(publishStub.calledWith('error', {
          error: ATT.errorDictionary.getSDKError('27000')
        })).to.equal(true);
      });

      it('should register for `held` event on current call', function () {

        phone.addCall(addCallOpts);

        expect(onSpy.calledWith('held')).to.equal(true);
      });

      it('should execute Call.hold on the current call', function () {

        phone.addCall(addCallOpts);

        expect(callHoldStub.called).to.equal(true);
      });

      describe('Events for AddCall', function () {

        beforeEach(function () {
          phone.addCall(addCallOpts);
        });

        describe('held', function () {

          it('should unsubscribe for held event on current call', function (done) {

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

          it('should publish `dialing` (assuming it calls dial)', function (done) {

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
      });

    });

    describe('answer', function () {

      var answerOpts,
        incomingCallOpts,
        incomingCall;

      beforeEach(function () {
        answerOpts = {
          localMedia: localVideo,
          remoteMedia: remoteVideo
        };

        incomingCallOpts = {
          peer: '1234567',
          breed : 'call',
          mediaType: 'video',
          type: ATT.CallTypes.INCOMING,
          sessionInfo: {sessionId: '12345', token: '123'}
        };

        incomingCall = new Call(incomingCallOpts);

        session.pendingCall = incomingCall;

        getUserMediaStub = sinon.stub(ums, 'getUserMedia');
      });

      afterEach(function () {
        getUserMediaStub.restore();
      });

      it('should execute ums.getUserMedia if pcv == 2', function () {
        phone.pcv = 2;
        phone.answer(answerOpts);

        expect(getUserMediaStub.called).to.equal(true);
      });

      describe('getUserMedia: onUserMedia', function () {

        beforeEach(function () {
          getUserMediaStub.restore();

          getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
            options.onUserMedia({
              localStream: 'localStream'
            });
          });

          callConnectStub = sinon.stub(incomingCall, 'connect');
        });

        afterEach(function () {
          callConnectStub.restore();
        });

        it('should call `Call.connect`', function () {
          phone.pcv = 2;
          phone.answer(answerOpts);

          expect(callConnectStub.called).to.equal(true);
        });
      });
    });
  });
});
