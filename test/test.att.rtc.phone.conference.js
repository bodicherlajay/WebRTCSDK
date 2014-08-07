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
    factories,
    sessionStub;

  beforeEach(function () {

    factories = ATT.private.factories;
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

      describe('Input Validation', function () {

        beforeEach(function () {
          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia');
        });

        afterEach(function () {
          getUserMediaStub.restore();
        });

        it('[18000] should publish error when the parameters are missing ', function (done) {
          phone.startConference();

          setTimeout(function () {
            expect(onErrorSpy.called).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18000');
            done();
          }, 10);
        });

        it('[18000] should publish error when the parameters are invalid ', function (done) {

          phone.startConference({});

          setTimeout(function () {
            expect(onErrorSpy.called).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18000');
            done();
          }, 10);
        });

        it('[18001] should publish error when no `localMedia` is passed ', function (done) {

          phone.startConference({
            abc: {}
          });

          setTimeout(function () {
            expect(onErrorSpy.calledOnce).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18001');
            done();
          }, 10);
        });

        it('[18002] should publish error when no `remoteMedia` is Invalid ', function (done) {

          phone.startConference({
            localMedia: {}
          });

          setTimeout(function () {
            expect(onErrorSpy.calledOnce).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18002');
            done();
          }, 10);
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
          }, 10);
        });

        it('[18007] should publish error when user not logged In ', function (done) {
          var sessionGetIdStub = sinon.stub(session, 'getId', function () {
            return null;
          });
          phone.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });
          setTimeout(function () {
            expect(onErrorSpy.calledOnce).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18007');
            sessionGetIdStub.restore();
            done();
          }, 10);
        });
        it('[18006] should publish error when tried to make second conference call ', function (done) {

          session.currentCall = conference;
          phone.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });

          setTimeout(function () {
            expect(onErrorSpy.calledOnce).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18006');
            done();
          }, 10);
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
          }, 30);
        });

        it('should publish `connecting` immediately');

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

        it('it should subscribe to the `error` event on the conference', function () {
          var phone3;

          conferenceOnStub = sinon.stub(conference, 'on');
          phone3 = new Phone();

          phone3.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });
          expect(conferenceOnStub.calledWith('error')).to.equal(true);
        });

        it('should subscribe to the `stream-added` event on conference', function () {
          var phone3;

          conferenceOnStub = sinon.stub(conference, 'on');
          phone3 = new Phone();

          phone3.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });
          expect(conferenceOnStub.calledWith('stream-added')).to.equal(true);
        });

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
          expect(loggerStub.calledWith('onMediaEstablished')).to.equal(true);
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
            }, 10);
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
          }, 20);
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
          }, 20);
        });

      });

      describe('getUserMedia: onMediaEstablished', function () {

        it('should publish `media-established` when onMediaEstablished  is invoked', function (done) {
          var connectedSpy = sinon.spy(),
            getUserMediaStub;
          userMediaService = ATT.UserMediaService;

          getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia', function (options) {
            options.onMediaEstablished();
          });
          phone.on('media-established', connectedSpy);
          phone.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });

          setTimeout(function () {
            try {
              expect(connectedSpy.called).to.equal(true);
              expect(connectedSpy.calledOnce).to.equal(true);
              getUserMediaStub.restore();
              done();
            } catch (e) {
              done(e);
            }
          }, 20);

        });
      });

      describe('[18004] getUserMedia: onUserMediaError', function () {
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
          }, 10);
        });
      });

    });

    describe('[US225741] endConference', function () {
      var eventData,
        error,
        errorData,
        emitterConf,
        conference,
        onSpy,
        callConstructorStub,
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

        callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
          return conference;
        });

        phone = new ATT.private.Phone();

        conferenceDisconnectStub  = sinon.stub(conference, 'disconnectConference');

        onSpy = sinon.spy(conference, 'on');
        conferenceDisconnectingHandlerSpy = sinon.spy();

        phone.on('conference:disconnecting', conferenceDisconnectingHandlerSpy);

        session.currentCall = conference;
        session.setId('1234');
      });

      afterEach(function () {
        onSpy.restore();
        callConstructorStub.restore();
        conferenceDisconnectStub.restore();
        createEventEmitterStub.restore();
      });

      it('should exist', function () {
        expect(phone.endConference).to.be.a('function');
      });

      it('should register for the `disconnecting` event on the call object', function () {
        phone.endConference();

        expect(onSpy.calledWith('disconnecting')).to.equal(true);
      });

      it('should execute conference.disconnectConference', function () {
        phone.endConference();

        expect(conferenceDisconnectStub.called).to.equal(true);
      });

      it('should trigger `conference:disconnecting` with relevant data when call publishes `disconnecting` event', function (done) {
        phone.endConference();

        emitterConf.publish('disconnecting', eventData);

        setTimeout(function () {
          try {
            expect(conferenceDisconnectingHandlerSpy.calledWith(eventData)).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      describe('Error handling', function () {
        var publishStub;

        beforeEach(function () {
          publishStub = sinon.stub(emitterConf, 'publish');
          conferenceDisconnectStub.restore();
        });

        afterEach(function () {
          publishStub.restore();
        });

        it('[23001] should be thrown if user is not logged in', function () {
          session.setId(null);

          phone.endConference();

          expect(ATT.errorDictionary.getSDKError('23001')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('23001')
          })).to.equal(true);
        });

        it('[23002] should be thrown if a conference is not in progress', function () {

          conference.breed = function () {
            return 'call'
          };

          phone.endConference();

          expect(ATT.errorDictionary.getSDKError('23002')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('23002')
          })).to.equal(true);
        });

        it('[23000] should be thrown if an internal error occurs', function () {
          conferenceDisconnectStub  = sinon.stub(conference, 'disconnectConference', function () {
            throw error;
          });

          phone.endConference();

          expect(ATT.errorDictionary.getSDKError('23000')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('23000')
          })).to.equal(true);
        });
      });
    });

    describe('[US225739] removeParticipant', function () {
      var eventData,
        error,
        errorData,
        emitterConf,
        conference,
        onSpy,
        callConstructorStub,
        removeParticipantStub,
        onParticipantRemovedHandlerSpy,
        createEventEmitterStub;

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

        callConstructorStub = sinon.stub(ATT.rtc, 'Call', function () {
          return conference;
        });

        phone = new ATT.private.Phone();

        removeParticipantStub  = sinon.stub(conference, 'removeParticipant');

        onSpy = sinon.spy(conference, 'on');
        onParticipantRemovedHandlerSpy = sinon.spy();

        phone.on('conference:participant-removed', onParticipantRemovedHandlerSpy);

        session.currentCall = conference;
        session.setId('1234');
      });

      afterEach(function () {
        onSpy.restore();
        callConstructorStub.restore();
        removeParticipantStub.restore();
        createEventEmitterStub.restore();
      });

      it('should exist', function () {
        expect(phone.removeParticipant).to.be.a('function');
      });

      it('should register for the `participant-removed` event on the conference object', function () {
        phone.removeParticipant('waldo');

        expect(onSpy.calledWith('participant-removed')).to.equal(true);
      });

      it('should execute conference.removeParticipant', function () {
        phone.removeParticipant('joe');

        expect(removeParticipantStub.calledWith('joe')).to.equal(true);
      });

      it('should trigger `conference:participant-removed` with relevant data when call publishes `participant-removed` event', function (done) {
        phone.removeParticipant('sally');

        emitterConf.publish('participant-removed', eventData);

        setTimeout(function () {
          try {
            expect(onParticipantRemovedHandlerSpy.calledWith(eventData)).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      describe('Error handling', function () {
        var publishStub;

        beforeEach(function () {
          publishStub = sinon.stub(emitterConf, 'publish');
          removeParticipantStub.restore();
        });

        afterEach(function () {
          publishStub.restore();
          removeParticipantStub.restore();
        });

        it('[25000] should be thrown if user is not logged in', function () {
          session.setId(null);

          phone.removeParticipant('barrysanders');

          expect(ATT.errorDictionary.getSDKError('25000')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('25000')
          })).to.equal(true);
        });

        it('[25001] should be thrown if a conference is not in progress', function () {

          conference.breed = function () {
            return 'call'
          };

          phone.removeParticipant('johnnymac');

          expect(ATT.errorDictionary.getSDKError('25001')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('25001')
          })).to.equal(true);
        });

        it('[25002] should be thrown if `participant` parameter is missing', function () {
          phone.removeParticipant();

          expect(ATT.errorDictionary.getSDKError('25002')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('25002')
          })).to.equal(true);
        });

        it('[25003] should be thrown if an internal error occurs', function () {
          removeParticipantStub.restore();

          removeParticipantStub = sinon.stub(conference, 'removeParticipant', function () {
            throw error;
          });

          phone.removeParticipant('sue');

          expect(ATT.errorDictionary.getSDKError('25003')).to.be.an('object');
          expect(publishStub.calledWith('error', {
            error: ATT.errorDictionary.getSDKError('25003')
          })).to.equal(true);
        });
      });
    });

    describe('Events', function () {
      var outgoingAudioConference,
        createCallStub,
        emitterConf,
        createEventEmitterStub;

      beforeEach(function () {
        emitterConf = factories.createEventEmitter();
        createEventEmitterStub = sinon.stub(factories, 'createEventEmitter', function () {
          return emitterConf;
        });
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
        createEventEmitterStub.restore();
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
        }, 20);

      });

      it('should execute userMediaSvc.showStream when conference publishes `stream-added`', function (done) {
        var data,
          showStreamStub = sinon.stub(ATT.UserMediaService, 'showStream');

        data = {
          stream: {
            abc: 'stream'
          }
        };

        phone.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });

        emitterConf.publish('stream-added', data);

        setTimeout(function () {
          try {
            expect(showStreamStub.calledWith({
              localOrRemote: 'remote',
              stream: {
                abc: 'stream'
              }
            })).to.equal(true);
            showStreamStub.restore();
            done();
          } catch (e) {
            done(e);
          }
        }, 10);
      });

      it('should publish `error` when conference publishes `error`', function (done) {
        var errorSpy = sinon.spy(),
          getUserMediaStub;
        userMediaService = ATT.UserMediaService;

        getUserMediaStub = sinon.stub(ATT.UserMediaService, 'getUserMedia');
        phone.on('error', errorSpy);
        phone.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });

        outgoingAudioConference.setState('error');

        setTimeout(function () {
          try {
            expect(errorSpy.called).to.equal(true);
            getUserMediaStub.restore();
            done();
          } catch (e) {
            done(e);
          }
        }, 20);

      });
    });
  });
});