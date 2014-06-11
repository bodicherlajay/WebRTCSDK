/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: Runtime - ATT.UserMediaService, ATT.PeerConnectionService, ATT.RTCEvent
//Dependency: ATT.logManager


(function (app) {
  'use strict';

  var errMgr,
    resourceManager,
    userMediaSvc,
    peerConnSvc,
    logger;

  function setupAnswer(sdp, modId) {
    peerConnSvc.setRemoteAndCreateAnswer(sdp, modId);
  }

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
  function cleanPhoneNumber(number) {
    var callable, cleaned;
    //removes the spaces form the number
    callable = number.replace(/\s/g, '');
    callable = ATT.phoneNumber.getCallable(callable);

    if (callable) {
      return callable;
    }
    logger.logWarning('Phone number not callable, will check special numbers list.');
    logger.logInfo('checking number: ' + callable);

    cleaned = ATT.phoneNumber.translate(number);
    console.log('ATT.SpecialNumbers[' + cleaned + '] = ' + cleaned);
    if (number.charAt(0) === '*') {
      cleaned = '*' + cleaned;
    }
    if (ATT.SpecialNumbers[cleaned]) {
      return cleaned;
    }
    ATT.Error.publish('SDK-20027', null, function (error) {
      logger.logWarning('Undefined `onError`: ' + error);
    });
  }

  function formatNumber(number) {
    var callable = cleanPhoneNumber(number);
    if (!callable) {
      logger.logWarning('Phone number not formatable .');
      return;
    }
    logger.logInfo('The formated Number' + callable);
    return ATT.phoneNumber.stringify(callable);
  }

  function answerCall(options) {

    var from = this.from(),
      mediaType = this.getMediaType(),
      mediaConstraints = {
        audio: true,
        video: mediaType === 'video'
      };
    app.utils.extend (options, {
      type: app.CallTypes.INCOMING,
      from: from,
      mediaConstraints: mediaConstraints
    });

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

    // TODO: patch work
    // setup callback for PeerConnectionService.onAnswerSent, will be used to
    // indicate the RINGING state on an outgoing call
    ATT.PeerConnectionService.onAnswerSent = function () {
      logger.logInfo('onAnswerSent...');

      options.onCallAnswered();
    };
  }

  function holdCall() {
    if (ATT.PeerConnectionService.peerConnection) {
      logger.logInfo('Putting call on hold...');
      ATT.PeerConnectionService.holdCall();
    } else {
      logger.logWarning('Hold not possible...');
    }
  }

  function resumeCall() {
    if (ATT.PeerConnectionService.peerConnection) {
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
  * Call end
  * @param {Object} options The phone.js facade options
  */
  function endCall(options) {
    logger.logInfo('Hanging up...');
    ATT.SignalingService.sendEndCall({
      error: function () {
        ATT.Error.publish('SDK-20026', null, options.onError);
        logger.logWarning('Hangup request failed.');
      }
    });
  }

  /**
  * Call Prototype
  * @param {String} from The caller
  * @param {String} to The callee
  * @param {String} mediaConstraints 'audio' or 'video'
  */
  function call(options) {
    var id = options.id,
      from = options.from,
      to = options.to,
      mediaType = options.mediaType,
      mediaConstraints = options.mediaConstraints,
      localSdp = options.localSdp,
      remoteSdp = options.remoteSdp;

    return {
      id: function () { return id; },
      from: function () { return from; },
      to: function () { return to; },
      mediaConstraints: function () { return mediaConstraints; },
      setMediaType: function (type) {
        mediaType = type;
      },
      getMediaType: function () {
        return mediaType;
      },
      setLocalSdp: function (sdp) {
        localSdp = sdp;
      },
      getLocalSdp: function () {
        return localSdp;
      },
      setRemoteSdp: function (sdp) {
        remoteSdp = sdp;
      },
      getRemoteSdp: function () {
        return remoteSdp;
      },
      setupAnswer: setupAnswer,
      answer: answerCall,
      hold: holdCall,
      resume: resumeCall,
      mute: muteCall,
      unmute: unmuteCall,
      end: endCall
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

    var callObj = call({
      id: options.id,
      type: options.type,
      from: cleanPhoneNumber(options.from),
      mediaType: options.mediaType,
      remoteSdp: options.remoteSdp
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
  function createOutgoingCall(options) {
    logger.logDebug('createIncomingCall');

    logger.logInfo('Creating incoming call');
    logger.logInfo('caller: ' + options.from + ', constraints: ' + options.mediaConstraints);

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

    // TODO: patch work
    // setup callback for PeerConnectionService.onOfferSent, will be used to
    // indicate the RINGING state on an outgoing call
    ATT.PeerConnectionService.onOfferSent = function (callId, localSdp) {
      logger.logInfo('onOfferSent... trigger RINGING event for outgoing call');
      var callObj = call({
        id: callId,
        to: options.to,
        type: options.type,
        mediaConstraints: options.mediaConstraints,
        localSdp: localSdp
      });
  
      options.onOutgoingCallCreated(callObj);
    };
  }

  function createCall(options) {
    errMgr = options.errorManager;
    resourceManager = options.resourceManager;
    userMediaSvc = options.userMediaSvc;
    peerConnSvc = options.peerConnSvc;
    logger = resourceManager.getLogger("Call");

    logger.logDebug('createCall');

    if (options.type === app.CallTypes.INCOMING) {
      createIncomingCall(app.utils.extend(options, {
        onIncomingCallCreated: options.onCallCreated
      }));
    } else {
      createOutgoingCall(app.utils.extend(options, {
        onOutgoingCallCreated: options.onCallCreated
      }));
    }
  }

  app.factories.createCall = createCall;
}(ATT || {}));
