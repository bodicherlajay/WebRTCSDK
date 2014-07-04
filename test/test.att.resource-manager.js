/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true,
 before: true, sinon: true, expect: true, xit: true, xdescribe: true, afterEach: true, beforeEach: true*/

'use strict';

describe('ResourceManager', function () {

  var apiConfigs,
    resourceManager,
    factories;

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

      var getEventsConfig;

      beforeEach(function () {
        getEventsConfig = {
          method: 'get',
          formatters: {
            url: function () {
              return;
            },
            headers: {
              'Authorization': function () {
                return;
              }
            }
          },
          timeout: 500,
          headers: {
            'Content-Type': 'application/json',
            'Accept' : 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        };
      });
      it('Should Exist', function () {
        expect(resourceManager.doOperation).to.be.a('function');
      });

      it('should throw an error if `operationName` is invalid', function () {
        expect(resourceManager.doOperation.bind(resourceManager, undefined)).to.throw('Must specify an operation name.');
        expect(resourceManager.doOperation.bind(resourceManager, '')).to.throw('Must specify an operation name.');
        expect(resourceManager.doOperation.bind(resourceManager, 'anyInvalidName')).to.throw('Operation not found.');
      });

      it('should throw an error if `options` is invalid', function () {

        var badGetEventsConfig = ATT.utils.extend({}, getEventsConfig);

        badGetEventsConfig.params = {};

        expect(resourceManager.doOperation.bind(resourceManager, 'getEvents', undefined)).to.throw('No options found.');
        expect(resourceManager.doOperation.bind(resourceManager, 'getEvents', badGetEventsConfig)).to.throw('Params passed in must match number of formatters.');

        badGetEventsConfig.params = {
          abc: '',
          xyz: ''
        };

        expect(resourceManager.doOperation.bind(resourceManager, 'getEvents', badGetEventsConfig))
          .to.throw('You pass url param to for the url formatter.');

        badGetEventsConfig.params = {
          url: function () {
            return;
          },
          headers: {}
        };

        expect(resourceManager.doOperation.bind(resourceManager, 'getEvents', badGetEventsConfig))
          .to.throw('Header formatters in APIConfigs do not match the header parameters being passed in.');

      });

      it('should create a RESTful operation and executes it', function () {
        var restClient,
          restClientPseudoClassStub,
          ajaxStub,
          createWRTCSessionConfig;

        createWRTCSessionConfig = {
          data: {
            'session': {
              'mediaType': 'dtls-srtp',
              'ice': 'true',
              'services': [
                'ip_voice_call',
                'ip_video_call'
              ]
            }
          },
          params: {
            headers: {
              'Authorization': '123',
              'x-e911Id': '123',
              'x-Arg': 'ClientSDK=WebRTCTestAppJavascript1'
            }
          },
          success: function () { return; },
          error: function () {}
        };

        restClient = new RESTClient({
          method : 'GET',
          url : 'url',
          headers : 'headers',
          success : function () {return; }
        });

        ajaxStub = sinon.stub(restClient, 'ajax', function () {});

        restClientPseudoClassStub = sinon.stub(ATT, 'RESTClient', function () {
          return restClient;
        });

        resourceManager.doOperation('createWebRTCSession', createWRTCSessionConfig);

        expect(ajaxStub.called).to.equal(true);

        restClientPseudoClassStub.restore();
        ajaxStub.restore();
      });

    });

    describe('getRestOperationsConfig', function () {
      it('should exist', function () {
        expect(resourceManager.getRestOperationsConfig).to.be.a('function');
      });
    });
  });

});