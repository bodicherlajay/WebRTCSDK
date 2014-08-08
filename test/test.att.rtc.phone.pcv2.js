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
    getUserMediaStub,
    createCallOptions,
    createPeerConnectionStub,
    options,
    emitterCall,
    createEventEmitterStub;

  beforeEach(function () {

    factories = ATT.private.factories;
    ums = ATT.UserMediaService;
    Phone = ATT.private.Phone;
    Call = ATT.rtc.Call;
    Session = ATT.rtc.Session;

    options = {
      destination: '123',
      mediaType: 'video',
      localMedia: {},
      remoteMedia: {}
    };

    createCallOptions = {
      peer: '1234567',
      breed : 'call',
      mediaType: 'video',
      type: ATT.CallTypes.OUTGOING,
      sessionInfo: {sessionId: '12345', token: '123'}
    };

    session = new Session();
    session.setId('123');
    sessionStub = sinon.stub(ATT.rtc, 'Session', function () {
      return session;
    });

    emitterCall = ATT.private.factories.createEventEmitter();

    createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
      return emitterCall;
    });

    phone = new Phone();
  });
  afterEach(function () {
    sessionStub.restore();
    createEventEmitterStub.restore();
  });

  describe('Methods', function () {

    var onErrorSpy,
      call,
      createCallStub,
      callConnectStub,
      localVideo,
      remoteVideo;

    beforeEach(function () {
      localVideo = document.createElement('video');
      remoteVideo = document.createElement('video');

      createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection', function () {
        return {};
      });

      onErrorSpy = sinon.spy();

      phone.on('error', onErrorSpy);

      call = new Call(createCallOptions);

      createCallStub = sinon.stub(session, 'createCall', function () {
        return call;
      });

    });

    afterEach(function () {
      createPeerConnectionStub.restore();
      createCallStub.restore();
    });

    describe('dial', function () {

      it('should `ums.getUserMedia` if pcv == 2', function () {
        getUserMediaStub = sinon.stub(ums, 'getUserMedia');

        phone.pcv = 2;
        phone.dial(options);

        expect(getUserMediaStub.called).to.equal(true);
        expect(getUserMediaStub.getCall(0).args[0].mediaType).to.equal('video');
        expect(getUserMediaStub.getCall(0).args[0].localMedia).to.be.an('object');
        expect(getUserMediaStub.getCall(0).args[0].remoteMedia).to.be.an('object');
        expect(getUserMediaStub.getCall(0).args[0].onUserMedia).to.be.an('function');
        expect(getUserMediaStub.getCall(0).args[0].onMediaEstablished).to.be.an('function');
        expect(getUserMediaStub.getCall(0).args[0].onUserMediaError).to.be.an('function');

        getUserMediaStub.restore();
      });

      it('should NOT execute `ums.getUserMedia` if pcv != 2', function () {
        getUserMediaStub = sinon.stub(ums, 'getUserMedia');

        phone.pcv = 1;
        phone.dial(options);

        expect(getUserMediaStub.called).to.equal(false);

        getUserMediaStub.restore();
      });

      describe('getUserMedia Success :onUserMedia', function () {

        var media = {localStream: '12123'}, onUserMediaSpy;

        beforeEach(function () {
          getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
            setTimeout(function () {
              onUserMediaSpy = sinon.spy(options, 'onUserMedia');
              options.onUserMedia(media);
              onUserMediaSpy.restore();
            }, 10);
          });

        });

        afterEach(function () {
          getUserMediaStub.restore();
        });

        it('should call `call.connect` with newPeerConnection as true', function (done) {
          callConnectStub = sinon.stub(call, 'connect', function () {});
          phone.pcv = 2;
          phone.dial(options);

          setTimeout(function () {
            try {
              expect(callConnectStub.called).to.equal(true);
              expect(callConnectStub.getCall(0).args[0].newPeerConnection).to.equal(true);
              callConnectStub.restore();
              done();
            } catch (e) {
              done(e);
            }
          }, 100);

        });
      });

    });

    xdescribe('[US221924] Second call[end]', function () {

      var onSpy,
        callDisconnectStub,
        options;

      beforeEach(function () {

        onSpy = sinon.spy(call, 'on');
        getUserMediaStub = sinon.stub(ums, 'getUserMedia');
        callDisconnectStub = sinon.stub(call, 'disconnect', function () {
          emitterCall.publish('disconnected');
        });

        session.setId('12345');
        session.currentCall = call;

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
        session.currentCall = call;
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

        onSpy = sinon.spy(call, 'on');
        getUserMediaStub = sinon.stub(ums, 'getUserMedia');
        moveToBkgStub = sinon.stub(session, 'moveToBackground');

        callHoldStub = sinon.stub(call, 'hold', function () {
          emitterCall.publish('held');
        });

        session.setId('12345');
        session.currentCall = call;

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
        session.currentCall = call;
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
