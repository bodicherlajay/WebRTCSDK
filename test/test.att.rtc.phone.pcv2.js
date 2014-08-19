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
          phone.answer(answerOpts);

          expect(callConnectStub.called).to.equal(true);
        });
      });
    });
  });
});
