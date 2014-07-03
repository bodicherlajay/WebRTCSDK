/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true,
 before: true, sinon: true, expect: true, xit: true, xdescribe: true, afterEach: true, beforeEach: true*/

'use strict';

describe.only('ResourceManager', function () {

  var apiConfigs,
    defaults,
    resourceManager,
    factories,
    logManager;

  before(function () {
    // Need to invoke configure first because it sets up
    // ATT.APIConfigs
    ATT.configure();
    apiConfigs = ATT.APIConfigs;
  });

  beforeEach(function () {

    factories = ATT.private.factories;

  });

  it('should export ATT.private.factories.createResourceManager', function () {
    expect(ATT.private.factories.createResourceManager).to.be.a('function');
  });

  describe('Factory method: createResourceManager', function () {

    it('Should throw an error if parameters are invalid', function () {
      expect(factories.createResourceManager.bind(factories, undefined)).to.throw('No API configuration passed');
      expect(factories.createResourceManager.bind(factories, {})).to.throw('No API configuration passed');
    });

    it('should setup restOperationsConfig with `config`', function () {

      resourceManager = factories.createResourceManager(apiConfigs);
      expect(resourceManager.getRestOperationsConfig()).to.equal(apiConfigs);

    });

    it('return an object', function () {
      resourceManager = factories.createResourceManager(apiConfigs);
      expect(resourceManager).to.be.an('object');
    });

  });

  describe('Methods', function () {
    beforeEach(function () {
      resourceManager = factories.createResourceManager(apiConfigs);
    });

  describe('doOperation', function () {
    it('Should Exist', function () {
      expect(resourceManager.doOperation).to.be.a('function');
    });

    xit('should throw an error if `operation` name is invalid', function () {
        expect(resourceManager.doOperation.bind(resourceManager, undefined)).to.throw('Must specify an operation name.');
        expect(resourceManager.doOperation.bind(resourceManager, '')).to.throw('Must specify an operation name.');
        expect(resourceManager.doOperation.bind(resourceManager, 'getEvents')).to.not.throw('Must specify an operation name.');

        expect(resourceManager.doOperation.bind(resourceManager, 'invalidName', {})).to.throw('Operation not found.');
    });
    xit('should throw an error if `options` is invalid', function () {
      expect(resourceManager.doOperation.bind(resourceManager, 'getEvents', undefined)).to.throw('Params passed in must match number of formatters.');
      expect(resourceManager.doOperation.bind(resourceManager, 'getEvents', {})).to.throw('You pass url param to for the url formatter.');
      expect(resourceManager.doOperation.bind(resourceManager, 'getEvents', {})).to.throw('Header formatters in APIConfigs do not match the header parameters being passed in.');
    });
    xit('should create a RESTful operation and execute it', function () {
      // expect(restClientStub.called);
      // expect(ajaxSpy.called);
    });
  });

  // TODO: getOperation should not be part of the public API
  // for resourceManager, then only public method is doOperation
  // hence we whould try to test everything through that method,
  // see tests for doOperation
    xdescribe('getOperation', function () {

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
      });

      it('should throw an error if the operation if not found', function () {
        expect(resourceManager.getOperation.bind(resourceManager, 'invalidName', {})).to.throw('Operation not found.');
      });

      it('should return a function (RESTOperation)', function () {
        var operation,
          getEventsOptions = {
            params: {
              url: function () { return; },
              headers: {
                Authorization: '123'
              }
            }
          };

        resourceManager = factories.createResourceManager(apiConfigs);

        operation = resourceManager.getOperation('getEvents', getEventsOptions);

        expect(operation).to.be.a('function');
      });

      xit('should throw an error if url param/headers don\'t match formatters.', function () {

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

      xit('should pass all header & url arguments to formatters', function () {

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

});