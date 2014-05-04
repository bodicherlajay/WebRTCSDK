/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, extend:true, RESTClient:true, describe:true, beforeEach:true,
afterEach:true, it:true, xit:true, sinon:true, assert:true, expect:true, done:true */
'use strict';

describe.only('Rest Client', function () {

  // globals used in each test.
  var errorSpy,
    successSpy,
    config,
    rc,
    requests;

  beforeEach(function () {

    this.xhr = sinon.useFakeXMLHttpRequest();
    requests = this.requests = [];

    this.xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };

    successSpy = sinon.spy();
    errorSpy = sinon.spy();

    config = {
      url: 'url',
      data: {some: 'data'},
      success: successSpy,
      error: errorSpy,
      async: true
    };

    rc = new RESTClient(config);
  });

  afterEach(function () {
    this.xhr.restore();
  });

  it('should not share config objects', function () {
    var rc1, rc2;
    rc1 = new RESTClient({a: 1});
    rc2 = new RESTClient({a: 2});
    assert(rc1 !== rc2);
  });

  it('should create a new RESTClient', function () {
    assert(expect(rc).to.exist);
    expect(rc.get).to.be.a('function');
  });

  it('should call xhr open correctly for ajax', function () {
    config.method = 'get';
    rc = new RESTClient(config);
    //act
    rc.ajax(config);
    //assert
    expect(this.requests[0].url).to.equal(config.url);
    expect(this.requests[0].method).to.equal('get');
    expect(this.requests[0].async).to.equal(config.async);
  });

  it('should call xhr open correctly for post', function () {
    //act
    config.method = 'post';
    rc = new RESTClient(config);

    rc.ajax(config);

    //assert
    expect(this.requests[0].url).to.equal(config.url);
    expect(this.requests[0].method).to.equal('post');
    expect(this.requests[0].async).to.equal(config.async);
  });

  it('should call xhr send with serialized data string', function () {
    //act
    rc.post(config);
    //assert
    expect(this.requests[0].requestBody).to.equal('{"some":"data"}');
  });

  it('should call success callback', function () {
    //act
    rc.get(config);

    this.requests[0].respond(200, {"Content-Type": "application/json"}, '{"some":"data"}');

    //assert
    //expect(successSpy.calledWith({some:'data'})).to.be.true;

    var calledWith = successSpy.getCall(0).args[0]; // {some:data}
    expect(calledWith.getJson).to.be.a('function');
    expect(calledWith.responseText).to.equal('{"some":"data"}');
    assert(expect(errorSpy.called).to.be.false);
    sinon.assert.notCalled(errorSpy);
  });

  it('should call error callback on 400', function () {
    //act
    rc.get(config);
    this.requests[0].respond(400, {"Content-Type": "text/plain"}, '{"some":"data"}');
    //assert
    sinon.assert.called(errorSpy);
    expect(this.requests[0].status).to.equal(400);
    sinon.assert.notCalled(successSpy);
  });

  it('should call error callback on 599', function () {
    //act
    rc.get(config);
    this.requests[0].respond(599, {"Content-Type": "text/plain"}, '{"some":"data"}');
    //assert
    sinon.assert.called(errorSpy);
    expect(this.requests[0].status).to.equal(599);
    sinon.assert.notCalled(successSpy);
  });

  it('should only set Content-Type header if none specified', function () {
    //act
    rc = new RESTClient(config);
    rc.ajax();
    expect(this.requests[0].requestHeaders['Content-Type']).to.contain('application/json');
  });

  it('should set all headers specified', function () {
    config.headers = {'one': 'oneValue', 'two': 'twoValue'};
    //act
    rc.get(config);
    expect(this.requests[0].requestHeaders.one).to.equal('oneValue');
    expect(this.requests[0].requestHeaders.two).to.equal('twoValue');
  });

  it('should set content type header for post if not specified and retain existing headers', function () {
    config.headers = {a: 1};
    //act
    rc.post(config);
    expect(this.requests[0].requestHeaders.a).to.equal(1);
    expect(this.requests[0].requestHeaders['Content-Type']).to.contain('application/json');
  });

  it('should set content type header for get if not specified and retain existing headers', function () {
    config.headers = {a: 1};
    //act
    rc.get(config);
    expect(this.requests[0].requestHeaders.a).to.equal(1);
    expect(this.requests[0].requestHeaders['Content-Type']).to.contain('application/json');
  });

  it('should set content type header for delete if not specified and retain existing headers', function () {
    config.headers = {a: 1};
    //act
    rc.delete(config);
    expect(this.requests[0].requestHeaders.a).to.equal(1);
    expect(this.requests[0].requestHeaders['Content-Type']).to.contain('application/json');
  });

  it('should not override Content-Type header if its specified', function () {
    config.headers = {'Content-Type': 'application/xml'};
    //act
    rc.post(config);
    expect(this.requests[0].requestHeaders['Content-Type']).to.contain('application/xml');
  });

  it('should use correct defaults if no config provided', function () {
    var client, noConfig;
    client = new RESTClient({});
    noConfig = client.getConfig();
    expect(noConfig.success).to.be.a('function', 'success callback not set');
    expect(noConfig.error).to.be.a('function', 'error callback not set');
    expect(noConfig.timeout).to.equal(10000);
    assert(expect(noConfig.async).to.be.true);
  });

  it('should use set the timeout on the XMLHttpRequest', function () {
    config.timeout = 50;
    rc = new RESTClient(config);
    rc.ajax(config);
    //act
    expect(this.requests[0].timeout).to.equal(50);
  });

  it('should not share config (unique instances of RESTClient)', function () {
    var rc1, rc2, requests1, requests2;
    //act
    rc1 = new RESTClient({
      url: 'url1',
      headers: {'Content-Type': 'application/xml'}
    });
    rc2 = new RESTClient({
      url: 'url2'
    });

    rc1.ajax();
    requests1 = this.requests[0];
    expect(requests1.url).to.eql('url1');
    expect(requests1.requestHeaders['Content-Type']).to.contain('application/xml', 'request from rc1 had wrong header');

    rc2.ajax();
    requests2 = this.requests[1];
    expect(requests2.url).to.eql('url2');
    expect(requests2.requestHeaders['Content-Type']).to.contain('application/json', 'request from rc2 had wrong header');
  });
});