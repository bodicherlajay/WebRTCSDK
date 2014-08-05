/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/


describe('Phone [Call]', function () {
  'use strict';
  var Call,
    Session,
    Phone,
    phone,
    session,
    factories,
    sessionStub,
    getUserMediaStub,
    userMediaService,
    restClientStub,
    createCallOptions,
    createPeerConnectionStub,
    options,
    emitterCall,
    createEventEmitterStub;

  beforeEach(function () {

    factories = ATT.private.factories;
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

  describe('Call Methods', function () {
    beforeEach(function () {
      userMediaService = ATT.UserMediaService;
      restClientStub = sinon.stub(RESTClient.prototype, 'ajax');
      createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection', function () {
        return {};
      });
    });

    afterEach(function () {
      restClientStub.restore();
      createPeerConnectionStub.restore();
    });
    describe('dial', function () {
      var onErrorSpy, call, createCallStub, callConnectStub;

      beforeEach(function () {
        onErrorSpy = sinon.spy();

        phone.on('error', onErrorSpy);

        call = new Call(createCallOptions);

        createCallStub = sinon.stub(session, 'createCall', function () {
          return call;
        });
        callConnectStub = sinon.stub(call, 'connect');

      });

      afterEach(function () {
        callConnectStub.restore();
        createCallStub.restore();
      });


      it('Should call `getUserMedia`', function () {
        getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia');
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
      describe('getUserMedia Success :onUserMedia', function () {
        var media = {localStream: '12123'}, onUserMediaSpy;
        beforeEach(function () {
          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options){
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

        it('should call `call.addStream` on userMedia Success', function (done) {
          var addStreamStub = sinon.stub(call, 'addStream');
          phone.dial(options);
          setTimeout(function () {
            expect(onUserMediaSpy.called).to.equal(true);
            expect(addStreamStub.called).to.equal(true);
            expect(addStreamStub.calledWith(media.localStream)).to.equal(true);
            expect(onUserMediaSpy.calledBefore(addStreamStub)).to.equal(true);
            expect(addStreamStub.calledAfter(onUserMediaSpy)).to.equal(true);
            addStreamStub.restore();
            done();
          }, 100);


        });
        it('should call `call.connect` on userMedia Success', function (done) {

          phone.dial(options);
          setTimeout(function () {
            expect(onUserMediaSpy.called).to.equal(true);
            expect(callConnectStub.called).to.equal(true);
            expect(onUserMediaSpy.calledBefore(callConnectStub)).to.equal(true);
            expect(callConnectStub.calledAfter(onUserMediaSpy)).to.equal(true);
            done();
          }, 100);

        });
      });

      describe('getUserMedia Success :onMediaEstablished', function () {
        var  onMediaEstablishedSpy;
        beforeEach(function () {
          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options){
            setTimeout(function () {
              onMediaEstablishedSpy = sinon.spy(options, 'onMediaEstablished');
              options.onMediaEstablished();
              onMediaEstablishedSpy.restore();
            }, 10);
          });

        });

        afterEach(function () {
          getUserMediaStub.restore();
        });

        it('should publish `media-established` on onMediaEstablished by getUserMedia', function (done) {
          var emitterPublishStub = sinon.stub(emitterCall, 'publish');
          phone.dial(options);
          setTimeout(function () {
            expect(onMediaEstablishedSpy.called).to.equal(true);
            expect(emitterPublishStub.called).to.equal(true);
            expect(emitterPublishStub.calledWith('media-established')).to.equal(true);

            expect(emitterPublishStub.getCall(1).args[1].mediaType).to.be.a('string');
            expect(emitterPublishStub.getCall(1).args[1].codec).to.be.a('array');
            expect(emitterPublishStub.getCall(1).args[1].timestamp).to.be.a('date');

            expect(onMediaEstablishedSpy.calledBefore(emitterPublishStub)).to.equal(true);
            expect(emitterPublishStub.calledAfter(onMediaEstablishedSpy)).to.equal(true);
            emitterPublishStub.restore();
            done();
          }, 100);


        });
      });

      describe('[20002] getUserMedia Success :onUserMediaError', function () {
        var getUserMediaStub, phone2,
          onErrorSpy;

        beforeEach(function () {
          onErrorSpy = sinon.spy();
          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
            options.onUserMediaError();
          });
          phone2 = new Phone();
          phone2.on('error', onErrorSpy);

        });

        afterEach(function () {
          getUserMediaStub.restore();
        });

        it('should publish error', function (done) {
          phone.dial(options);

          setTimeout(function () {
            expect(onErrorSpy.called).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('4011');
            done();
          }, 50);
        });
      });
    });



  });
});
