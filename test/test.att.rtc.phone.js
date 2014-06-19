/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert*/

describe('Phone', function () {
  'use strict';

  var phone;

  describe('Singleton', function () {
    it('should export ATT.rtc.Phone', function () {
      expect(ATT.rtc.Phone).to.be.a('object');
    });
    it('should have a method getPhone', function () {
      expect(ATT.rtc.Phone.getPhone).to.be.a('function');
    });
    it('should return an instance of ATT.private.Phone', function () {
      phone = ATT.rtc.Phone.getPhone();
      expect(phone instanceof ATT.private.Phone).to.equal(true);
    });
    it('should always return the same instance', function () {
      var phone1 = ATT.rtc.Phone.getPhone(),
        phone2 = ATT.rtc.Phone.getPhone();
      expect(phone1).to.equal(phone2);
    });
  });

  describe('Pseudo Class', function () {
    it('should export ATT.private.Phone', function () {
      expect(ATT.private.Phone).to.be.a('function');
    });

    describe('ATT.private.Phone Constructor', function () {
      var sessionConstructorSpy;

      it('should create a Phone object', function () {
        phone = new ATT.private.Phone();
        expect(phone instanceof ATT.private.Phone).to.equal(true);
      });

      it('should create a session on the Phone object', function () {
        sessionConstructorSpy = sinon.spy(ATT.rtc, 'Session');
        phone = new ATT.private.Phone();

        expect(sessionConstructorSpy.called).to.equal(true);

        sessionConstructorSpy.restore();
      });

      it('should register for event `ready` from Session', function () {
        var onSpy = sinon.spy(),
            sessionConstructorStub = sinon.stub(ATT.rtc, 'Session', function () {
              return {
                on: onSpy
              };
            });

        phone = new ATT.private.Phone();

        expect(onSpy.called).to.equal(true);
        expect(onSpy.getCall(0).args[0]).to.equal('ready');

        sessionConstructorStub.restore();
      });

    });

    describe('Methods', function () {

      beforeEach(function () {
        phone = new ATT.private.Phone();
      });

      describe('getSession', function () {

        it('should exist', function () {
          expect(phone.getSession).to.be.a('function');
        });

        it('should return an instance of ATT.rtc.Session', function () {
          var session = phone.getSession();
          expect(session instanceof ATT.rtc.Session).to.equal(true);
        });

      });

      describe('on', function () {

        it('should exist', function () {
          expect(phone.on).to.be.a('function');
        });

        it('Should fail if event is not recognized', function () {
          expect(phone.on.bind(phone, 'unknown')).to.throw(Error);
        });

        it('Should register callback for known events', function () {
          var fn = sinon.spy(),
              subscribeSpy = sinon.spy(ATT.event, 'subscribe');

          expect(phone.on.bind(phone, 'session-ready', fn)).to.not.throw(Error);
          expect(subscribeSpy.called).to.equal(true);

          subscribeSpy.restore();
        });
      });

      describe('login', function () {
        var session,
            options,
            onSessionReadySpy;

        beforeEach(function () {
          onSessionReadySpy = sinon.spy();

          options = {
            token: '123',
            e911Id: '123'
          };

          phone.on('session-ready', onSessionReadySpy);
          session = phone.getSession();
        });

        it('should exist', function () {
          expect(phone.login).to.be.a('function');
        });

        it('should throw error if no token in options', function () {
          expect(phone.login.bind(phone)).to.throw('Options not defined');
          expect(phone.login.bind(phone, {})).to.throw('Token not defined');
          expect(phone.login.bind(phone, {
            token: '123'
          })).to.not.throw('Token not defined');
        });

        it('should execute Session.connect', function () {
          var connectSpy = sinon.spy(session, 'connect');

          phone.login(options);

          expect(connectSpy.called).to.equal(true);

          connectSpy.restore();
        });

        it('should trigger `onSessionReady` callback on receiving the `ready` event from Session', function (done) {
          var connectStub = sinon.stub(session, 'connect', function () {
            ATT.event.publish('ready');
          });

          phone.login(options);

          setTimeout(function () {
            try {
              expect(onSessionReadySpy.called).to.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          }, 100);

          connectStub.restore();
        });

      });
    });
  });


});
