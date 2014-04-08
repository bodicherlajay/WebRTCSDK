/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
 before: true, sinon: true, expect: true, xit: true, URL: true, fail: true, assert: true*/

describe('utils', function () {
  'use strict';
  it('hasWebRTC should return true if navigator.mozGetUserMedia or ' +
    'navigator.webkitGetUserMedia or navigator.getUserMedia is a function', function () {

      var hasWebRTC = ATT.utils.hasWebRTC;
      expect(hasWebRTC).to.be.a('function');
    });
});