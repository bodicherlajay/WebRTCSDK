/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt:true*/
/*global describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/
describe('Call Management', function () {
  'use strict';
  var sdpDuplex = '', sdpSend = '';
//  var sdpDuplex = `o=- 1862751536763812389 2 IN IP4 127.0.0.1 \
//  s=-   \
//    t=0 0   \
//  a=group:BUNDLE audio video    \
//  a=msid-semantic: WMS rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SB \
//  m=audio 1 RTP/SAVPF 103   \
//  c=IN IP4 0.0.0.0   \
//  a=ice-ufrag:zM6MgN5dfHpFXYa+    \
//  a=ice-pwd:TZjF0P84RubM4/4xj6zMWtl1    \
//  a=ice-options:trickle   \
//  a=mid:audio   \
//  a=maxptime:60  \
//  a=sendrecv    \
//  a=rtcp:1 IN IP4 0.0.0.0   \
//  a=rtcp-mux    \
//  a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:y3BFFMZiY/0KAPt0zRa+UGMY4qUc6TpcNw5s1yxz  \
//  a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level  \
//  a=rtpmap:103 ISAC/16000 \
//  a=ssrc:28 cname:qFC+oWb21AyDhH4V  \
//  a=ssrc:28 msid:rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SB rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SBa0  \
//  a=ssrc:28 mslabel:rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SB  \
//  a=ssrc:28 label:rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SBa0`;
//
//  var sdpSend = `o=- 1862751536763812389 2 IN IP4 127.0.0.1 \
//  s=-   \
//    t=0 0   \
//  a=group:BUNDLE audio video  \
//  a=msid-semantic: WMS rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SB \
//  m=audio 1 RTP/SAVPF 103 \
//  c=IN IP4 0.0.0.0  \
//  a=ice-ufrag:zM6MgN5dfHpFXYa+  \
//  a=ice-pwd:TZjF0P84RubM4/4xj6zMWtl1  \
//  a=ice-options:trickle \
//  a=mid:audio   \
//  a=maxptime:60   \
//  a=recvonly    \
//  a=rtcp:1 IN IP4 0.0.0.0   \
//  a=rtcp-mux    \
//  a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:y3BFFMZiY/0KAPt0zRa+UGMY4qUc6TpcNw5s1yxz    \
//  a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level    \
//  a=rtpmap:103 ISAC/16000   \
//  a=ssrc:28 cname:qFC+oWb21AyDhH4V    \
//  a=ssrc:28 msid:rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SB rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SBa0    \
//  a=ssrc:28 mslabel:rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SB    \
//  a=ssrc:28 label:rShHv0ssFzk8fODnhOvZyBiKF3gcoAvXC6SBa0`;

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
  it('should modify the sdp to send only', function () {
    var config = {};
    before(function () {
      var callmgr = cmgmt.CallManager.getInstance();
        //sessionContext = callmgr.getSessionContext();
      callmgr.CreateSession({token: "abcd", e911Id: "e911id", sessionId: "sessionId" });
      config.sdp = sdpDuplex;
    });

  });
  it('should modify the sdp to send and recv', function () {
    var config = {};
    before(function () {
      var callmgr = cmgmt.CallManager.getInstance();
        //sessionContext = callmgr.getSessionContext();
      callmgr.CreateSession({token : "abcd", e911Id: "e911id", sessionId : "sessionId" });
      config.sdp = sdpSend;
    });
  });

});