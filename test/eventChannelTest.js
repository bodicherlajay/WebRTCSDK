/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

/**
 * Unit tests for event channel module.
 */
describe('Event Channel', function () {
  'use strict';

  var resourceManager = Env.resourceManager.getInstance(),
    apiObject = resourceManager.getAPIObject();

  it('should contain eventChannel function (on ATT.WebRTC).', function () {
    apiObject.eventChannel.should.be.a('function');
  });
});