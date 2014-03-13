/**
	Tests for top-level ATT WebRTC.
*/
describe('webRTC', function () {
	var restClientStub;
	beforeEach(function () {
		restClientStub = sinon.stub(RESTClient.prototype, 'ajax', 
			function(config){
				config.success({code:'code'})
			}
		);

	});

	afterEach(function () {
		restClientStub.restore();
	});

	it('ATT namespace should exist and contain utils', function () {
		expect(ATT).to.exist;
		expect(ATT.utils).to.be.an('object');
	});

	describe('init', function(){
		it('should add api method on ATT namespace', function () {
			ATT.init({
			 apiConfigs: {
					foo: {
						method: 'get'
					}
				}
			});
			expect(ATT.WebRTCAPI.foo).is.a('function');
		});

		it('should call rest client with proper arguments from config', function () {
			var attConfig = {
				apiConfigs: {
					foo: {
						method: 'get',
						url: 'http://example.com'
					}
				}
			};

			ATT.init(attConfig);
		
			ATT.WebRTCAPI.foo({}, function(){}, function(){});
			
			var arg = restClientStub.getCall(0).args[0];
			expect(arg.method).to.equal(attConfig.apiConfigs.foo.method);
			expect(arg.url).to.equal(attConfig.apiConfigs.foo.url);
		});

		it('should call rest client with correct callbacks and data', function () {
			var attConfig = {
				apiConfigs: {
					foo: {
						method: 'get'
					}
				}
			};

			ATT.init(attConfig);
			
			var data = {
				username: 'username',
				password: 'password'
			};
			
			var successCB = function(){};
			var errorCB = function(){};

			ATT.WebRTCAPI.foo(data, successCB, errorCB);
			
			var arg = restClientStub.getCall(0).args[0];
			expect(arg.data).eql(data);
			expect(arg.success).equal(successCB);
			expect(arg.error).equal(errorCB);
		});

		it('should add api methods during init.', function () {
			ATT.init({
				apiConfigs: {
					foo: {
						method: 'post'
					},
					logout: {
						method: 'delete'
					}
				}
			});

			expect(ATT.WebRTCAPI.foo).is.a('function');
			expect(ATT.WebRTCAPI.logout).is.a('function');
		});

		it('should use APIConfigs.js if no config passed in', function() {
			ATT.init();
			expect(ATT.WebRTCAPI.login).is.a('function');
		});
		
		// Add API methods as you add to the APIConfig.js file.
		[
			'login', 
			'logout'
		].forEach(function(methodName){
			describe('Function ' + methodName, function () {
    			it("should exist", function (done) {
					ATT.init();
					expect(ATT.WebRTCAPI[methodName]).is.a('function');
					done();
    			});
  			});			
		});

	});
});