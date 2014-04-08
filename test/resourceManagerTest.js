/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe('ResourceManager', function () {
  'use strict';

  it('should be a singleton', function () {
    var instance1 = Env.resourceManager.getInstance(),
      instance2 = Env.resourceManager.getInstance();
    expect(instance1).equals(instance2);
  });

  it('configure method should add api methods on ATT namespace', function () {
    expect(Object.keys(ATT.WebRTC).length).is.greaterThan(0);
  });

  describe('initialization', function () {

    var apiConfig = ATT[ATT.apiNamespaceName];

    it('should add api methods during initialization', function () {
      expect(apiConfig.login).is.a('function');
      expect(apiConfig.logout).is.a('function');
    });

    it('should use APIConfigs.js if no config passed in', function () {
      expect(apiConfig.authenticate).is.a('function');
    });

    // Add API methods as you add to the APIConfig.js file.
    [
      'authenticate',
      'logout',
      'getBrowserSession',
      'createWebRTCSession',
      'getEvents',
      'login'
    ].forEach(function (methodName) {
      describe('Function ' + methodName, function () {
        it("should exist", function (done) {
          expect(apiConfig[methodName]).is.a('function');
          done();
        });
      });
    });
  });
});