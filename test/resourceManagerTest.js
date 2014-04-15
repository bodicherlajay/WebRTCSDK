/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true,
beforeEach: true, before: true, sinon: true, expect: true, xit: true, xdescribe: true*/

'use strict';

describe('ResourceManager', function () {
  var DEFAULTS = {
    DHSEndpoint: ATT.appConfig.DHSEndpoint,
    BFEndpoint: ATT.appConfig.BFEndpoint,
    headers: {
      'Content-Type': 'application/json',
      'Accept' : 'application/json'
    }
  };

  it('should be a singleton', function () {
    var instance1 = Env.resourceManager.getInstance(),
      instance2 = Env.resourceManager.getInstance();
    expect(instance1).equals(instance2);
  });

  it('should return public SDK methods via getAPIObject', function () {
    var resourceManager = Env.resourceManager.getInstance(),
      apiObject = resourceManager.getAPIObject();
    expect(Object.keys(apiObject).length).is.greaterThan(0);
  });

  describe('doOperation', function () {
    it('should exist.', function () {
      expect(Env.resourceManager.doOperation).is.a('function');
    });
  });

  describe('getOperation', function () {

    before(function () {
    });

    it('should exist.', function () {
      expect(Env.resourceManager.getOperation).is.a('function');
    });

    it('should return a function.', function () {
      //var resourceManager = Env.resourceManager.getInstance(),
      var  getOperation = Env.resourceManager.getOperation,
        f = getOperation('logout');

      expect(f).is.a('function');
    });

    it('Throw exception if url param/headers dont match formatters.', function () {
      var resourceManager = Env.resourceManager.getInstance(),
        getOperation = Env.resourceManager.getOperation,
        getOperationConfig;

      // add single api method to rest api.
      resourceManager.configure({
        //apiConfigs: {
        testCall: {
          method: 'post',
          formatters: {
            url: function (params) {
              return DEFAULTS.BFEndpoint + '/sessions/' + params + '/calls';
            },
            headers: {
              Authorization: function (param) {
                return 'Bearer ' + param;
              },
              Accept: function (param) {
                return 'TestHeader ' + param;
              }
            }
          },
          headers: DEFAULTS.headers
        }
        //}
      });

      // no url arg but url formatter.
      getOperationConfig = {
        params: {
          //url: ['/url'], <-- missing
          headers: {
            Authorization: 'authorization',
            Accept: 'accept'
          }
        },
        success: function () {},
        error:   function () {}
      };

      // make call
      expect(getOperation.bind(Env.resourceManager, 'testCall', getOperationConfig)).to.throw('Params passed in must match number of formatters.');

      // header args don't match formatters
      getOperationConfig = {
        params: {
          url: ['/url'],
          headers: {
            //Authorization: 'authorization',
            Accept: 'accept'
          }
        },
        success: function () {},
        error:   function () {}
      };

      // make call
      expect(
        getOperation.bind(Env.resourceManager, 'testCall', getOperationConfig)
      ).to.throw(
        'Header formatters in APIConfigs do not match the header parameters being passed in.'
      );
    });

    it('should pass all header & url arguments to formatters', function () {

      var resourceManager = Env.resourceManager.getInstance(),
        getOperation = Env.resourceManager.getOperation,
        getOperationConfig,
        operation;

      // add single api method to rest api.
      resourceManager.configure({
        //apiConfigs: {
        testCall: {
          method: 'post',
          formatters: {
            url: function (param) {
              return DEFAULTS.BFEndpoint + '/sessions/' + param + '/calls';
            },
            headers: {
              Authorization: function (param) {
                return 'Bearer ' + param;
              },
              Accept: function (param) {
                return 'Something ' + param;
              }
            }
          },
          headers: DEFAULTS.headers
        }
        //}
      });

      getOperationConfig = {
        params: {
          url: ['abc123'],
          headers: {
            Authorization: 'authorization',
            Accept: 'accept'
          }
        },
        success: function () {},
        error:   function () {}
      };

      // make call
      operation = getOperation('testCall', getOperationConfig);

      // expects

      // url
      expect(operation.restConfig.url).equals(DEFAULTS.BFEndpoint + '/sessions/abc123/calls');

      // headers
      expect(operation.restConfig.headers.Authorization).equals('Bearer authorization');
      expect(operation.restConfig.headers.Accept).equals('Something accept');
      expect(operation.restConfig.headers['Content-Type']).equals('application/json');
    });

    it('should throw exception if the operation does not exist', function () {

      var resourceManager = Env.resourceManager.getInstance();
      resourceManager.configure();

      expect(Env.resourceManager.getOperation.bind(Env.resourceManager, 'abc')).to.throw('Operation does not exist.');
    });
  });

  describe('initialization', function () {

    var resourceManager = Env.resourceManager.getInstance(),
      apiObject = resourceManager.getAPIObject();

    it('should create public sdk methods', function () {
      // Add API methods as you add to the APIConfig.js file.
      [
        'answer',
        'dial',
        'eventChannel',
        'login',
        'logout',
        'stopUserMedia',
        'hangup'
      ].forEach(function (methodName) {
        expect(apiObject[methodName]).is.a('function');
      });
    });
  });
});