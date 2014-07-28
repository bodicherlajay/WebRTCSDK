/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT, describe, it, afterEach, beforeEach, before, after, sinon, expect, assert, xit*/

describe.only('RTCManager [Conference]', function () {
  'use strict';

  var factories;

  beforeEach(function (){
    factories = ATT.private.factories;
  });

  describe('Methods', function () {
    var rtcManager;

    beforeEach(function () {
      rtcManager = ATT.private.rtcManager.getRTCManager();
    });

    describe('connectConference', function () {
      it('should exist', function () {
        expect(rtcManager.connectConference).to.be.a('function');
      });
    });
  });
});