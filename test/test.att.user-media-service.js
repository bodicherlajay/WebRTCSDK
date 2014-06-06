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

  it('startCall should set localVideo, remoteVideo elements', function () {
    var config = {
      localVideo: 'localVideoEl',
      remoteVideo: 'remoteVideoEl'
    },
      stubGetUserMedia = sinon.stub(window, 'getUserMedia'),
      stubOnRemoteVideoStart = sinon.stub(ATT.UserMediaService, 'onRemoteVideoStart');
    ATT.UserMediaService.startCall(config);

    expect(ATT.UserMediaService.localVideoElement).equals('localVideoEl');
    expect(ATT.UserMediaService.remoteVideoElement).equals('remoteVideoEl');
    stubGetUserMedia.restore();
    stubOnRemoteVideoStart.restore();
  });

  it('startCall should publish error if getUserMedia fails', function () {
    var config = {
        localVideo: 'localVideoEl',
        remoteVideo: 'remoteVideoEl'
      },
      stubGetUserMedia = sinon.stub(window, 'getUserMedia').callsArg(2),
      stubOnRemoteVideoStart = sinon.stub(ATT.UserMediaService, 'onRemoteVideoStart'),
      spy = sinon.spy();

    ATT.UserMediaService.setError({
      publish: spy
    });

    ATT.UserMediaService.startCall(config);
    expect(spy.called).to.equal(true);
    stubGetUserMedia.restore();
    stubOnRemoteVideoStart.restore();
  });

  it('showStream should play remote video if localOrRemote set to remote', function () {
    var spy = sinon.spy(),
      args = {
        localOrRemote: 'remote',
        stream: 'stream'
      },
      config = {
        localVideo: {},
        remoteVideo: {
          play: spy   // this should get called
        }
      },
      stubGetUserMedia = sinon.stub(window, 'getUserMedia'),
      stubOnRemoteVideoStart = sinon.stub(ATT.UserMediaService, 'onRemoteVideoStart'),
      stubWindowURLCreateObjectURL = sinon.stub(window.URL, 'createObjectURL', function () {
        return 'src';
      });

    ATT.UserMediaService.startCall(config);
    ATT.UserMediaService.showStream(args);
    expect(spy.called).to.equal(true);
    expect(ATT.UserMediaService.remoteStream).equals(args.stream);

    // cleanup
    stubGetUserMedia.restore();
    stubOnRemoteVideoStart.restore();
    stubWindowURLCreateObjectURL.restore();
  });

  it('showStream should publish error if cannot start stream', function () {
    var spyPublish = sinon.spy(),
      args = {
        localOrRemote: 'remote',
        stream: 'stream'
      },
      config = {
        localVideo: {},
        remoteVideo: {
          play: function () {
            throw new Error();    // this should throw exception
          }
        }
      },
      stubGetUserMedia = sinon.stub(window, 'getUserMedia'),
      stubOnRemoteVideoStart = sinon.stub(ATT.UserMediaService, 'onRemoteVideoStart'),
      stubWindowURLCreateObjectURL = sinon.stub(window.URL, 'createObjectURL', function () {
        return 'src';
      });

    ATT.UserMediaService.setError({
      publish: spyPublish
    });

    ATT.UserMediaService.startCall(config);
    ATT.UserMediaService.showStream(args);
    expect(spyPublish.called).to.equal(true);

    // cleanup
    stubGetUserMedia.restore();
    stubOnRemoteVideoStart.restore();
    stubWindowURLCreateObjectURL.restore();
  });

  it('showStream should call videoStreamEl setAttribute if localOrRemote not set to remote and call play', function () {
    var spy = sinon.spy(),
      spySetAttribute = sinon.spy(),
      args = {
        localOrRemote: 'local',
        stream: 'stream'
      },
      config = {
        localVideo: {
          play: spy,   // this should get called
          setAttribute: spySetAttribute
        },
        remoteVideo: {
          play: spy   // this should get called
        }
      },
      stubGetUserMedia = sinon.stub(window, 'getUserMedia'),
      stubOnRemoteVideoStart = sinon.stub(ATT.UserMediaService, 'onRemoteVideoStart'),
      stubWindowURLCreateObjectURL = sinon.stub(window.URL, 'createObjectURL', function () {
        return 'src';
      });

    ATT.UserMediaService.startCall(config);
    ATT.UserMediaService.showStream(args);

    // verify
    expect(spy.called).to.equal(true);
    expect(ATT.UserMediaService.localStream).equals(args.stream);

    // cleanup
    stubGetUserMedia.restore();
    stubOnRemoteVideoStart.restore();
    stubWindowURLCreateObjectURL.restore();
  });

  it('should stop local and remote streams', function () {
    ATT.UserMediaService.localStream = {foo: 'bar', stop: function () {}};
    ATT.UserMediaService.remoteStream = {foo: 'bar', stop: function () {}};
    ATT.UserMediaService.stopStream();
    assert.isNull(ATT.UserMediaService.localStream);
    assert.isNull(ATT.UserMediaService.remoteStream);
  });

  it('should mute local stream by setting `enabled` to false', function () {
    var audioTracks = [{ enabled: true}], backupLocalStream = ATT.UserMediaService.localStream;
    ATT.UserMediaService.localStream = {foo: 'bar', getAudioTracks: function () { return audioTracks; }};
    ATT.UserMediaService.muteStream();
    assert.isFalse(ATT.UserMediaService.localStream.getAudioTracks()[0].enabled);
    ATT.UserMediaService.localStream = backupLocalStream;
  });

  it('should unmute local stream by setting `enabled` to true', function () {
    var audioTracks = [{ enabled: true}], backupLocalStream = ATT.UserMediaService.localStream;
    ATT.UserMediaService.localStream = {foo: 'bar', getAudioTracks: function () { return audioTracks; }};
    ATT.UserMediaService.unmuteStream();
    assert.isTrue(ATT.UserMediaService.localStream.getAudioTracks()[0].enabled);
    ATT.UserMediaService.localStream = backupLocalStream;
  });

  it('should hold video stream by setting `enabled` to false', function () {
    // TODO
  });

  it('should resume video stream by setting `enabled` to true', function () {
    // TODO
  });

  afterEach(function () {
    ATT = backupAtt;
  });
});
