/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: Runtime - ATT.UserMediaService, ATT.PeerConnectionService, ATT.RTCEvent
//Dependency: ATT.logManager


cmgmt = (function () {
  'use strict';

  var errMgr,
    resourceManager,
    userMediaSvc,
    peerConnectionSvc,
    logger = Env.resourceManager.getInstance().getLogger("Call");

  function handleError(operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);

    logger.logInfo('There was an error performing operation ' + operation);

    var error = errMgr.create(err, operation);

    if (typeof errHandler === 'function') {
      errHandler(error);
    }
  }

  /**
   *  Removes extra characters from the phone number and formats it for
   *  clear display
   */
  cleanPhoneNumber = function (number, options) {
    var cleaned = ATT.phoneNumber.stringify(number);

    logger.logInfo('Cleaned phone number: ' + cleaned + ', callable: ' +
      ATT.phoneNumber.getCallable(cleaned));

    if (!ATT.phoneNumber.getCallable(cleaned)) {
      logger.logWarning('Phone number not callable.');
      if (number.charAt(0) === '*') {
        cleaned = '*' + cleaned;
      }
      logger.logWarning('checking number: ' + cleaned);
      if (!ATT.SpecialNumbers[cleaned]) {
        ATT.Error.publish('SDK-20027', null, options.onError);
      } else {
        logger.logWarning('found number in special numbers list');
      }
    }
    return cleaned;
  };

  function holdCall() {
    if (ATT.PeerConnectionService.peerConnection
        && session_context.getCallObject()) {
      logger.logInfo('Putting call on hold...');
      ATT.PeerConnectionService.holdCall();
    } else {
      logger.logWarning('Hold not possible...');
    }
  }

  function resumeCall() {
    if (ATT.PeerConnectionService.peerConnection
        && session_context.getCallObject()) {
      logger.logInfo('Resuming call...');
      ATT.PeerConnectionService.resumeCall();
    } else {
      logger.logWarning('Resume not possible...');
    }
  }

  function muteCall() {
    logger.logInfo('putting call on mute');
    ATT.UserMediaService.muteStream();
  }

  function unmuteCall() {
    logger.logInfo('unmuting call');
    ATT.UserMediaService.unmuteStream();
  }

  /**
  * Call hangup
  * @param {Object} options The phone.js facade options
  */
  function hangupCall(options) {
    logger.logInfo('Hanging up...');
    ATT.SignalingService.sendEndCall({
      error: function () {
        ATT.Error.publish('SDK-20026', null, options.onError);
        logger.logWarning('Hangup request failed.');
      }
    });
  }

  // call object cleanup
  function deleteCall() {
    session_context.setCallObject(null);
  };

  /**
  * Call Prototype
  * @param {String} from The caller
  * @param {String} to The callee
  * @param {String} mediaConstraints 'audio' or 'video'
  */
  function call (options) {
    var from = options.from,
      to = options.to,
      mediaConstraints = options.mediaConstraints,
      localSDP = options.localSDP;

    return {
      from: function () { return from; },
      to: function () { return to; },
      mediaConstraints: function () { return mediaConstraints; },
      setSDP: function (sdp) {
        localSDP = sdp;
      },
      getSDP: function () {
        return localSDP;
      },
      hold: holdCall,
      resume: resumeCall,
      mute: muteCall,
      unmute: unmuteCall,
      end: hangupCall,
      delete: deleteCall
    };
  }

  /**
  * Create an Incoming Call
  * @param {Object} config The configuration
  * callmgr.CreateIncomingCall({
  *   mediaConstraints: {audio: true, video: true}
  * })
  */
  function createIncomingCall(options) {
    logger.logDebug('createIncomingCall');

    logger.logInfo('Creating incoming call');
    logger.logInfo('caller: ' + options.from + ', constraints: ' + options.mediaConstraints);

    userMediaSvc.startCall(app.utils.extend(options, {
      // enable this code once startCall returns callbacks
      // onCallStarted: function(obj) {
        // var callObj = call({
          // from: option.from,
          // type: app.CallTypes.INCOMING,
          // mediaConstraints: options.mediaConstraints
        // });
// 
        // logger.logInfo('Incoming call created successfully');
        // options.onIncomingCallCreated(callObj);
      // },
      // onCallError: handleError.bind(this, 'CreateIncomingCall', options.onError)
    }));
    
    var callObj = call({
      from: option.from,
      type: app.CallTypes.INCOMING,
      mediaConstraints: options.mediaConstraints
    });
    
    options.onIncomingCallCreated(callObj);
  }

  /**
  * Create an Outgoing Call
  * @param {Object} config The configuration
  * callmgr.CreateOutgoingCall({
  *   to: '1-800-foo-bar,
  *   mediaConstraints: {audio: true, video: true}
  * })
  */
  function createOutgoingCall(config) {
    logger.logDebug('createIncomingCall');

    logger.logInfo('Creating incoming call');
    logger.logInfo('caller: ' + options.from + ', constraints: ' + options.mediaConstraints);

    options.to = cleanPhoneNumber(options.to);

    userMediaSvc.startCall(app.utils.extend(options, {
      // enable this code once startCall returns callbacks
      // onCallStarted: function(obj) {
        // var callObj = call({
          // to: options.to,
          // type: app.CallTypes.OUTGOING,
          // mediaConstraints: options.mediaConstraints
        // });
// 
        // logger.logInfo('Incoming call created successfully');
        // options.onOutgoingCallCreated(callObj);
      // },
      // onCallError: handleError.bind(this, 'CreateIncomingCall', options.onError)
    }));
    
    var callObj = call({
      to: options.to,
      type: app.CallTypes.OUTGOING,
      mediaConstraints: options.mediaConstraints
    });
    
    options.onOutgoingCallCreated(callObj);

    // Here, we publish `onConnecting`
    // event for the UI
    ATT.event.publish(session_context.getSessionId() + '.responseEvent', {
      state : ATT.RTCCallEvents.CALL_CONNECTING
    });
  }

  function createCall(options) {
    logger.logDebug('createCall');

    errMgr = options.errorManager;
    resourceManager = options.resourceManager;
    userMediaSvc = options.userMediaSvc;
    peerConnectionSvc = options.peerConnSvc;

    if (options.type === app.CallTypes.INCOMING) {
      createIncomingCall(options);
    } else {
      createOutgoingCall(options);
    }
  }

  app.factories.createCall = createCall;
}(ATT || {}));
