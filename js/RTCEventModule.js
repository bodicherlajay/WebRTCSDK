/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env: true, cmgmt: true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";

  var callManager = cmgmt.CallManager.getInstance(),
    module = {},
    instance,
    callbacks,
    interceptingEventChannelCallback,
    subscribeEvents,
    onSessionReady,
    onIncomingCall,
    onOutgoingCall,
    onInProgress,
    onCallEnded,
    onCallError,
    eventObj,
    init = function () {
      return {
        hookupEventsToUICallbacks: subscribeEvents
      };
    };

  interceptingEventChannelCallback = function (event) {
    if (!event || JSON.stringify(eventObj) === JSON.stringify(event)) {
      return;
    }

    eventObj = event;

    console.log('Incoming Event : ' + JSON.stringify(event));

    //Check if invite is an announcement
    if (event.sdp && event.sdp.indexOf("sendonly") !== -1) {
      event.sdp = event.sdp.replace(/sendonly/g, "sendrecv");
    }

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
        ATT.PeerConnectionService.setRemoteAndCreateAnswer(event.sdp);
      }
      // set callID to use for hangup()
      callManager.getSessionContext().setCurrentCallId(event.resourceURL);
      onInProgress({
        type: mainModule.CallStatus.INPROGRESS
      });
      break;

    case mainModule.RTCCallEvents.MODIFICATION_RECEIVED:
      if (event.sdp && event.modId) {
        ATT.PeerConnectionService.setRemoteAndCreateAnswer(event.sdp, event.modId);
        onInProgress({
          type: mainModule.CallStatus.INPROGRESS,
          callee: callManager.getSessionContext().getCallObject().callee()
        });
      }
      break;

    case mainModule.RTCCallEvents.INVITATION_SENT:
      onOutgoingCall({
        type: mainModule.CallStatus.CALLING,
        callee: callManager.getSessionContext().getCallObject().callee()
      });
      break;

    case mainModule.RTCCallEvents.INVITATION_RECEIVED:
      onIncomingCall({ type: mainModule.CallStatus.RINGING, caller: event.from });
      break;

    case mainModule.RTCCallEvents.SESSION_TERMINATED:
      if (event.reason) {
        onCallError({ type: mainModule.CallStatus.ERROR, reason: event.reason });
      } else {
        onCallEnded({ type: mainModule.CallStatus.ENDED });
      }
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
    mainModule.event.unsubscribe(sessionId + '.responseEvent');
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
}(ATT || {}));