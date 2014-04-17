/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, cmgmt, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true*/
describe('Call Management', function () {
  'use strict';
  var sdpDuplex = "o=- 1862751536763812389 2 IN IP4 127.0.0.1 \n a=sendrecv \n a=rtcp-mux",
    sdpSend = "o=- 1862751536763812389 2 IN IP4 127.0.0.1 \n a=recvonly \n a=rtcp-mux";

  it('should be a singleton', function () {
    var instance1 = cmgmt.CallManager.getInstance(),
      instance2 = cmgmt.CallManager.getInstance();
    expect(instance1).equals(instance2);
  });
  it('should create Session Context', function () {
    var callmgr = cmgmt.CallManager.getInstance(),
      sessionContext;
    callmgr.CreateSession({
      token: "abcd",
      e911Id: "e911id",
      sessionId: "sessionId"
    });
    sessionContext = callmgr.getSessionContext();
    expect(sessionContext.getAccessToken()).equals("abcd");
    expect(sessionContext.getE911Id()).equals("e911id");
    expect(sessionContext.getSessionId()).equals("sessionId");
    expect(sessionContext.getCallState()).equals(callmgr.SessionState.SDK_READY);
  });
  it('should modify the sdp to send only', function () {
    var config = {};
    before(function () {
      var callmgr = cmgmt.CallManager.getInstance();
        //sessionContext;
      callmgr.CreateSession({
        token: "abcd",
        e911Id: "e911id",
        sessionId: "sessionId"
      });
      //sessionContext = callmgr.getSessionContext();
      config.sdp = sdpDuplex;
    });
  });
  it('should modify the sdp to send and recv', function () {
    var config = {};
    before(function () {
      var callmgr = cmgmt.CallManager.getInstance();
        //sessionContext;
      callmgr.CreateSession({
        token: "abcd",
        e911Id: "e911id",
        sessionId: "sessionId"
      });
      //sessionContext = callmgr.getSessionContext();
      config.sdp = sdpSend;
    });
  });
});