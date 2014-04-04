/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Env:true, ATT:true*/
describe('ResourceManager', function () {
    it('should be a singleton', function () {
          var instance1 = Env.resourceManager.getInstance(),
            instance2 = Env.resourceManager.getInstance();
          expect(instance1).equals(instance2);
    });

  it('configure method should add api methods on ATT namespace', function () {
    var resourceManager = Env.resourceManager.getInstance();
    expect(Object.keys(ATT.WebRTC).length).is.greaterThan(0);
  });

  describe('initialization', function () {
    
    var apiConfig = ATT[ATT.apiNamespaceName];

    xit('should call rest client with correct callbacks and data', function () {
      var attConfig = {
        apiConfigs: {
          foo: {
            method: 'get'
          }
        }
      };

      //ATT.init(attConfig);

      var config = {
        data: {
          username: 'username',
          password: 'password'
        },
        success: function () {},
        error: function () {}
      };


      var method = apiObj.foo;

      method(config);

      // expects
      expect(method.restClient.config.data).eql(config.data);
      expect(method.restClient.config.success).to.be.a('function');
      expect(method.restClient.config.error).to.be.a('function');
    });

    it('should add api methods during initialization', function () {
      expect(apiConfig.login).is.a('function');
      expect(apiConfig.logout).is.a('function');
    });

    it('should use APIConfigs.js if no config passed in', function() {
      //ATT.init();
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