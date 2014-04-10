/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true, before: true, sinon: true, expect: true, xit: true*/

describe('ResourceManager', function () {
  'use strict';

  var resourceManager = Env.resourceManager.getInstance(),
    apiObject = resourceManager.getAPIObject();

  it('should be a singleton', function () {
    var instance1 = Env.resourceManager.getInstance(),
      instance2 = Env.resourceManager.getInstance();
    expect(instance1).equals(instance2);
  });

  it('configure method should add api methods on ATT namespace', function () {
    expect(Object.keys(apiObject).length).is.greaterThan(0);
  });

  describe('getOperation', function () {

    var getOperation = Env.resourceManager.getOperation;

    it('should exist.', function () {
      expect(Env.resourceManager.getOperation).is.a('function');
    });

    it('should return a function.', function () {
      var f = getOperation('testCall', {
        params: {
          url: ['/url'],
          headers: {
            Authorization: 'authorization',
            Accept: 'accept'
          }
        },
        success: function () {},
        error:   function () {}
      });
      expect(f).is.a('function');
    });
  });

  describe('initialization', function () {

    it('should add api methods during initialization', function () {
      expect(apiObject.login).is.a('function');
      expect(apiObject.logout).is.a('function');
    });

    it('should use APIConfigs.js if no config passed in', function () {
      expect(apiObject.authenticate).is.a('function');
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
          expect(apiObject[methodName]).is.a('function');
          done();
        });
      });
    });
  });
});