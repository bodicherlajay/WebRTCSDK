/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: Runtime - ATT.UserMediaService, ATT.PeerConnectionService, ATT.RTCEvent
//Dependency: ATT.logManager


cmgmt = (function () {
  'use strict';

  var module = {},
    instance,
    init,
    logger = Env.resourceManager.getInstance().getLogger("CallManagementModule"),
    Call,
    SessionState,
    SessionContext,
    session_context,
    CreateSession,
    UpdateSession,
    DeleteSession,
    CreateOutgoingCall,
    CreateIncomingCall,
    DeleteCallObject;


  function formatNumber(number) {
    var callable = ATT.rtc.Phone.cleanPhoneNumber(number);
    if (!callable) {
      logger.logWarning('Phone number not formatable .');
      return;
    }
    logger.logInfo('The formated Number' + callable);
    return ATT.phoneNumber.stringify(callable);
  }
  /**
   *  Removes extra characters from the phone number and formats it for
   *  clear display
   */
  function cleanPhoneNumber(number) {
    var callable;
    //removes the spaces form the number
    callable = ATT.phoneNumber.getCallable(number.replace(/\s/g, ''));

    if (!callable) {
      logger.logWarning('Phone number not callable.');
      return;
    }

    logger.logInfo('checking number: ' + callable);

    if (callable.length < 10) {

      if (number.charAt(0) === '*') {
        callable = '*' + callable;
      }

      if (!ATT.SpecialNumbers[callable]) {
        ATT.Error.publish('SDK-20027', null, function (error) {
          logger.logWarning('Undefined `onError`: ' + error);
        });
        return;
      }
    }

    logger.logWarning('found number in special numbers list');

    return callable;
  }

  //userMediaService,
    //peerConnectionService,
    //rtcEventModule

  /**
  * Call Prototype
  * @param {String} to The caller
  * @param {String} to The callee
  * @param {String} media 'audio' or 'video'
  */
  Call = function (from, to, media) {
    var caller = from, callee = to, mediaType = media, localSDP = null;
    logger.logTrace('call method started, from: ' + from + ', to: ' + to + ', media type: ' + media);

    return {
      caller: function () { return caller; },
      callee: function () { return callee; },
      mediaType: function () { return mediaType; },
      setSDP: function (sdp) {
        localSDP = sdp;
      },
      getSDP: function () {
        return localSDP;
      },
      hold: Call.hold,
      resume: Call.resume,
      mute: Call.mute,
      unmute: Call.unmute,
      end: Call.hangup
    };
  };
  //Session state enumeration
  SessionState = {
    OUTGOING_CALL : 'Outgoing',
    INCOMING_CALL : 'Incoming',
    MOVE_CALL : 'Move Call',
    HOLD_CALL : 'Hold Call',
    RESUMED_CALL : 'Resumed call',
    TRANSFER_CALL : 'Transfer Call',
    ENDED_CALL : 'Ended Call',
    READY: 'Ready', //Ready to accept Outgoing or Incoming call
    SDK_READY: 'SDK Ready'
  };

  /**
  * Session Context Prototype
  * @param {String} token The access token
  * @param {String} e9Id The e911Id
  * @param {String} sessionId The sessionId
  * @param {String} state 'Incoming' or 'Outgoing'
  */
  SessionContext = function (token, e9Id, sessionId, state) {
    var currState = state, callObject = null, event = null, accessToken = token, e911Id = e9Id, currSessionId = sessionId,
      currentCallId, UICbks = {}, mediaType = null, currentCall = null;
    return {
      getCurrentCall: function () {
        return currentCall;
      },
      setCurrentCall: function (callObj) {
        currentCall = callObj;
      },
      getAccessToken: function () {
        return accessToken;
      },
      setAccessToken: function (token) {
        accessToken = token;
      },
      getE911Id: function () {
        return e911Id;
      },
      setE911Id: function (id) {
        e911Id = id;
      },
      getSessionId: function () {
        return currSessionId;
      },
      setSessionId: function (id) {
        currSessionId = id;
      },
      getCallState: function () {
        return currState;
      },
      setCallState: function (state) {
        currState = state;
      },
      getCallObject: function () {
        return callObject;
      },
      setCallObject: function (callObj) {
        callObject = callObj;
      },
      getEventObject: function () {
        return event;
      },
      setEventObject: function (eventObject) {
        event = eventObject;
      },
      setUICallbacks: function (callbacks) {
        UICbks = ATT.utils.extend(UICbks, callbacks);
      },
      getUICallbacks: function () {
        return UICbks;
      },
      setCurrentCallId: function (callId) {
        currentCallId = callId;
      },
      getCurrentCallId: function () {
        return currentCallId;
      },
      getMediaType: function () {
        return mediaType;
      },
      setMediaType: function (mediatype) {
        mediaType = mediatype;
      }
    };
  };

  /**
  * Sets various call-related variables on the session-context
  * @param {Object} call The call instance
  * @param {String} 'Incoming' or 'Outgoing'
  * @param {Object} uiCallbacks The UI callbacks
  */
  function updateCallSession(call, callState, uiCallbacks) {
    session_context.setCallObject(call);
    session_context.setCallState(callState);
    session_context.setUICallbacks(uiCallbacks);
  }

  /**
  * Create a new Session Context
  * @param {Object} config The configuration
  * callmgr.CreateSession({
  *   token: 'abcd'
  *   e911Id: 'e911Id'
  *   sessionId: 'sessionId'
  * })
  */
  CreateSession = function (config) {
    session_context = new SessionContext(config.token, config.e911Id, config.sessionId, SessionState.READY);
    logger.logTrace('creating session with token: ' + config.token);
    session_context.setCallState(SessionState.SDK_READY);
  };

  /**
  * Update the session context
  * @param {Object} config Session context variables
  */
  UpdateSession = function (config) {
    if (config.sessionId) {
      session_context.setSessionId(config.sessionId);
    }
    if (config.callbacks) {
      session_context.setUICallbacks(config.callbacks);

      // setting up event callbacks using RTC Events
      logger.logInfo('Hooking up event callbacks');
      ATT.RTCEvent.getInstance().setupEventBasedCallbacks();
    }
  };

  //Cleanup session after logout
  DeleteSession = function () {
    session_context = null;
  };

  /**
  * Create an Outgoing Call
  * @param {Object} config The configuration
  * callmgr.CreateOutgoingCall({
  *   to: '1-800-foo-bar,
  *   mediaConstraints: {audio: true, video: true}
  * })
  */
  CreateOutgoingCall = function (config) {
    logger.logDebug('CreateOutgoingCall');

    logger.logInfo('Creating outgoing call');

    var call = new Call(null, config.to, config.mediaConstraints),
      that = this;

    // set call and callbacks in current session
    logger.logInfo('Updating current session for outgoing call');
    updateCallSession(call, SessionState.OUTGOING_CALL, config.callbacks);

    // setting up event callbacks using RTC Events
    logger.logInfo('Hooking up event callbacks');
    ATT.RTCEvent.getInstance().setupEventBasedCallbacks();

    // Here, we publish `onConnecting`
    // event for the UI
    ATT.event.publish(session_context.getSessionId() + '.responseEvent', {
      state : ATT.RTCCallEvents.CALL_CONNECTING
    });

    // setup callback for PeerConnectionService.onOfferSent, will be used to
    // indicate the RINGING state on an outgoing call
    ATT.PeerConnectionService.onOfferSent = function () {
      logger.logInfo('onOfferSent... trigger RINGING event for outgoing call');
      if (undefined !== that.onCallCreated
          && null !== that.onCallCreated
          && 'function' === typeof that.onCallCreated) {
        that.onCallCreated();
      }
    };

    ATT.UserMediaService.startCall(config);
  };

  /**
  * Create an Incoming Call
  * @param {Object} config The configuration
  * callmgr.CreateIncomingCall({
  *   mediaConstraints: {audio: true, video: true}
  * })
  */
  CreateIncomingCall = function (config) {
    logger.logDebug('CreateIncomingCall');

    logger.logInfo('Creating incoming call');
    var event = session_context.getEventObject(),
      call = new Call(event.caller, null, config.mediaConstraints);

    // set call and callbacks in current session
    logger.logInfo('Updating current session for incoming call');
    updateCallSession(call, SessionState.INCOMING_CALL, config.callbacks);

    // setting up event callbacks using RTC Events
    logger.logInfo('Hooking up event callbacks');
    ATT.RTCEvent.getInstance().setupEventBasedCallbacks();

    logger.logInfo('caller: ' + event.caller + ', constraints: ' + config.mediaConstraints);

    ATT.UserMediaService.startCall(config);
  };

  // call object cleanup
  DeleteCallObject = function () {
    session_context.setCallObject(null);
  };

  init = function () {
    //public interface for call manager
    logger.logDebug('call management module init');
    return {
      getSessionContext: function () {
        return session_context;
      },
      SessionState: SessionState,
      CreateSession: CreateSession,
      UpdateSession: UpdateSession,
      DeleteSession: DeleteSession,
      CreateOutgoingCall: CreateOutgoingCall,
      CreateIncomingCall: CreateIncomingCall,
      DeleteCallObject: DeleteCallObject,
      cleanPhoneNumber: cleanPhoneNumber,
      formatNumber: formatNumber
    };
  };

  Call.hold = function () {
    if (ATT.PeerConnectionService.peerConnection) {
      logger.logInfo('Putting call on hold...');
      ATT.PeerConnectionService.holdCall();
    } else {
      logger.logWarning('Hold not possible...');
    }
  };

  Call.resume = function () {
    if (ATT.PeerConnectionService.peerConnection) {
      logger.logInfo('Resuming call...');
      ATT.PeerConnectionService.resumeCall();
    } else {
      logger.logWarning('Resume not possible...');
    }
  };

  Call.mute = function () {
    logger.logInfo('putting call on mute');
    ATT.UserMediaService.muteStream();
  };

  Call.unmute = function () {
    logger.logInfo('unmuting call');
    ATT.UserMediaService.unmuteStream();
  };

  /**
  * Call hangup
  * @param {Object} options The phone.js facade options
  */
  Call.hangup = function (options) {
    logger.logInfo('Hanging up...');
    ATT.SignalingService.sendEndCall({
      error: function () {
        ATT.Error.publish('SDK-20026', null, options.onError);
        logger.logWarning('Hangup request failed.');
      }
    });
  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  return {
    CallManager : module
  };
}());
