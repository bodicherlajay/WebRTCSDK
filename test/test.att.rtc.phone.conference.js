/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/

describe('Phone [Conference]', function () {
  'use strict';
  var Call,
    Session,
    Phone,
    createPeerConnectionStub,
    restClientStub;

  describe('Conference Methods', function () {
    var phone;

    beforeEach(function () {
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
        createCallStub;

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

      it('should execute `conference.connect`', function () {

        var connectStub,
          phone3;

        phone3 = new Phone();
        phone3.on('error', function (error) {
          console.log(error);
        });

        connectStub = sinon.stub(conference, 'connect');

        phone3.startConference({
          localMedia : {},
          remoteMedia : {},
          mediaType: 'video'
        });

        expect(connectStub.called).to.equal(true);

        connectStub.restore();

      });

    });
  });
});