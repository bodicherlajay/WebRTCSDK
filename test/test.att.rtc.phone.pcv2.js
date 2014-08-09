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
    sessionStub,
    getUserMediaStub;

  beforeEach(function () {

    factories = ATT.private.factories;
    ums = ATT.UserMediaService;
    Phone = ATT.private.Phone;
    Call = ATT.rtc.Call;
    Session = ATT.rtc.Session;

    session = new Session();
    session.setId('123');
    sessionStub = sinon.stub(ATT.rtc, 'Session', function () {
      return session;
    });

    phone = new Phone();
  });

  afterEach(function () {
    sessionStub.restore();
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
          destination: '123',
          mediaType: 'video',
          localMedia: {},
          remoteMedia: {}
        };

        outgoingCallOpts = {
          peer: '1234567',
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
        phone.pcv = 2;
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
        phone.pcv = 1;
        phone.dial(dialOpts);

        expect(getUserMediaStub.called).to.equal(false);
      });

      describe('getUserMedia Success :onUserMedia', function () {

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

        it('should call `call.connect` with pcv = 2', function (done) {
          phone.pcv = 2;
          phone.dial(dialOpts);

          setTimeout(function () {
            try {
              expect(callConnectStub.called).to.equal(true);
              expect(callConnectStub.getCall(0).args[0].pcv).to.equal(2);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);

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

        session.currentCall = incomingCall;

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

        it('should call `Call.connect` with pcv = 2', function () {
          phone.pcv = 2;
          phone.answer(answerOpts);

          expect(callConnectStub.called).to.equal(true);
          expect(callConnectStub.calledWith({
            pcv: 2
          })).to.equal(true);
        });
      });
    });

    xdescribe('[US221924] Second call[end]', function () {

      var onSpy,
        callDisconnectStub,
        options;

      beforeEach(function () {

        onSpy = sinon.spy(outgoingCall, 'on');
        getUserMediaStub = sinon.stub(ums, 'getUserMedia');
        callDisconnectStub = sinon.stub(outgoingCall, 'disconnect', function () {
          emitterCall.publish('disconnected');
        });

        session.setId('12345');
        session.currentCall = outgoingCall;

        options = {
          destination: 'johnny',
          breed: 'call',
          mediaType: 'video',
          localMedia: localVideo,
          remoteMedia: remoteVideo,
          holdCurrentCall: false
        };
      });

      afterEach(function () {
        getUserMediaStub.restore();
        callDisconnectStub.restore();
      });

      it('should register for `disconnected` on the current call object', function () {
        phone.dial(options);
        session.currentCall = outgoingCall;
        expect(onSpy.calledWith('disconnected')).to.equal(true);
        expect(onSpy.calledBefore(callDisconnectStub)).to.equal(true);
      });

      it('should NOT execute call.disconnect() if [null === session.currentCall]', function () {

        session.currentCall = null;

        phone.dial(options);

        expect(callDisconnectStub.called).to.equal(false);
      });

      xit('should execute call.disconnect if [null !== session.currentCall]', function () {
        phone.dial(options);

        expect(callDisconnectStub.called).to.equal(true);
      });

      it('should call session.createCall on `disconnected` if [false === options.holdCurrentCall]', function (done) {

        phone.dial(options);

        emitterCall.publish('disconnected');

        setTimeout(function () {
          try {
            expect(createCallStub.called).to.equal(true);
            expect(createCallStub.getCall(0).args[0].peer).to.be.a('string');
            expect(createCallStub.getCall(0).args[0].type).to.be.a('string');
            expect(createCallStub.getCall(0).args[0].breed).to.be.a('string');
            expect(createCallStub.getCall(0).args[0].mediaType).to.be.a('string');
            expect(createCallStub.getCall(0).args[0].localMedia).to.be.a('object');
            expect(createCallStub.getCall(0).args[0].remoteMedia).to.be.a('object');

            done();
          } catch (e) {
            done(e);
          }
        }, 50);
      });
    });

    xdescribe('[US221924] Second call[hold]', function () {

      var onSpy,
        callHoldStub,
        moveToBkgStub,
        options;

      beforeEach(function () {

        onSpy = sinon.spy(outgoingCall, 'on');
        getUserMediaStub = sinon.stub(ums, 'getUserMedia');
        moveToBkgStub = sinon.stub(session, 'moveToBackground');

        callHoldStub = sinon.stub(outgoingCall, 'hold', function () {
          emitterCall.publish('held');
        });

        session.setId('12345');
        session.currentCall = outgoingCall;

        options = {
          destination: 'johnny',
          breed: 'call',
          mediaType: 'video',
          localMedia: localVideo,
          remoteMedia: remoteVideo,
          holdCurrentCall: true
        };
      });

      afterEach(function () {
        getUserMediaStub.restore();
        callHoldStub.restore();
        moveToBkgStub.restore();
      });

      it('should register for `held` on the current call object', function () {
        phone.dial(options);
        session.currentCall = outgoingCall;
        expect(onSpy.calledWith('held')).to.equal(true);
        expect(onSpy.calledBefore(callHoldStub)).to.equal(true);
      });


      xit('should execute call.hold if [null !== session.currentCall] && [true === options.holdCurrentCall', function () {
         phone.dial(options);
         expect(callHoldStub.called).to.equal(true);
      });

      xit('should call session.moveToBackground', function (done) {

        phone.dial(options);
        setTimeout(function () {
          expect(moveToBkgStub.called).to.equal(true);
          done();
        }, 50);
      });

      it('should call session.createCall on `held` if [true === options.holdCurrentCall]', function (done) {

        phone.dial(options);

        setTimeout(function () {
          try {
            expect(createCallStub.called).to.equal(true);
            expect(createCallStub.getCall(0).args[0].peer).to.be.a('string');
            expect(createCallStub.getCall(0).args[0].type).to.be.a('string');
            expect(createCallStub.getCall(0).args[0].breed).to.be.a('string');
            expect(createCallStub.getCall(0).args[0].mediaType).to.be.a('string');
            expect(createCallStub.getCall(0).args[0].localMedia).to.be.a('object');
            expect(createCallStub.getCall(0).args[0].remoteMedia).to.be.a('object');

            done();
          } catch (e) {
            done(e);
          }
        }, 50);
      });
    });
  });
});
