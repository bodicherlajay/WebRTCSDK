/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule, PeerConnectionService) {
  "use strict";

  var callManager = cmgmt.CallManager.getInstance(),
    module = {},
    instance,
    callbacks,
    sdp,
    interceptingEventChannelCallback,
    subscribeEvents,
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
    init = function () {
      return {
        hookupEventsToUICallbacks: subscribeEvents
      };
    };

  interceptingEventChannelCallback = function (event) {
    if (!event) {
      return;
    }

    console.log('New Event: ' + JSON.stringify(event));

    // set current event on the session
    callManager.getSessionContext().setEventObject(event);

    // enumerate over RTC EVENTS
    // todo capture time, debugging info for sdk
    switch (event.state) {
    case mainModule.SessionEvents.RTC_SESSION_CREATED:
      onSessionReady({
        type: mainModule.CallStatus.READY,
        data: event.data
      });
      break;

    case mainModule.RTCCallEvents.SESSION_OPEN:
      if (event.sdp) {
        PeerConnectionService.setTheRemoteDescription(event.sdp, 'answer');
      }
      // set callID in the call object
      callManager.getSessionContext().setCurrentCallId(event.resourceURL);
      // call established - trigger 'in progress' event
      onInProgress({
        type: mainModule.CallStatus.INPROGRESS
      });
      break;

    case mainModule.RTCCallEvents.MODIFICATION_RECEIVED:
      if (event.sdp) {
        sdp = event.sdp;
      }

      if (sdp && event.modId) {
        PeerConnectionService.modificationId = event.modId;
        PeerConnectionService.setTheRemoteDescription(event.sdp, 'offer');
        PeerConnectionService.peerConnection.createAnswer(PeerConnectionService.setLocalAndSendMessage.bind(PeerConnectionService), function () {
          console.log('Create Answer Failed...');
        }, {'mandatory': {
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true
        }});

        // hold event - for hold initiated party
        if (sdp && sdp.indexOf('recvonly') !== -1) {
          onCallHold({
            type: mainModule.CallStatus.HOLD
          });
          callManager.getSessionContext().setCallState(callManager.SessionState.HOLD_CALL);
          callManager.getSessionContext().getCallObject().mute();
        }

        // resume event - for hold initiated party
        if (sdp && sdp.indexOf('sendrecv') !== -1
            && callManager.getSessionContext().getCallState() === callManager.SessionState.HOLD_CALL) {
          onCallResume({
            type: mainModule.CallStatus.RESUMED
          });
          callManager.getSessionContext().setCallState(callManager.SessionState.RESUMED_CALL);
          callManager.getSessionContext().getCallObject().unmute();
        }
      }
      break;

    case mainModule.RTCCallEvents.MODIFICATION_TERMINATED:
      if (event.sdp) {
        sdp = event.sdp;
      }

      if (event.modId && event.reason === 'success') {
        PeerConnectionService.modificationId = event.modId;
      }

      // hold event - for hold initiator
      if ((sdp && sdp.indexOf('recvonly') !== -1) || (sdp && sdp.indexOf('sendonly') !== -1)) {
        onCallHold({
          type: mainModule.CallStatus.HOLD
        });
        callManager.getSessionContext().setCallState(callManager.SessionState.HOLD_CALL);
        callManager.getSessionContext().getCallObject().mute();
      }

      // resume event - for resume initiator
      if (sdp && sdp.indexOf('sendrecv') !== -1
          && callManager.getSessionContext().getCallState() === callManager.SessionState.HOLD_CALL) {
        onCallResume({
          type: mainModule.CallStatus.RESUMED
        });
        callManager.getSessionContext().setCallState(callManager.SessionState.RESUMED_CALL);
        callManager.getSessionContext().getCallObject().unmute();
      }
      break;

    case mainModule.RTCCallEvents.INVITATION_SENT:
      onOutgoingCall({
        type: mainModule.CallStatus.CALLING,
        callee: callManager.getSessionContext().getCallObject().callee()
      });
      break;

    case mainModule.RTCCallEvents.INVITATION_RECEIVED:
      if (event.sdp && event.sdp.indexOf('sendonly') !== -1) {
        event.sdp = event.sdp.replace(/sendonly/g, 'sendrecv');
      }

      PeerConnectionService.createPeerConnection();
      PeerConnectionService.setTheRemoteDescription(event.sdp, 'offer');
      //todo: switch constaints to dynamic
      PeerConnectionService.peerConnection.createAnswer(PeerConnectionService.setLocalAndSendMessage.bind(PeerConnectionService), function () {
        console.log('Create offer failed');
      }, {'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
      }});
      onIncomingCall({
        type: mainModule.CallStatus.RINGING,
        caller: event.from
      });
      break;

    case mainModule.RTCCallEvents.SESSION_TERMINATED:
      if (event.reason) {
        onCallError({ type: mainModule.CallStatus.ERROR, reason: event.reason });
      } else {
        onCallEnded({ type: mainModule.CallStatus.ENDED });
      }
      // this makes sure peer conn is null to prevent bad hangup request from callee
      // after session is already terminated
      if (ATT.PeerConnectionService.peerConnection) {
        ATT.PeerConnectionService.peerConnection = null;
      }
      break;

    case mainModule.RTCCallEvents.MUTED:
      onCallMute({
        type: mainModule.CallStatus.MUTED
      });
      break;

    case mainModule.RTCCallEvents.UNMUTED:
      onCallUnmute({
        type: mainModule.CallStatus.UNMUTED
      });
      break;

    case mainModule.RTCCallEvents.UNKNOWN:
      onCallError({ type: mainModule.CallStatus.ERROR });
      break;
    }
  };

  subscribeEvents = function () {
    // set callbacks after session is created and we are ready to subscribe to events
    callbacks = callManager.getSessionContext().getUICallbacks();

    var sessionId = callManager.getSessionContext().getSessionId();

    // unsubscribe first, to avoid double subscription from previous actions
    mainModule.event.unsubscribe(sessionId + '.responseEvent', interceptingEventChannelCallback);
    // subscribe to hook up callbacks to events
    mainModule.event.subscribe(sessionId + '.responseEvent', interceptingEventChannelCallback);
    console.log('Subscribed to events');
  };

  onSessionReady = function (evt) {
    if (callbacks.onSessionReady) {
      callbacks.onSessionReady(evt);
    }
  };

  onIncomingCall = function (evt) {
    if (callbacks.onIncomingCall) {
      callbacks.onIncomingCall(evt);
    }
  };

  onOutgoingCall = function (evt) {
    if (callbacks.onOutgoingCall) {
      callbacks.onOutgoingCall(evt);
    }
  };

  onInProgress = function (evt) {
    if (callbacks.onInProgress) {
      callbacks.onInProgress(evt);
    }
  };

  onCallHold = function (evt) {
    if (callbacks.onCallHold) {
      callbacks.onCallHold(evt);
    }
  };

  onCallResume = function (evt) {
    if (callbacks.onCallResume) {
      callbacks.onCallResume(evt);
    }
  };

  onCallMute = function (evt) {
    if (callbacks.onCallMute) {
      callbacks.onCallMute(evt);
    }
  };

  onCallUnmute = function (evt) {
    if (callbacks.onCallUnmute) {
      callbacks.onCallUnmute(evt);
    }
  };

  onCallError = function (evt) {
    if (callbacks.onCallError) {
      callbacks.onCallError(evt);
    }
  };

  onCallEnded = function (evt) {
    if (callbacks.onCallEnded) {
      callbacks.onCallEnded(evt);
    }
  };

  onCallError = function (evt) {
    if (callbacks.onCallError) {
      callbacks.onCallError(evt);
    }
  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  mainModule.RTCEvent = module;
}(ATT || {}, ATT.PeerConnectionService));