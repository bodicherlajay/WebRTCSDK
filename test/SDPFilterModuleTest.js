/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe('SDPFilter', function () {
  'use strict';
  it('should be a singleton', function () {
    var instance1 = ATT.sdpFilter.getInstance(),
      instance2 = ATT.sdpFilter.getInstance();
    expect(instance1).equals(instance2);
  });
});
