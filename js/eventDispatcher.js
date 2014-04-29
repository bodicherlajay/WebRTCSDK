/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

"use strict";

var EventDispatcher = function (settings) {
  this.mainModule = settings.mainModule;
  this.callbacks = settings.callbacks;
  this.PeerConnectionService = settings.peerConnectionSvc;
  this.callManager = settings.callManager;
};

EventDispatcher.prototype = (function () {
  var callManager = this.CallManager.getInstance(),
    sdp,
    kaller,
    onSessionReady,
    onIncomingCall,
    onOutgoingCall,
    onInProgress,
    onCallHold,
    onCallResume,
    onCallMute,
    onCallUnmute,
    onCallEnded,
    onCallError,
    api = {};

  api.login = function () {
  };

  api[this.mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
    if (event.reason) {
      onCallError({ type: this.mainModule.CallStatus.ERROR, reason: event.reason });
    } else {
      onCallEnded({ type: this.mainModule.CallStatus.ENDED });
    }
    // this makes sure peer conn is null to prevent bad hangup request from callee
    // after session is already terminated
    if (this.PeerConnectionService.peerConnection) {
      this.PeerConnectionService.peerConnection = null;
    }
  };

  api[this.mainModule.RTCCallEvents.INVITATION_RECEIVED] = function (event) {
    if (event.sdp && event.sdp.indexOf('sendonly') !== -1) {
      event.sdp = event.sdp.replace(/sendonly/g, 'sendrecv');
    }
  };

  api[this.mainModule.SessionEvents.RTC_SESSION_CREATED] = function (event) {
    onSessionReady({
      type: this.mainModule.CallStatus.READY,
      data: event.data
    });

    this.PeerConnectionService.createPeerConnection();
    this.PeerConnectionService.setTheRemoteDescription(event.sdp, 'offer');
    this.PeerConnectionService.peerConnection.createAnswer(this.PeerConnectionService.setLocalAndSendMessage.
      bind(this.PeerConnectionService), function () {
        console.log('Create offer failed');
      }, {'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
      }});
    onIncomingCall({
      type: this.mainModule.CallStatus.RINGING,
      caller: event.from
    });
  };

  api[this.mainModule.SessionEvents.RTC_SESSION_CREATE] = function (event) {
    onSessionReady({
      type: this.mainModule.CallStatus.READY,
      data: event.data
    });
  };

  api[this.mainModule.RTCCallEvents.SESSION_OPEN] = function (event) {
    if (event.sdp) {
      this.PeerConnectionService.setTheRemoteDescription(event.sdp, 'answer');
    }
    // set callID in the call object
    callManager.getSessionContext().setCurrentCallId(event.resourceURL);
    // call established
    var time = new Date().getTime();
    onInProgress({
      type: this.mainModule.CallStatus.INPROGRESS,
      timestamp: time
    });
  };

  api[this.mainModule.RTCCallEvents.MODIFICATION_RECEIVED] = function (event) {
    if (event.sdp) {
      sdp = event.sdp;
    }

    if (sdp && event.modId) {
      this.PeerConnectionService.modificationId = event.modId;
      this.PeerConnectionService.setTheRemoteDescription(event.sdp, 'offer');
      this.PeerConnectionService.peerConnection.createAnswer(this.PeerConnectionService.setLocalAndSendMessage.
        bind(this.PeerConnectionService), function () {
          console.log('Create Answer Failed...');
        }, {'mandatory': {
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true
        }});

      // hold event
      if (sdp && sdp.indexOf('sendonly') !== -1) {
        onCallHold({
          type: this.mainModule.CallStatus.HOLD
        });
        this.callManager.getSessionContext().setCallState(this.callManager.SessionState.HOLD_CALL);
        this.callManager.getSessionContext().getCallObject().mute();
      }

      // resume event - for resume initiator
      if (sdp && sdp.indexOf('sendrecv') !== -1 && sdp.indexOf('recvonly') !== -1) {
        onCallResume({
          type: this.mainModule.CallStatus.RESUMED
        });
        callManager.getSessionContext().setCallState(callManager.SessionState.RESUMED_CALL);
        callManager.getSessionContext().getCallObject().unmute();
      }
    }
  };

  api[this.mainModule.RTCCallEvents.MODIFICATION_TERMINATED] = function (event) {
    if (event.sdp) {
      sdp = event.sdp;
    }

    if (event.modId && event.reason === 'success') {
      this.PeerConnectionService.modificationId = event.modId;
    }

    // hold event - for hold initiator
    if (sdp && sdp.indexOf('sendonly') !== -1) {
      onCallHold({
        type: this.mainModule.CallStatus.HOLD
      });
      this.callManager.getSessionContext().setCallState(this.callManager.SessionState.HOLD_CALL);
      this.callManager.getSessionContext().getCallObject().mute();
    }

    // resume event - for resume initiator
    if (sdp && sdp.indexOf('sendrecv') !== -1 && sdp.indexOf('recvonly') !== -1) {
      onCallResume({
        type: this.mainModule.CallStatus.RESUMED
      });
      this.callManager.getSessionContext().setCallState(this.callManager.SessionState.RESUMED_CALL);
      this.callManager.getSessionContext().getCallObject().unmute();
    }
    // parse the phone number
    kaller = event.from.split('@')[0].split(':')[1];
  };

  onIncomingCall({
    type: this.mainModule.CallStatus.RINGING,
    caller: kaller
  });

  api[this.mainModule.RTCCallEvents.INVITATION_SENT] = function () {
    onOutgoingCall({
      type: this.mainModule.CallStatus.CALLING,
      callee: this.callManager.getSessionContext().getCallObject().callee()
    });
  };

  api[this.mainModule.RTCCallEvents.INVITATION_RECEIVED] = function (event) {
    if (event.sdp && event.sdp.indexOf('sendonly') !== -1) {
      event.sdp = event.sdp.replace(/sendonly/g, 'sendrecv');
    }

    this.PeerConnectionService.createPeerConnection();
    this.PeerConnectionService.setTheRemoteDescription(event.sdp, 'offer');
    this.PeerConnectionService.peerConnection.createAnswer(this.PeerConnectionService.setLocalAndSendMessage.
      bind(this.PeerConnectionService), function () {
        console.log('Create offer failed');
      }, {'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
      }});
  };

  api[this.mainModule.RTCCallEvents.SESSION_TERMINATED] = function (event) {
    if (event.reason) {
      onCallError({ type: this.mainModule.CallStatus.ERROR, reason: event.reason });
    } else {
      onCallEnded({ type: this.mainModule.CallStatus.ENDED });
    }
    // this makes sure peer conn is null to prevent bad hangup request from callee
    // after session is already terminated
    if (this.PeerConnectionService.peerConnection) {
      this.PeerConnectionService.peerConnection = null;
    }
  };

  api[this.mainModule.RTCCallEvents.MUTED] = function () {
    onCallMute({
      type: this.mainModule.CallStatus.MUTED
    });
  };

  api[this.mainModule.RTCCallEvents.UNMUTED] = function () {
    onCallUnmute({
      type: this.mainModule.CallStatus.UNMUTED
    });
  };

  api[this.mainModule.RTCCallEvents.UNKNOWN] = function () {
    onCallError({ type: this.mainModule.CallStatus.ERROR });
  };

  onSessionReady = function (evt) {
    if (this.callbacks.onSessionReady) {
      this.callbacks.onSessionReady(evt);
    }
  };

  onIncomingCall = function (evt) {
    if (this.callbacks.onIncomingCall) {
      this.callbacks.onIncomingCall(evt);
    }
  };

  onOutgoingCall = function (evt) {
    if (this.callbacks.onOutgoingCall) {
      this.callbacks.onOutgoingCall(evt);
    }
  };

  onInProgress = function (evt) {
    if (this.callbacks.onInProgress) {
      this.callbacks.onInProgress(evt);
    }
  };

  onCallHold = function (evt) {
    if (this.callbacks.onCallHold) {
      this.callbacks.onCallHold(evt);
    }
  };

  onCallResume = function (evt) {
    if (this.callbacks.onCallResume) {
      this.callbacks.onCallResume(evt);
    }
  };

  onCallMute = function (evt) {
    if (this.callbacks.onCallMute) {
      this.callbacks.onCallMute(evt);
    }
  };

  onCallUnmute = function (evt) {
    if (this.callbacks.onCallUnmute) {
      this.callbacks.onCallUnmute(evt);
    }
  };

  onCallError = function (evt) {
    if (this.callbacks.onCallError) {
      this.callbacks.onCallError(evt);
    }
  };

  onCallEnded = function (evt) {
    if (this.callbacks.onCallEnded) {
      this.callbacks.onCallEnded(evt);
    }
  };

  onCallError = function (evt) {
    if (this.callbacks.onCallError) {
      this.callbacks.onCallError(evt);
    }
  };

  return EventDispatcher;
}());
