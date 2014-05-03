/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
before: true, sinon: true, expect: true, xit: true, URL: true*/

describe('SignalingService', function () {
  'use strict';

  var requests,
    xhr;

  beforeEach(function () {

    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];

    xhr.onCreate = function (xhr) {
      requests.push(xhr);
    };
  });

  afterEach(function () {
    xhr.restore();
  });

  it('should exist and contain showStream and startCall methods.', function () {
    expect(ATT.UserMediaService).to.be.an('object');
    expect(ATT.UserMediaService.showStream).to.be.an('function');
    expect(ATT.UserMediaService.startCall).to.be.an('function');
  });

  xit('should set local stream', function () {
    var createObjectURLStub = sinon.stub(URL, "createObjectURL", function () {
    });

    ATT.UserMediaService.localVideoElement = document.createElement('div');
    ATT.UserMediaService.localVideoElement.play = function () {
    };

    ATT.UserMediaService.showStream('local', 'stream');
    expect(ATT.UserMediaService.localStream).to.equal('stream');
    createObjectURLStub.restore();
  });

  it('should call PeerConnectionService.start', function () {
    var stub = sinon.stub(ATT.PeerConnectionService, 'start', function () {
    });
    ATT.UserMediaService.startCall({});
    expect(stub.called).to.equal(true);
    stub.restore();
  });
});