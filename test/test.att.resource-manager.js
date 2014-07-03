/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true,
 before: true, sinon: true, expect: true, xit: true, xdescribe: true, afterEach: true, beforeEach: true*/

'use strict';

describe('ResourceManager', function () {

  //Need to invoke configure first
  ATT.configure();

  var defaults,
    resourceManager,
    factories,
    restOperationsConfig;

  beforeEach(function () {
    restOperationsConfig = {test: 'success'};

    factories = ATT.private.factories;

  });

  it('should export ATT.private.factories.createResourceManager', function () {
    expect(ATT.private.factories.createResourceManager).to.be.a('function');
  });

  describe('Factory method', function () {

    beforeEach(function () {
    });


    it('return an object', function () {
      resourceManager = factories.createResourceManager(restOperationsConfig);
      expect(resourceManager).to.be.an('object');
    });

    it('should call `configure` method to setup the APIConfigs', function () {
      resourceManager = factories.createResourceManager(restOperationsConfig);
      expect(resourceManager.getRestOperationsConfig()).to.equal(restOperationsConfig);
    });
  });

  describe('Methods', function () {
    beforeEach(function () {
      resourceManager = factories.createResourceManager(restOperationsConfig);
    });



    describe.only('Get operation', function () {

      beforeEach(function () {
        defaults = {
          DHSEndpoint: ATT.appConfig.DHSEndpoint,
          RTCEndpoint: ATT.appConfig.RTCEndpoint,
          headers: {
            'Content-Type': 'application/json',
            'Accept' : 'application/json'
          }
        };
      });

      it('Should Exist', function () {
        expect(resourceManager.getOperation).to.be.a('function');
      });

      it('should throw an error if parameters are invalid', function () {

        expect(resourceManager.getOperation.bind(resourceManager, undefined)).to.throw('Must specify an operation name.');
        expect(resourceManager.getOperation.bind(resourceManager, '')).to.throw('Must specify an operation name.');
        expect(resourceManager.getOperation.bind(resourceManager, 'getEvents')).to.not.throw('Must specify an operation name.');

        expect(resourceManager.getOperation.bind(resourceManager, 'getEvents', {})).to.not.throw(Error);
      });

      it('should return a function.', function () {
        var operation = resourceManager.getOperation('checkDhsSession');

        expect(operation).is.a('function');
      });

      it('Throw exception if url param/headers dont match formatters.', function () {

        var  getOperation = resourceManager.getOperation,
          getOperationConfig;

        // add single api method to rest api.
        resourceManager.configure({
          //apiConfigs: {
          testCall: {
            method: 'post',
            formatters: {
              url: function (params) {
                return defaults.RTCEndpoint + '/sessions/' + params + '/calls';
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
            headers: defaults.headers
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
          success: sinon.spy(),
          error: sinon.spy()
        };

        // make call
        expect(getOperation.bind(resourceManager, 'testCall', getOperationConfig)).to.throw('Params passed in must match number of formatters.');

        // header args don't match formatters
        getOperationConfig = {
          params: {
            url: ['/url'],
            headers: {
              //Authorization: 'authorization',
              Accept: 'accept'
            }
          },
          success: sinon.spy(),
          error: sinon.spy()
        };

        // make call
        expect(
          getOperation.bind(resourceManager, 'testCall', getOperationConfig)
        ).to.throw(
          'Header formatters in APIConfigs do not match the header parameters being passed in.'
        );
      });

      it('should pass all header & url arguments to formatters', function () {

        resourceManager = resourceManager;
        var getOperation = resourceManager.getOperation,
          getOperationConfig,
          operation;

        // add single api method to rest api.
        resourceManager.configure({
          //apiConfigs: {
          testCall: {
            method: 'post',
            formatters: {
              url: function (param) {
                return defaults.RTCEndpoint + '/sessions/' + param + '/calls';
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
            headers: defaults.headers
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
          success: sinon.spy(),
          error: sinon.spy()
        };

        // make call
        operation = getOperation('testCall', getOperationConfig);

        // expects

        // url
        expect(operation.restConfig.url).equals(defaults.RTCEndpoint + '/sessions/abc123/calls');

        // headers
        expect(operation.restConfig.headers.Authorization).equals('Bearer authorization');
        expect(operation.restConfig.headers.Accept).equals('Something accept');
        expect(operation.restConfig.headers['Content-Type']).equals('application/json');
      });

      it('should throw exception if the operation does not exist', function () {

        resourceManager = resourceManager;
        resourceManager.configure();

        expect(resourceManager.getOperation.bind(resourceManager, 'abc')).to.throw('Operation does not exist.');
      });


    });

    describe('Do operation', function () {
      it('Should Exist', function () {
        expect(resourceManager.doOperation).to.be.a('function');
      });
    });

    describe('Configure', function () {
      it('Should Exist', function () {
        expect(resourceManager.configure).to.be.a('function');
      });

      it('Should throw an error if parameters are invalid', function () {
        expect(resourceManager.configure.bind(resourceManager, undefined)).to.throw('No configuration Passed');
        expect(resourceManager.configure.bind(resourceManager, {})).to.throw('No configuration Passed');
      });

      it('should update restOperationsConfig', function () {
        var config = {test:'success'};
        resourceManager.configure(config);
        expect(resourceManager.getRestOperationsConfig()).to.equal(config);
      });
    });

    describe('getRestOperationsConfig', function () {
      it('should exist', function () {
        expect(resourceManager.getRestOperationsConfig).to.be.a('function');
      });
    });

    describe('getLogger ', function () {
      it('Should Exist', function () {
        expect(resourceManager.getLogger).to.be.a('function');
      });
    });

    describe('updateLogLevel ', function () {
      it('Should Exist', function () {
        expect(resourceManager.updateLogLevel).to.be.a('function');
      });
    });
  });


//  xdescribe('initialization', function () {
//
//    //resourceManager = resourceManager;
//    var apiObject = resourceManager.getAPIObject();
//
//    it('should create public sdk methods', function () {
//      // Add API methods as you add to the APIConfig.js file.
//      [ 'answer',
//        'dial',
//        'login',
//        'logout',
//        'hangup',
//        'hold',
//        'resume',
//        'mute'].forEach(function (methodName) {
//        expect(apiObject[methodName]).is.a('function');
//      });
//    });
//  });
});