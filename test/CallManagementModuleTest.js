/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global cmgmt:true, describe: true, it: true, expect:true */
describe('Call Management', function () {
  'use strict';

  it('should be a singleton', function () {
    var instance1 = cmgmt.CallManager.getInstance(),
      instance2 = cmgmt.CallManager.getInstance();
    expect(instance1).equals(instance2);
  });
  it('should create Session Context', function () {
    var callmgr = cmgmt.CallManager.getInstance(), sessionContext;
    callmgr.CreateSession({token : "abcd", e911Id: "e911id", sessionId : "sessionId" });
    sessionContext = callmgr.getSessionContext();
    expect(sessionContext.getAccessToken()).equals("abcd");
    expect(sessionContext.getE911Id()).equals("e911id");
    expect(sessionContext.getSessionId()).equals("sessionId");
    expect(sessionContext.getCallState()).equals(callmgr.SessionState.READY);
  });
});