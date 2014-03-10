describe('Rest Client', function () {

	// globals used in each test.
	var errorSpy,
		successSpy,
		openSpy,
		sendSpy,
		setRequestHeaderSpy,
		config,
		rc;

	beforeEach(function() {

		rc = new RestClient();

		openSpy = sinon.spy(XMLHttpRequest.prototype, 'open');
        sendSpy = sinon.spy(XMLHttpRequest.prototype, 'send');
       	setRequestHeaderSpy = sinon.spy(XMLHttpRequest.prototype, 'setRequestHeader');
		
		successSpy = sinon.spy();
		errorSpy = sinon.spy();

		config = {
			url: 'url',
			data: {some: 'data'},
			success: successSpy,
			error: errorSpy,
			async: true
		}
	
	});

	afterEach(function () {
		rc = null;
		successSpy = null;
		errorSpy = null;
		config = null;
		XMLHttpRequest.prototype.open.restore();
		XMLHttpRequest.prototype.send.restore();
		XMLHttpRequest.prototype.setRequestHeader.restore();
	});

	it('should create a new RestClient', function () {
		expect(rc).to.exist;
		expect(rc.get).to.be.a('function');
	});

	it('should call xhr open correctly for get', function () {
		//act
		rc.get(config);
		
		//assert
		sinon.assert.calledWithExactly(openSpy, 'get', config.url, true);
	});

	it('should call xhr open correctly for post', function () {
		//act
		rc.post(config);
		
		//assert
		sinon.assert.calledWithExactly(openSpy, 'post', config.url, true);
	});

	it('should call xhr send with serialized data string', function () {
		//act
		rc.get(config);

		//assert
		sinon.assert.calledWithExactly(sendSpy, '{"some":"data"}');
	});

	it('should call success callback', function () {
		var temp = XMLHttpRequest;

		XMLHttpRequest = function(){
			this.open = function(){};
			this.send = function() {
				this.onload();
			};
			this.responseText = '{"some":"data"}';
		};
 
		//act 
		rc.get(config);

		//assert
		var calledWith = successSpy.getCall(0).args[0];
		expect(calledWith.some).to.equal('data');
		sinon.assert.notCalled(errorSpy);
		XMLHttpRequest = temp;
	});

	it('should call error callback', function () {
		var temp = XMLHttpRequest;

		XMLHttpRequest = function(){
			this.open = function(){};
			this.send = function() {
				this.onerror();
			};
			this.responseText = '{"some":"data"}';
		};

		//act
		rc.get(config);

		//assert
		var calledWith = errorSpy.getCall(0).args[0];
		expect(calledWith.some).to.equal('data');
		sinon.assert.notCalled(successSpy);
		XMLHttpRequest = temp;
	});

	it('should not set any headers if none specified', function() {
		config.headers = null;

		//act
		rc.get(config);
		sinon.assert.notCalled(setRequestHeaderSpy);
	});

	it('should not set any headers if [] specified', function() {
		config.headers = [];

		//act
		rc.get(config);
		sinon.assert.notCalled(setRequestHeaderSpy);
	});

	it('should not set any headers if [] specified', function() {
		config.headers = {};

		//act
		rc.get(config);
		sinon.assert.notCalled(setRequestHeaderSpy);
	});

	it('should set all headers specified', function() {
		config.headers = [{'one': 'oneValue'},{'two':'twoValue'}];

		//act
		rc.get(config);

		var calledWith1 = setRequestHeaderSpy.getCall(0).args;
		var calledWith2 = setRequestHeaderSpy.getCall(1).args;
		expect(calledWith1).to.eql(['one','oneValue']);
		expect(calledWith2).to.eql(['two','twoValue']);
	});

	it('should set content type header for post if not specified', function(){

		config.headers = null;

		//act
		rc.post(config);
		expect(setRequestHeaderSpy.getCall(0).args).to.eql(['Content-Type','application/json']);
	});
});