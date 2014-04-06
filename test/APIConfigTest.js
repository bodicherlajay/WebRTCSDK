/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true*/

/**
 *  WebRTC API REST configuration file.
 *  All configured methods will be placed in the ATT.WebRTCAPI namespace.
 *  @namespace WebRTCAPI
 */

describe('APIConfig', function () {
  "use strict";
  it('should contain APIConfigs', function () {
    expect(ATT.APIConfigs).to.be.an('Object');
  });
});
