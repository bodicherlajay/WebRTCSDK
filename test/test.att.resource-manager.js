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

      it('should throw an error if `operationName` is invalid', function () {
        expect(resourceManager.doOperation.bind(resourceManager, undefined)).to.throw('Must specify an operation name.');
        expect(resourceManager.doOperation.bind(resourceManager, '')).to.throw('Must specify an operation name.');
        expect(resourceManager.doOperation.bind(resourceManager, 'getEvents')).to.not.throw(Error);

        expect(resourceManager.doOperation.bind(resourceManager, 'invalidName', )).to.throw('Operation not found.');
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