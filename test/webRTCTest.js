/**
	Tests for top-level ATT WebRTC.
*/
describe('webRTC', function () {
	var restClientSpy;
	beforeEach(function () {
		restClientSpy = sinon.spy(ATT.RESTClient.prototype, 'ajax');
	});

	afterEach(function () {
		restClientSpy.restore();
	});

	it('ATT namespace should exist and contain utils', function () {
		expect(ATT).to.exist;
		expect(ATT.utils).to.be.an('object');
	});

	it('should add api method on ATT namespace', function () {
		ATT.init({
		 apiConfigs: {
				login: {
					method: 'get'
				}
			}
		});
		expect(ATT.WebRTCAPI.login).is.a('function');
	});

	it('should call rest client with proper arguments from config', function () {
		var attConfig = {
			apiConfigs: {
				login: {
					method: 'get',
					url: 'http://example.com'
				}
			}
		};

		ATT.init(attConfig);
	
		ATT.WebRTCAPI.login({}, function(){}, function(){});
		
		var arg = restClientSpy.getCall(0).args[0];
		expect(arg.method).to.equal(attConfig.apiConfigs.login.method);
		expect(arg.url).to.equal(attConfig.apiConfigs.login.url);
	});

	it('should call rest client with correct callbacks and data', function () {
		var attConfig = {
			apiConfigs: {
				login: {
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

		ATT.WebRTCAPI.login(data, successCB, errorCB);
		
		var arg = restClientSpy.getCall(0).args[0];
		expect(arg.data).eql(data);
		expect(arg.success).equal(successCB);
		expect(arg.error).equal(errorCB);
	});
	it('should add api methods during init.', function () {
		ATT.init({
			apiConfigs: {
				login: {
					method: 'post'
				},
				logout: {
					method: 'delete'
				}
			}
		});

		expect(ATT.WebRTCAPI.login).is.a('function');
		expect(ATT.WebRTCAPI.logout).is.a('function');
	});
});