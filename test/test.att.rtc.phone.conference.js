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
    logger,
    phone,
    session,
    sessionStub;

  beforeEach(function () {

    Phone = ATT.private.Phone;
    Call = ATT.rtc.Call;
    Session = ATT.rtc.Session;

    session = new Session();
    sessionStub = sinon.stub(ATT.rtc, 'Session', function () {
      return session;
    });

    phone = new ATT.private.Phone();

  });
  afterEach(function () {
    sessionStub.restore();
  });

  describe('Conference Methods', function () {

    beforeEach(function () {
      logger = ATT.logManager.getInstance().addLoggerForModule('Phone');
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

    describe('[US225736] startConference', function () {
      var onErrorSpy,
        conference,
        createCallStub,
        userMedia,
        getUserMediaStub,
        conferenceOnStub;

      beforeEach(function () {
        onErrorSpy = sinon.spy();

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

      // WARNING: This test is dangerous, it will break so many other test that you will wish ...
      it.skip('[18005] should publish error if there\'s an uncaught exception', function (done) {

        var bkpOutgoing = ATT.CallTypes;

        // break something internal
        ATT.CallTypes = 'Bogus';

        phone.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });

        setTimeout(function () {
          expect(onErrorSpy.calledOnce).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18004');
          // DON'T forget to restore it :)
          ATT.CallTypes = bkpOutgoing;
          done();
        }, 300);
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
        expect(createCallStub.getCall(0).args[0].type).to.be.an('string');

      });

      it('it should subscribe to the `connected` event on the conference', function () {
        var phone2;

        conferenceOnStub = sinon.stub(conference, 'on');
        phone2 = new Phone();

        phone2.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });
        expect(conferenceOnStub.calledWith('connected')).to.equal(true);
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
        var userMedia, getUserMediaStub,
          phone2,
          onUserMediaDummy,
          onUserMediaSpy;
        beforeEach(function () {
          userMedia = {localStream : '123'};

          onUserMediaDummy = function () {};
          onUserMediaSpy = sinon.spy(onUserMediaDummy);

          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
            setTimeout(function () {
              onUserMediaSpy = sinon.spy(options, 'onUserMedia');
              options.onUserMedia(userMedia);
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
            expect(addStreamStub.calledWith(userMedia.localStream)).to.equal(true);
            addStreamStub.restore();
            done();
          }, 200);
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
      var eventData,
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

    describe('Events', function () {
      var outgoingAudioConference,
        createCallStub;

      beforeEach(function () {
        outgoingAudioConference = new Call({
          breed: 'conference',
          mediaType: 'audio',
          type: ATT.CallTypes.OUTGOING,
          sessionInfo : {sessionId : '12345', token : '123'}
        });

        createCallStub = sinon.stub(session, 'createCall', function () {
          return outgoingAudioConference;
        });
      });

      afterEach(function () {
        createCallStub.restore();
      });

      it('should publish `conference-connected` when conference publishes `connected`', function (done) {
        var connectedSpy = sinon.spy(),
          getUserMediaStub;
        userMediaService = ATT.UserMediaService;

        getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia');
        phone.on('conference-connected', connectedSpy);
        phone.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });

        outgoingAudioConference.setState('connected');

        setTimeout(function () {
          try {
            expect(connectedSpy.called).to.equal(true);
            expect(connectedSpy.calledOnce).to.equal(true);
            getUserMediaStub.restore();
            done();
          } catch (e) {
            done(e);
          }
        }, 200);

      });
    });
  });
});