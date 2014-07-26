/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert, after*/

describe('Phone [Conference]', function () {
  'use strict';
  var Call,
    Session,
    Phone;

  describe('Conference Methods', function () {
    var phone;

    beforeEach(function () {
      Phone = ATT.private.Phone;
      Call = ATT.rtc.Call;
      Session = ATT.rtc.Session;
      phone = ATT.rtc.Phone.getPhone();
    });

    describe('dialConference', function () {
      var onErrorSpy;

      beforeEach(function () {
        onErrorSpy = sinon.spy();
        phone.on('error', onErrorSpy);
      });

      it('should exist', function () {
        expect(phone.dialConference).to.be.a('function');
      });

      it('[18000] should publish error when the parameters are missing ', function (done) {
        phone.dialConference();

        setTimeout(function () {
          expect(onErrorSpy.called).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18000');
          done();
        }, 100);
      });

      it('[18000] should publish error when the parameters are invalid ', function (done) {

        phone.dialConference({});

        setTimeout(function () {
          expect(onErrorSpy.called).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18000');
          done();
        }, 100);
      });

      it('[18001] should publish error when no `localMedia` is passed ', function (done) {

        phone.dialConference({
          abc: {}
        });

        setTimeout(function () {
          expect(onErrorSpy.calledOnce).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18001');
          done();
        }, 100);
      });

      it('[18002] should publish error when no `remoteMedia` is Invalid ', function (done) {

        phone.dialConference({
          localMedia: {}
        });

        setTimeout(function () {
          expect(onErrorSpy.calledOnce).to.equal(true);
          expect(onErrorSpy.getCall(0).args[0].error.ErrorCode).to.equal('18002');
          done();
        }, 100);
      });

      it('[18003] should publish error when `Media Type` is invalid  ', function (done) {

        phone.dialConference({
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
        var createCallStub,
          session,
          sessionStub,
          phone2;
        session = new Session();

        sessionStub = sinon.stub(ATT.rtc, 'Session', function () {
          return session;
        });
        phone2 = new Phone();
        sessionStub.restore();

        createCallStub = sinon.stub(session, 'createCall');
        phone2.dialConference({
          localMedia : {},
          remoteMedia : {},
          mediaType : 'video'
        });

        expect(createCallStub.called).to.be.equal(true);
        expect(createCallStub.getCall(0).args[0].localMedia).to.be.an('object');
        expect(createCallStub.getCall(0).args[0].remoteMedia).to.be.an('object');
        expect(createCallStub.getCall(0).args[0].mediaType).to.be.an('string');
        expect(createCallStub.getCall(0).args[0].breed).to.be.an('string');
        createCallStub.restore();
      });

    });
  });
});