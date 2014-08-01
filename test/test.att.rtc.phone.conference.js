/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/

describe('Phone [Conference]', function () {
  'use strict';
  var Call,
    Session,
    Phone,
    createPeerConnectionStub,
    restClientStub,
    userMediaService,
    logger;

  describe('Conference Methods', function () {
    var phone;

    beforeEach(function () {
      logger = ATT.logManager.getInstance().addLoggerForModule('Phone');
      userMediaService = ATT.UserMediaService;
      restClientStub = sinon.stub(RESTClient.prototype, 'ajax');
      Phone = ATT.private.Phone;
      Call = ATT.rtc.Call;
      Session = ATT.rtc.Session;
      createPeerConnectionStub = sinon.stub(ATT.private.factories, 'createPeerConnection', function () {
        return {};
      });
    });

    afterEach(function () {
      restClientStub.restore();
      createPeerConnectionStub.restore();
    });

    describe('startConference', function () {
      var onErrorSpy,
        session,
        sessionStub,
        conference,
        createCallStub,
        userMedia,
        getUserMediaStub;

      beforeEach(function () {
        onErrorSpy = sinon.spy();

        session = new Session();
        sessionStub = sinon.stub(ATT.rtc, 'Session', function () {
          return session;
        });

        phone = ATT.rtc.Phone.getPhone();
        phone.on('error', onErrorSpy);

        conference = new Call({
          breed: 'conference',
          mediaType: 'audio',
          type: ATT.CallTypes.OUTGOING,
          sessionInfo : {sessionId : '12345', token : '123'}
        });

        createCallStub = sinon.stub(session, 'createCall', function () {
          return conference;
        });
      });

      afterEach(function () {
        createCallStub.restore();
        sessionStub.restore();
      });

      it('should exist', function () {
        expect(phone.startConference).to.be.a('function');
      });

      it('[18000] should publish error when the parameters are missing ', function (done) {
        phone.startConference();

        setTimeout(function () {
          expect(onErrorSpy.called).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18000');
          done();
        }, 100);
      });

      it('[18000] should publish error when the parameters are invalid ', function (done) {

        phone.startConference({});

        setTimeout(function () {
          expect(onErrorSpy.called).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18000');
          done();
        }, 100);
      });

      it('[18001] should publish error when no `localMedia` is passed ', function (done) {

        phone.startConference({
          abc: {}
        });

        setTimeout(function () {
          expect(onErrorSpy.calledOnce).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18001');
          done();
        }, 100);
      });

      it('[18002] should publish error when no `remoteMedia` is Invalid ', function (done) {

        phone.startConference({
          localMedia: {}
        });

        setTimeout(function () {
          expect(onErrorSpy.calledOnce).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18002');
          done();
        }, 100);
      });

      it('[18003] should publish error when `Media Type` is invalid  ', function (done) {

        phone.startConference({
          localMedia : {},
          remoteMedia : {}
        });

        setTimeout(function () {
          expect(onErrorSpy.calledOnce).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18003');
          done();
        }, 100);
      });
      it('[18004] should publish error when `currentcall` is invalid  ', function (done) {

        session.currentCall = undefined;
        phone.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });

        setTimeout(function () {
          expect(onErrorSpy.calledOnce).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18004');
          done();
        }, 100);
      });

      it('should publish `conference:connecting` immediately');

      it('should execute `session.createCall`', function () {
        var phone2;

        phone2 = new Phone();

        phone2.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });

        expect(createCallStub.called).to.be.equal(true);
        expect(createCallStub.getCall(0).args[0].localMedia).to.be.an('object');
        expect(createCallStub.getCall(0).args[0].remoteMedia).to.be.an('object');
        expect(createCallStub.getCall(0).args[0].mediaType).to.be.an('string');
        expect(createCallStub.getCall(0).args[0].breed).to.be.an('string');

      });

      it('should get the local userMedia', function () {
        var phone2;

        phone2 = new Phone();
        getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia');
        phone2.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });
        expect(getUserMediaStub.called).to.equal(true);
        expect(getUserMediaStub.getCall(0).args[0].mediaType).to.equal('video');
        expect(getUserMediaStub.getCall(0).args[0].localMedia).to.be.an('object');
        expect(getUserMediaStub.getCall(0).args[0].remoteMedia).to.be.an('object');
        expect(getUserMediaStub.getCall(0).args[0].onUserMedia).to.be.an('function');
        expect(getUserMediaStub.getCall(0).args[0].onMediaEstablished).to.be.an('function');
        expect(getUserMediaStub.getCall(0).args[0].onUserMediaError).to.be.an('function');
        getUserMediaStub.restore();

      });
      describe('getUserMedia (local): onMediaEstablished', function () {
        it('should log that the local media is ok', function () {
          var phone2, loggerStub;

          phone2 = new Phone();
          loggerStub = sinon.stub(logger, 'logInfo');
          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
            options.onMediaEstablished();
          });
          phone2.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });
          expect(loggerStub.calledWith('Media Established')).to.equal(true);
          getUserMediaStub.restore();
          loggerStub.restore();
        });
      });

      describe('getUserMedia: onUserMedia', function () {
        var stream, getUserMediaStub,
          phone2,
          onUserMediaDummy,
          onUserMediaSpy;
        beforeEach(function () {
          stream = {abc : '123'};

          onUserMediaDummy = function () {};
          onUserMediaSpy = sinon.spy(onUserMediaDummy);

          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
            setTimeout(function () {
              onUserMediaSpy = sinon.spy(options, 'onUserMedia');
              options.onUserMedia(stream);
              onUserMediaSpy.restore();
            }, 100);
          });
          phone2 = new Phone();
        });
        afterEach(function () {
          getUserMediaStub.restore();
        });
        it('should add the local stream to the current conference', function (done) {
          var  addStreamStub = sinon.stub(conference, 'addStream');
          phone2.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });

          setTimeout(function () {
            expect(addStreamStub.calledWith(stream)).to.equal(true);
            addStreamStub.restore();
            done();
          }, 200)
        });

        it('should execute `conference.connect`', function (done) {
          var   connectStub = sinon.stub(conference, 'connect');
          phone2.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });

          setTimeout(function () {
            expect(onUserMediaSpy.called).to.equal(true);
            expect(connectStub.called).to.equal(true);
            expect(onUserMediaSpy.calledBefore(connectStub)).to.equal(true);
            expect(connectStub.calledAfter(onUserMediaSpy)).to.equal(true);
            connectStub.restore();
            done();
          }, 200);
        });

      });

      describe('[18004] getUserMedia: onMediaError', function () {
        var getUserMediaStub, phone3;
        beforeEach(function () {

          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
            options.onUserMediaError();
          });
          phone3 = new Phone();
        });
        afterEach(function () {
          getUserMediaStub.restore();
        });
        it('should publish error', function (done) {
          phone3.on('error', onErrorSpy);
          phone3.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });
          setTimeout(function () {
            expect(onErrorSpy.called).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18004');
            done();
          }, 100);
        });
      });
    });

    describe('endConference', function () {
      var session,
        eventData,
        error,
        errorData,
        emitterConf,
        conference,
        createCallStub,
        onSpy,
        currentSession,
        sessionStub,
        conferenceDisconnectStub,
        createEventEmitterStub,
        conferenceDisconnectingHandlerSpy;

      beforeEach(function () {
        session = new Session();
        sessionStub = sinon.stub(ATT.rtc, 'Session', function () {
          return session;
        });

        eventData = {
          abc: 'abc'
        };

        error = {
          ErrorMessage: 'Test Error'
        };

        errorData = {
          error: error
        };

        emitterConf = ATT.private.factories.createEventEmitter();

        createEventEmitterStub = sinon.stub(ATT.private.factories, 'createEventEmitter', function () {
          return emitterConf;
        });

        conference = new Call({
          breed: 'conference',
          mediaType: 'audio',
          type: ATT.CallTypes.OUTGOING,
          sessionInfo : {sessionId : '12345', token : '123'}
        });

        createCallStub = sinon.stub(session, 'createCall', function () {
          return conference;
        });

        createEventEmitterStub.restore();

        conferenceDisconnectStub  = sinon.stub(conference, 'disconnect');

        onSpy = sinon.spy(conference, 'on');
        conferenceDisconnectingHandlerSpy = sinon.spy();

        phone = ATT.rtc.Phone.getPhone();

        phone.on('conference-disconnecting', conferenceDisconnectingHandlerSpy);

        currentSession = phone.getSession();
        currentSession.currentCall = conference;
      });

      afterEach(function () {
        createCallStub.restore();
        sessionStub.restore();
        onSpy.restore();
      });

      it('should exist', function () {
        expect(phone.endConference).to.be.a('function');
      });

      it('should register for the `disconnecting` event on the call object', function () {
        phone.endConference();

        expect(onSpy.calledWith('disconnecting')).to.equal(true);
      });

      it('should execute conference.disconnect', function () {
        phone.endConference();

        expect(conferenceDisconnectStub.called).to.equal(true);
      });

      it('should trigger `conference-disconnecting` with relevant data when call publishes `disconnecting` event', function (done) {
        phone.endConference();

        emitterConf.publish('disconnecting', eventData);

        setTimeout(function () {
          try {
            expect(conferenceDisconnectingHandlerSpy.calledWith(eventData)).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });
    });
  });
});