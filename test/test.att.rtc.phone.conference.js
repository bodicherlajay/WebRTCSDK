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
    ums,
    phone,
    session,
    factories,
    sessionStub;

  beforeEach(function () {

    factories = ATT.private.factories;
    Phone = ATT.private.Phone;
    Call = ATT.rtc.Call;
    Session = ATT.rtc.Session;
    ums = ATT.UserMediaService;

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
        conferenceOnStub,
        startConfOpts;

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

        startConfOpts = {
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        };

        conferenceOnStub = sinon.stub(conference, 'on');
      });

      afterEach(function () {
        createCallStub.restore();
        conferenceOnStub.restore();
      });


      it('should exist', function () {
        expect(phone.startConference).to.be.a('function');
      });

      describe('Input Validation', function () {

        beforeEach(function () {
          getUserMediaStub = sinon.stub(ums, 'getUserMedia');
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
          phone.startConference(startConfOpts);

          expect(createCallStub.called).to.be.equal(true);
          expect(createCallStub.getCall(0).args[0].localMedia).to.be.an('object');
          expect(createCallStub.getCall(0).args[0].remoteMedia).to.be.an('object');
          expect(createCallStub.getCall(0).args[0].mediaType).to.be.an('string');
          expect(createCallStub.getCall(0).args[0].breed).to.be.an('string');
          expect(createCallStub.getCall(0).args[0].type).to.be.an('string');
        });

      });

      describe('registrations', function () {

        beforeEach(function () {
          getUserMediaStub = sinon.stub(ums, 'getUserMedia');
        });

        afterEach(function () {
          getUserMediaStub.restore();
        });

        it('it should subscribe to the `connected` event on the conference', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.calledWith('connected')).to.equal(true);
        });

        it('it should subscribe to the `held` event on the conference', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.calledWith('held')).to.equal(true);
        });

        it('it should subscribe to the `resumed` event on the conference', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.calledWith('resumed')).to.equal(true);
        });

        it('it should subscribe to the `error` event on the conference', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.calledWith('error')).to.equal(true);
        });

        it('should subscribe to the `stream-added` event on conference', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.calledWith('stream-added')).to.equal(true);
        });

        it('should register for the `disconnected` event on the call object', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.calledWith('disconnected')).to.equal(true);
        });

        it('should register for `response-pending` event on the conference object', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.called).to.equal(true);
          expect(conferenceOnStub.calledWith('response-pending')).to.equal(true);
        });

        it('should register for `invite-accepted` event on the conference object', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.called).to.equal(true);
          expect(conferenceOnStub.calledWith('invite-accepted')).to.equal(true);
        });

        it('should register for `notification` event on the conference object', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.called).to.equal(true);
          expect(conferenceOnStub.calledWith('notification')).to.equal(true);
        });

        it('should register for `rejected` event on the conference object', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.calledWith('rejected')).to.equal(true);
          expect(conferenceOnStub.called).to.equal(true);
        });

        it('should register for `participant-removed` event on the conference object', function () {
          phone.startConference(startConfOpts);

          expect(conferenceOnStub.called).to.equal(true);
          expect(conferenceOnStub.calledWith('participant-removed')).to.equal(true);
        });
      });

      it('should get the local userMedia', function () {
        var phone2;

        phone2 = new Phone();
        getUserMediaStub = sinon.stub(ums, 'getUserMedia');
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

      describe('getUserMedia: onUserMedia', function () {
        var userMedia, getUserMediaStub,
          phone2,
          onUserMediaDummy,
          onUserMediaSpy;
        beforeEach(function () {
          userMedia = {localStream : '123'};

          onUserMediaDummy = function () {};
          onUserMediaSpy = sinon.spy(onUserMediaDummy);

          getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
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

          getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
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

      describe('getUserMedia: onUserMediaError', function () {
        var phone3;

        beforeEach(function () {

          getUserMediaStub = sinon.stub(ums, 'getUserMedia', function (options) {
            options.onUserMediaError();
          });

          phone3 = new Phone();
        });

        afterEach(function () {
          getUserMediaStub.restore();
        });

        it('[13005] should be published with error event', function (done) {
          phone3.on('error', onErrorSpy);
          phone3.startConference({
            localMedia : {},
            remoteMedia : {},
            mediaType : 'video'
          });
          setTimeout(function () {
            expect(onErrorSpy.called).to.equal(true);
            expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('13005');
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
        }, 50);
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
          expect(publishStub.calledWithMatch('error', {
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

      it('should execute conference.removeParticipant', function () {
        phone.removeParticipant('joe');

        expect(removeParticipantStub.calledWith('joe')).to.equal(true);
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
          expect(publishStub.calledWithMatch('error', {
            error: ATT.errorDictionary.getSDKError('25003')
          })).to.equal(true);
        });
      });
    });

  });

  describe('Events', function () {
    var outgoingAudioConference,
      createCallStub,
      emitterConf,
      createEventEmitterStub,
      getUserMediaStub,
      deleteCurrentCallStub,
      connectedSpy,
      heldSpy,
      resumedSpy,
      onInvitationSentSpy,
      onInvitationAcceptedSpy,
      onInvitationRejectedSpy,
      onParticipantRemovedSpy,
      onNotificationSpy,
      disconnectedSpy,
      errorSpy;

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

      getUserMediaStub = sinon.stub(ums, 'getUserMedia');

      deleteCurrentCallStub = sinon.stub(session, 'deleteCurrentCall');

      connectedSpy = sinon.spy();
      heldSpy = sinon.spy();
      resumedSpy = sinon.spy();
      onInvitationSentSpy = sinon.spy();
      onInvitationAcceptedSpy = sinon.spy();
      onInvitationRejectedSpy = sinon.spy();
      onParticipantRemovedSpy = sinon.spy();
      onNotificationSpy = sinon.spy();
      disconnectedSpy = sinon.spy();
      errorSpy = sinon.spy();

      phone.on('conference:connected', connectedSpy);
      phone.on('conference:held', heldSpy);
      phone.on('conference:resumed', resumedSpy);
      phone.on('conference:invitation-sent', onInvitationSentSpy);
      phone.on('conference:invitation-accepted', onInvitationAcceptedSpy);
      phone.on('conference:invitation-rejected', onInvitationRejectedSpy);
      phone.on('conference:participant-removed', onParticipantRemovedSpy);
      phone.on('notification', onNotificationSpy);
      phone.on('conference:ended', disconnectedSpy);
      phone.on('error', errorSpy);

      phone.startConference({
        localMedia : {},
        remoteMedia : {},
        mediaType : 'video'
      });
    });

    afterEach(function () {
      createEventEmitterStub.restore();
      createCallStub.restore();
      getUserMediaStub.restore();
      deleteCurrentCallStub.restore();
    });

    it('should publish `conference:connected` when conference publishes `connected`', function (done) {
      outgoingAudioConference.setState('connected');

      setTimeout(function () {
        try {
          expect(connectedSpy.called).to.equal(true);
          expect(connectedSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);

    });

    it('should publish `conference:held` when conference publishes `held`', function (done) {
      outgoingAudioConference.setState('held');

      setTimeout(function () {
        try {
          expect(heldSpy.called).to.equal(true);
          expect(heldSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);
    });

    it('should publish `conference:resumed` when conference publishes `resume`', function (done) {
      outgoingAudioConference.setState('resumed');

      setTimeout(function () {
        try {
          expect(resumedSpy.called).to.equal(true);
          expect(resumedSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);
    });

    it('should publish `conference:invitation-sent` when conference publishes `response-pending`', function (done) {
      outgoingAudioConference.setState('response-pending');

      setTimeout(function () {
        try {
          expect(onInvitationSentSpy.called).to.equal(true);
          expect(onInvitationSentSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 100);
    });

    it('should publish `conference:invitation-accepted` when conference publishes `invite-accepted`', function (done) {
      outgoingAudioConference.setState('invite-accepted');

      setTimeout(function () {
        try {
          expect(onInvitationAcceptedSpy.called).to.equal(true);
          expect(onInvitationAcceptedSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);
    });

    it('should publish `conference:invitation-rejected` when conference publishes `rejected`', function (done) {
      outgoingAudioConference.setState('rejected');

      setTimeout(function () {
        try {
          expect(onInvitationRejectedSpy.called).to.equal(true);
          expect(onInvitationRejectedSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);
    });

    it('should publish `conference:participant-removed` when conference publishes `participant-removed`', function (done) {
      outgoingAudioConference.setState('participant-removed');

      setTimeout(function () {
        try {
          expect(onParticipantRemovedSpy.called).to.equal(true);
          expect(onParticipantRemovedSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);
    });

    it('should publish `notification` when conference publishes `notification`', function (done) {
      outgoingAudioConference.setState('notification');

      setTimeout(function () {
        try {
          expect(onNotificationSpy.called).to.equal(true);
          expect(onNotificationSpy.calledOnce).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 100);
    });

    it('should publish `conference:ended` when conference publishes `disconnected`', function (done) {
      outgoingAudioConference.setState('disconnected');

      setTimeout(function () {
        try {
          expect(disconnectedSpy.calledOnce).to.equal(true);
          expect(deleteCurrentCallStub.called).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);

    });

    it('should execute userMediaSvc.showStream when conference publishes `stream-added`', function (done) {
      var data,
        showStreamStub = sinon.stub(ums, 'showStream');

      data = {
        stream: {
          abc: 'stream'
        }
      };
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
      outgoingAudioConference.setState('error');

      setTimeout(function () {
        try {
          expect(errorSpy.called).to.equal(true);
          done();
        } catch (e) {
          done(e);
        }
      }, 50);

    });
  });

});