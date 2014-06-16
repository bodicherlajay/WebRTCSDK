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
    logger,
    eventEmitter = ATT.event;

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

  function handleCallMediaModifications(event, data) {
    peerConnSvc.setRemoteAndCreateAnswer(data.sdp, data.modId);
    if (event.state === app.CallStatus.HOLD) {
      userMediaSvc.muteStream();
    } else if (event.state === app.CallStatus.RESUMED) {
      userMediaSvc.unmuteStream();
    }
  }

  function handleCallMediaTerminations(event, data) {
    if (data.modId) {
      peerConnSvc.setModificationId(data.modId);
    }
    if (data.sdp) {
      peerConnSvc.setTheRemoteDescription(data.sdp, 'answer');
    }
    if (event.state === app.CallStatus.HOLD) {
      userMediaSvc.holdVideoStream();
      userMediaSvc.muteStream();
    } else if (event.state === app.CallStatus.RESUMED) {
      userMediaSvc.resumeVideoStream();
      userMediaSvc.unmuteStream();
    }
  }

  function handleCallOpen(data) {
    if (data.sdp) {
      peerConnSvc.setTheRemoteDescription(data.sdp, 'answer');
    }
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

    userMediaSvc.getUserMedia(app.utils.extend(options, {
      onUserMedia: function(userMedia) {
        app.utils.extend(options, userMedia);
        peerConnSvc.initPeerConnection(options);
      },
      onError: handleError.bind(this, 'AnswerCall', options.onError)
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
    peerConnSvc.holdCall();
  }

  function resumeCall() {
    peerConnSvc.resumeCall();
  }

  function muteCall() {
    logger.logInfo('putting call on mute');
    userMediaSvc.muteStream();
  }

  function unmuteCall() {
    logger.logInfo('unmuting call');
    userMediaSvc.unmuteStream();
  }

  /**
  * Call end
  * @param {Object} options The phone.js facade options
  */
  function endCall(options) {
    logger.logInfo('Hanging up...');
    ATT.SignalingService.sendEndCall(ATT.utils.extend(options, {
      success: function  () {
        options.onCallEnded();
      },
      error: function () {
        ATT.Error.publish('SDK-20026', null, options.onError);
      }
    }));
  }

  /**
   * Call cancel
   * @param {Object} options The options
   */
  function cancelCall(session) {
    logger.logInfo('Canceling up...');
    ATT.SignalingService.sendCancelCall({
      success: function () {
       session.deleteCall(session.getCurrentCall().id());
      },
      error: function () {
        ATT.Error.publish('SDK-20034', null, session.onError);
        logger.logWarning('Cancel request failed.');
      },
      session: session
    });
  }

  /**
   * Call reject
   * @param {Object} options The options
   */
  function rejectCall(session) {
    logger.logInfo('Rejecting call...');
    ATT.SignalingService.sendRejectCall({
      success: function () {
        session.deleteCall(session.getCurrentCall().id());
      },
      error: function () {
        ATT.Error.publish('SDK-20035', null, options.onError);
        logger.logWarning('Reject request failed.');
      },
      session: session
    });
  }

  function on(event, handler) {

    if ('connecting' !== event &&
      'calling' !== event &&
      'established' !== event &&
      'disconnecting' !== event &&
      'disconnected' !== event ) {
      throw new Error('Event not defined');
    }

    ATT.event.unsubscribe(event, handler);
    ATT.event.subscribe(event, handler, this);
  }

  function connect() {
    ATT.event.publish('connecting');
  }

  function disconnect() {
    ATT.event.publish('disconnecting');
  }

  function setId(callId) {
    this.id  = callId;
    if (this.id === null) {
      ATT.event.publish('disconnected');
    } else {
      ATT.event.publish('calling');
    }
  }

  function setRemoteSdp(remoteSdp) {
    this.remoteSdp = remoteSdp;
    ATT.event.publish('established');
  }
  /**
  * Call Prototype
  * @param {String} from The caller
  * @param {String} to The callee
  * @param {String} mediaConstraints 'audio' or 'video'
  */
  function Call(options) {
    if (!options) {
      throw 'No input provided';
    }
    if (!options.peer) {
      throw 'No peer provided';
    }
    if (!options.mediaType) {
      throw 'No mediaType provided';
    }

    this.id = options.id;
    this.peer = options.peer;
    this.mediaType = options.mediaType;
    this.localSdp = null;
    this.remoteSdp = null;

    this.on = on.bind(this);
    this.connect = connect.bind(this);
    this.disconnect = disconnect.bind(this);
    this.setId = setId.bind(this);
    this.setRemoteSdp = setRemoteSdp.bind(this);
    this.handleCallMediaModifications = handleCallMediaModifications.bind(this);
    this.handleCallMediaTerminations = handleCallMediaTerminations.bind(this);
    this.handleCallOpen = handleCallOpen.bind(this);
    this.hold = holdCall.bind(this);
    this.resume = resumeCall.bind(this);
    this.mute = muteCall.bind(this);
    this.unmute = unmuteCall.bind(this);
    this.end = endCall.bind(this);
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
    logger.logDebug('createOutgoingCall');

    logger.logInfo('Creating outgoing call');
    logger.logInfo('caller: ' + options.from + ', constraints: ' + options.mediaConstraints);

    userMediaSvc.getUserMedia(app.utils.extend(options, {
      onUserMedia: function(userMedia) {
        app.utils.extend(options, userMedia);
        peerConnSvc.initPeerConnection(options);
      },
      onError: handleError.bind(this, 'createOutgoingCall', options.onError)
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

  if (undefined === ATT.private) {
    throw Error('Cannot export Call. ATT.private is undefined');
  }
  ATT.private.Call = Call;

}(ATT || {}));
