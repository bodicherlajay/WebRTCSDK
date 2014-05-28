/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, describe: true, it: true, afterEach: true, beforeEach: true,
before: true, sinon: true, expect: true, assert: true, xit: true, URL: true*/

describe('UserMediaService', function () {
  'use strict';
  var backupAtt;

  beforeEach(function () {
    backupAtt = ATT;
  });
  it('should exist and contain startCall, showStream, stopStream', function () {
    expect(ATT.UserMediaService).to.be.an('object');
    expect(ATT.UserMediaService.startCall).to.be.a('function');
    expect(ATT.UserMediaService.showStream).to.be.a('function');
    expect(ATT.UserMediaService.stopStream).to.be.a('function');
  });

  it('should add `playing` event listener to remoteVideo', function () {
    var vidElement = document.createElement('video');
    ATT.UserMediaService.onRemoteVideoStart(vidElement);

    assert.ok(vidElement.src);
  });

  it('should set local stream', function () {
    var createObjectURLStub = sinon.stub(URL, "createObjectURL", function () {});

    ATT.UserMediaService.localVideoElement = document.createElement('div');
    ATT.UserMediaService.localVideoElement.play = function () {};

    ATT.UserMediaService.showStream('local', 'stream');
    expect(ATT.UserMediaService.localStream).to.equal('stream');
    createObjectURLStub.restore();
  });

  it('should stop local and remote streams', function () {
    ATT.UserMediaService.localStream = {foo: 'bar', stop: function () {}};
    ATT.UserMediaService.remoteStream = {foo: 'bar', stop: function () {}};
    ATT.UserMediaService.stopStream();
    assert.isNull(ATT.UserMediaService.localStream);
    assert.isNull(ATT.UserMediaService.remoteStream);
  });

  it('should mute local stream', function () {
    var audioTracks = [{ enabled: true}];
    ATT.UserMediaService.localStream = {foo: 'bar', getAudioTracks: function () { return audioTracks; }};
    ATT.UserMediaService.muteStream();
    assert.isFalse(ATT.UserMediaService.localStream.getAudioTracks()[0].enabled);
  });

  it('should umute local stream', function () {
    var audioTracks = [{ enabled: true}];
    ATT.UserMediaService.localStream = {foo: 'bar', getAudioTracks: function () { return audioTracks; }};
    ATT.UserMediaService.unmuteStream();
    assert.isTrue(ATT.UserMediaService.localStream.getAudioTracks()[0].enabled);
  });

  afterEach(function () {
    ATT = backupAtt;
  });
});