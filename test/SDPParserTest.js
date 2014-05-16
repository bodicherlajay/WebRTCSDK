/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe('SDPParser', function () {
  'use strict';
  var backupAtt,
    parser = ATT.sdpParser.getInstance();
  beforeEach(function () {
    backupAtt = ATT;
  });

  it('should be a singleton', function () {
    var instance1 = ATT.sdpParser.getInstance(),
      instance2 = ATT.sdpParser.getInstance();
    expect(instance1).equals(instance2);
  });

  it('should parse chrome sdp', function () {
    var description = {};
    var sdp = "v=0\r\n\
o=- 20518 0 IN IP4 203.0.113.1\r\n\
s= \r\n\
t=0 0\r\n\
c=IN IP4 203.0.113.1\r\n\
a=ice-ufrag:F7gI\r\n\
a=ice-pwd:x9cml/YzichV2+XlhiMu8g\r\n\
a=fingerprint:sha-1 42:89:c5:c6:55:9d:6e:c8:e8:83:55:2a:39:f9:b6:eb:e9:a3:a9:e7\r\n\
m=audio 54400 RTP/SAVPF 0 96\r\n\
a=rtpmap:0 PCMU/8000\r\n\
a=rtpmap:96 opus/48000\r\n\
a=ptime:20\r\n\
a=sendrecv\r\n\
a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host\r\n\
a=candidate:1 2 UDP 2113667326 203.0.113.1 54401 typ host\r\n\
m=video 55400 RTP/SAVPF 97 98\r\n\
a=rtpmap:97 H264/90000\r\n\
a=fmtp:97 profile-level-id=4d0028;packetization-mode=1\r\n\
a=rtpmap:98 VP8/90000\r\n\
a=sendrecv\r\n\
a=candidate:0 1 UDP 2113667327 203.0.113.1 55400 typ host\r\n\
a=candidate:1 2 UDP 2113667326 203.0.113.1 55401 typ host\r\n\
";
    description = parser.parse(sdp);

    var SDP = {
        version: 0,
        origin:
         {
             username: '-',
             sessionId: 20518,
             sessionVersion: 0,
             netType: 'IN',
             ipVer: 4,
             address: '203.0.113.1'
         },
        name: ' ',
        timing: { start: 0, stop: 0 },
        connection: { version: 4, ip: '203.0.113.1' },
        iceUfrag: 'F7gI',
        icePwd: 'x9cml/YzichV2+XlhiMu8g',
        fingerprint:
         {
             type: 'sha-1',
             hash: '42:89:c5:c6:55:9d:6e:c8:e8:83:55:2a:39:f9:b6:eb:e9:a3:a9:e7'
         },
        media:
         [{
             rtp:
                [{
                payload: 0,
                codec: 'PCMU',
                rate: 8000
                },
                {
                    payload: 96,
                    codec: 'opus',
                    rate: 48000
                }],
             fmtp:
                [],
             type: 'audio',
             port: 54400,
             protocol: 'RTP/SAVPF',
             payloads: '0 96',
             ptime: 20,
             direction: 'sendrecv',
             candidates:
                [{
                    foundation: 0,
                    component: 1,
                    transport: 'UDP',
                    priority: 2113667327,
                    ip: '203.0.113.1',
                    port: 54400,
                    type: 'host'
                },
                {
                    foundation: 1,
                    component: 2,
                    transport: 'UDP',
                    priority: 2113667326,
                    ip: '203.0.113.1',
                    port: 54401,
                    type: 'host'
                }]
         },
           {
               rtp:
                [{
                    payload: 97,
                    codec: 'H264',
                    rate: 90000
                },
                {
                    payload: 98,
                    codec: 'VP8',
                    rate: 90000
                }],
               fmtp:
                  [{
                      payload: 97,
                      config: 'profile-level-id=4d0028;packetization-mode=1'
                  }],
               type: 'video',
               port: 55400,
               protocol: 'RTP/SAVPF',
               payloads: '97 98',
               direction: 'sendrecv',
               candidates:
                [ { foundation: 0,
                       component: 1,
                       transport: 'UDP',
                       priority: 2113667327,
                       ip: '203.0.113.1',
                       port: 55400,
                       type: 'host' },
                     { foundation: 1,
                       component: 2,
                       transport: 'UDP',
                       priority: 2113667326,
                       ip: '203.0.113.1',
                       port: 55401,
                       type: 'host'
                     }]
           }]
    };

    Object.prototype.equals = function (x) {
        var p;
        for (p in this) {
            if (typeof (x[p]) == 'undefined') { console.log(p); expect(JSON.stringify(this[p])).to.equal(JSON.stringify(x[p])); return false; }
        }

        for (p in this) {
            if (this[p]) {
                switch (typeof (this[p])) {
                    case 'object':
                        if (!this[p].equals(x[p])) { return false; } break;
                    case 'function':
                        if (typeof (x[p]) == 'undefined' ||
                            (p != 'equals' && this[p].toString() != x[p].toString())) {
                            expect(this[p].toString()).to.equal(x[p].toString());
                            return false;
                        }
                        break;
                    default:
                        if (this[p] != x[p]) { expect(this[p]).to.equal(x[p]); return false; }
                }
            } else {
                if (x[p]) {
                    expect(x[p]).to.equal(false);
                    return false;
                }
            }
        }

        for (p in x) {
            if (typeof (this[p]) == 'undefined') { expect(this[p]).to.equal(x[p]); return false; }
        }

        return true;
    }

    expect(description.equals(SDP)).to.equal(true);
  });

  afterEach(function () {
    ATT = backupAtt;
  });
});