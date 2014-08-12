/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe('SDPFilter', function () {
  'use strict';
  var backupAtt,
    filter = ATT.sdpFilter.getInstance();
  beforeEach(function () {
    backupAtt = ATT;
  });

  it('should be a singleton', function () {
    var instance1 = ATT.sdpFilter.getInstance(),
      instance2 = ATT.sdpFilter.getInstance();
    expect(instance1).equals(instance2);
  });

  it('should process chrome sdp offer', function () {
    var description = {};
    description.sdp = "b=canttouchthis\r\na=fmtp:111 minptime=10";
    description = filter.processChromeSDPOffer(description);
    expect(description.sdp.indexOf("a=fmtp:111 minptime=10")).to.equal(-1);
  });

  it('should increment SDP', function () {
    var sdp = {};
    sdp.sdp = 'o= username, 2, 1, 3:3:3:3 \r\n s=- 4\r\n c=foo d=bar\r\n';
    sdp = filter.incrementSDP(sdp, 7);
    expect(sdp.sdp.indexOf('2')).to.equal(-1);
  });

  it('should remove unwanted sdp attribute', function () {
    var attr = "badboy",
      sdp = "b=1\r\n c=2\r\n a=badboy\r\n";
    sdp = filter.removeSDPAttribute(attr, sdp);
    expect(sdp.indexOf(attr)).to.equal(-1);
  });
  xdescribe('holdCall', function () {
    it('should replace sdp for hold call , function () {
      var sdp = "/a=sendrecv/g", attr ='recvonly';
      sdp = filter.holdCall(sdp);
      expect(sdp.indexOf(attr)).to.equal(-1);
    });
  });

  afterEach(function () {
    ATT = backupAtt;
  });
});