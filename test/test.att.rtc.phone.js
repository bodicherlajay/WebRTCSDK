/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, assert*/

describe('Phone', function () {
  'use strict';

  var resourceManager = Env.resourceManager.getInstance(),
    doOperation,
    requests;

  it('should exist', function () {
    expect(ATT.rtc.Phone).to.be.an('object');
  });

  describe('Login', function () {

    beforeEach(function () {
      this.xhr = sinon.useFakeXMLHttpRequest();
      requests = [];

      this.xhr.onCreate = function (xhr) {
        requests.push(xhr);
      };
      doOperation = sinon.spy(resourceManager, "doOperation");
    });

    afterEach(function () {
      this.xhr.restore();
      resourceManager.doOperation.restore();
    });

    it('login method should have all the parameters needed to login', function () {
      var params = { };
      expect(ATT.rtc.Phone.login.bind(ATT.rtc.Phone, params)).to.throw(TypeError);

      params = { e911Id: "e911id", audioOnly: true, callbacks:
        {onSessionReady: function () {return; }, onError : function () {return; }}};
      expect(ATT.rtc.Phone.login.bind(ATT.rtc.Phone, params)).to.throw(TypeError);

      params = {token: "token", audioOnly: true, callbacks:
        {onSessionReady: function () {return; }, onError : function () {return; }}};
      expect(ATT.rtc.Phone.login.bind(ATT.rtc.Phone, params)).to.throw(TypeError);
    });

    it('login with audio only service', function () {
      var expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204";
      ATT.rtc.Phone.login({token: "token", e911Id: "e911id", audioOnly: true, callbacks: {onSessionReady: function () {}, onError : function () {}}});
      expect(doOperation.calledOnce).equals(true);
      requests[0].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));
      expect(requests[0].requestBody).equals('{"session":{"mediaType":"dtls-srtp","ice":"true","services":["ip_voice_call"]}}');
      expect(requests[0].getResponseHeader('location')).to.equal(expectedLocationHeader);
      expect(requests[0].requestHeaders.Authorization).to.equal('Bearer token');
    });

    it('login with audio and video service', function () {
      var expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204";
      ATT.rtc.Phone.login({token: "token", e911Id: "e911id", callbacks: {onSessionReady: function () {}, onError : function () {}}});
      expect(doOperation.calledOnce).equals(true);
      requests[0].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));
      expect(requests[0].getResponseHeader('location')).to.equal(expectedLocationHeader);
      expect(requests[0].requestBody).equals('{"session":{"mediaType":"dtls-srtp","ice":"true","services":["ip_voice_call","ip_video_call"]}}');
      expect(requests[0].method).equals('post');
      expect(requests[0].requestHeaders.Authorization).to.equal('Bearer token');
    });
  });

  describe('logout', function () {
    xit('logout', function () {
      var expectedLocationHeader = "/RTC/v1/sessions/4ba569b5-290d-4f1f-b3af-255731383204", hdr;
      //stub = sinon.stub(ATT.UserMediaService, "stopStream");
      ATT.rtc.Phone.logout({
        success: function () {},
        error : function () {}
      });
      expect(doOperation.calledOnce).equals(true);
      requests[0].respond(200, {"Content-Type": "application/json", "location": expectedLocationHeader }, JSON.stringify({}));
      expect(requests[0].getResponseHeader('location')).to.equal(expectedLocationHeader);
      expect(requests[0].method).equals('delete');
      hdr = requests[0].url.indexOf(expectedLocationHeader) !== -1 ? true : false;
      expect(requests[0].requestHeaders.Authorization).to.equal('Bearer token');
      expect(hdr).equals(true);
      //stub.restore();
    });
  });

  describe('getMediaType', function () {
   //TODO need to replace this with object constructor pattern
    //var currentcall = ATT.rtc.Phone.rtcManager.getSession().getCurrentCall();
    it('Check if getMediaType returns null by default', function () {
      expect(ATT.rtc.Phone.getMediaType()).equals(null);
    });
    it('Check if getMediaType returns video type for video calls', function () {
      currentcall.setMediaType('video');
      expect(ATT.rtc.Phone.getMediaType()).equals('video');
    });
    it('Check if getMediaType returns audio type for audio Calls', function () {
      currentcall.setMediaType('audio');
      expect(ATT.rtc.Phone.getMediaType()).equals('audio');
    });
    it('Check if getMediaType returns null on call terminated or ended ', function () {
      currentcall.setMediaType(null);
      expect(ATT.rtc.Phone.getMediaType()).equals(null);
    });
  });

  describe('hold', function () {
    it('should publish error if hold throws exception', function () {
      //TODO need a way to get access to rtcManager
      var publishStub = sinon.stub(ATT.Error, 'publish'),
        sessionContextStub = sinon.stub(ATT.rtc.Phone.rtcManager, 'getSession', function () {
          return {
            getCurrentCall: function () {
              return {
                resume: function () {
                  throw new Error();
                }
              };
            }
          };
        });

      ATT.rtc.Phone.resume();
      expect(publishStub.called).to.equal(true);
      publishStub.restore();
      sessionContextStub.restore();
    });
    it('should throw an error when hold is called before call', function () {
      //TODO need a way to get access to rtcManager
      var publishStub = sinon.stub(ATT.Error, 'publish'),
        sessionContextStub = sinon.stub(ATT.rtc.Phone.rtcManager, 'getSession', function () {
          return {
            getCurrentCall: function () {
              return null;
            }
          };
        });

      ATT.rtc.Phone.hold();
      expect(publishStub.called).to.equal(true);
      publishStub.restore();
      sessionContextStub.restore();
    });
  });

  describe('resume', function () {
    it('should publish error if resume throws exception', function () {
      //TODO need a way to get access to rtcManager
      var publishStub = sinon.stub(ATT.Error, 'publish'),
        sessionContextStub = sinon.stub(ATT.rtc.Phone.rtcManager, 'getSession', function () {
          return {
            getCallObject: function () {
              return {
                resume: function () {
                  throw new Error();
                }
              };
            }
          };
        });

      ATT.rtc.Phone.resume();
      expect(publishStub.called).to.equal(true);
      publishStub.restore();
      sessionContextStub.restore();
    });

    //TODO need a way to get access to rtcManager
    it('should throw an error when resume is called before call', function () {
      var publishStub = sinon.stub(ATT.Error, 'publish'),
        sessionContextStub = sinon.stub(ATT.rtc.Phone.rtcManager, 'getSession', function () {
          return {
            getCurrentCall: function () {
              return null;
            }
          };
        });

      ATT.rtc.Phone.hold();
      expect(publishStub.called).to.equal(true);
      publishStub.restore();
      sessionContextStub.restore();
    });
  });
  describe('hangup', function () {

    //TODO need a way to get access to rtcManager
    it('should throw an error when hangup is called before call', function () {
      var publishStub = sinon.stub(ATT.Error, 'publish'),
        sessionContextStub = sinon.stub(ATT.rtc.Phone.rtcManager, 'getSession', function () {
          return {
            getCurrentCall: function () {
              return null;
            }
          };
        });

      ATT.rtc.Phone.hangup();
      expect(publishStub.called).to.equal(true);
      publishStub.restore();
      sessionContextStub.restore();
    });


    it('should publish error if end throws exception', function () {
      var publishStub = sinon.stub(ATT.Error, 'publish'),
        sessionContextStub = sinon.stub(ATT.rtc.Phone.rtcManager, 'getSession', function () {
          return {
            getCallObject: function () {
              return {
                end: function () {
                  throw new Error();
                }
              };
            }
          };
        });

      ATT.rtc.Phone.hangup();
      expect(publishStub.called).to.equal(true);
      publishStub.restore();
      sessionContextStub.restore();
    });
    //Shoud be handled in rtc-manager
    xit('should call callObject.hangup', function () {
      var hangupSpy = sinon.spy(),
        sessionContextStub = sinon.stub(ATT.rtc.Phone.rtcManager, 'getSession', function () {
          return {
            getCallObject: function () {
              return {
                end: hangupSpy
              };
            }
          };
        });

      ATT.rtc.Phone.hangup();
      expect(hangupSpy.called).to.equal(true);
      sessionContextStub.restore();
    });
  });

  describe('Mute', function () {
    it('should have a mute method', function () {
      assert.ok(ATT.rtc.Phone.mute);
    });
  });

  describe('Unmute', function () {
    it('should have a unmute method', function () {
      assert.ok(ATT.rtc.Phone.unmute);
    });
  });

  describe('Dial Method', function () {
    var phone, dialOpts,
      onCallingSpy,
      createOutgoingCallStub;

    beforeEach(function () {

      phone = ATT.rtc.Phone;

      dialOpts = {
        to : '11234567890',
        mediaConstraints : {},
        localVideo : 'dummy',
        remoteVideo : 'dummy',
        callbacks : {}
      };
    });

    it('dial method should have all the parameters needed to dial', function () {
      var params = {};
      expect(ATT.rtc.Phone.dial.bind(ATT.rtc.Phone, params)).to.throw(TypeError);

      params = {mediaConstraints : {}, localVideo : 'dummy', remoteVideo : 'dummy', callbacks : {} };
      expect(ATT.rtc.Phone.dial.bind(ATT.rtc.Phone, params)).to.throw(TypeError);

      params = {to : '11234567890', localVideo : 'dummy', remoteVideo : 'dummy', callbacks : {} };
      expect(ATT.rtc.Phone.dial.bind(ATT.rtc.Phone, params)).to.throw(TypeError);

      params = {to : '11234567890', mediaConstraints : {}, remoteVideo : 'dummy', callbacks : {} };
      expect(ATT.rtc.Phone.dial.bind(ATT.rtc.Phone, params)).to.throw(TypeError);

      params = {to : '11234567890', mediaConstraints : {}, localVideo : 'dummy', callbacks : {} };
      expect(ATT.rtc.Phone.dial.bind(ATT.rtc.Phone, params)).to.throw(TypeError);
    });



    it('should trigger `onConnecting` while dialing');

    xit('should trigger the `onCalling` if dial is successful', function (done) {
      // stub the resourceManager to force successful creation of the call
      createOutgoingCallStub = sinon.stub(phone.callManager, 'CreateOutgoingCall', function () {
        // assume it was successful, therefore execute onCallCreated
        phone.callManager.onCallCreated();
      });

      onCallingSpy = sinon.spy(function () {
        expect(onCallingSpy.called).to.equal(true);
        phone.hangup();
        createOutgoingCallStub.restore();
        done();
      });

      dialOpts.callbacks.onCalling = onCallingSpy;

      phone.dial(dialOpts);
    });

    it('should trigger the `onCallEstablished` after `onCalling`');

    afterEach(function () {
    });
  });

  describe('Reject Call', function () {
    it('should expose a reject method', function () {
      assert.ok(ATT.rtc.Phone.reject);
    });
  });
});
