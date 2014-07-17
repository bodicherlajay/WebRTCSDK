/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global cmgmt:true, Logger:true, ATT:true, Env:true*/

//Dependency: ATT.logManager


(function () {
  'use strict';

  var logManager = ATT.logManager.getInstance(),
    logger,
    factories = ATT.private.factories;

  function handleError(operation, errHandler, err) {
    logger.logDebug('handleError: ' + operation);

    logger.logInfo('There was an error performing operation ' + operation);

    var error = errMgr.create(err, operation);

    if (typeof errHandler === 'function') {
      errHandler(error);
    }
  }

  function mapEventNameToCallback(callEvent) {
    switch (callEvent) {
    case ATT.CallStatus.SESSION_READY:
      return 'onSessionReady';
    case ATT.CallStatus.SESSION_DELETED:
      return 'onLogout';
    case ATT.CallStatus.SESSION_ERROR:
      return 'onError';
    case ATT.CallStatus.CONNECTING:
      return 'onConnecting';
    case ATT.CallStatus.CALLING:
      return 'onCalling';
    case ATT.CallStatus.RINGING:
      return 'onIncomingCall';
    case ATT.CallStatus.ESTABLISHED:
      return 'onCallEstablished';
    case ATT.CallStatus.INPROGRESS:
      return 'onCallInProgress';
    case ATT.CallStatus.HOLD:
      return 'onCallHold';
    case ATT.CallStatus.RESUMED:
      return 'onCallResume';
    case ATT.CallStatus.TRANSITION:
      return 'onSessionReady';
    case ATT.CallStatus.WAITING:
      return 'onCallWaiting';
    case ATT.CallStatus.ENDED:
      return 'onCallEnded';
    case ATT.CallStatus.ERROR:
      return 'onCallError';
    default:
      return null;
    }
  }

  // function processCurrentEvent() {
  //   var currentEvent = this.getCurrentEvent(),
  //     state = currentEvent.state,
  //     action_data = {};

  //   switch(state) {
  //   case ATT.SessionEvents.RTC_SESSION_CREATED:
  //     this.onEvent(rtcEvent.createRTCEvent({
  //       state: ATT.CallStatus.SESSION_READY,
  //       data: {
  //         sessionId: this.getSession().getSessionId()
  //       }
  //     }));
  //     break;
  //   case ATT.RTCCallEvents.CALL_CONNECTING:
  //     this.onEvent(rtcEvent.createRTCEvent({
  //       state: ATT.CallStatus.CONNECTING,
  //       to: currentEvent.to
  //     }));
  //     break;
  //   case ATT.RTCCallEvents.CALL_RINGING:
  //     this.onEvent(rtcEvent.createRTCEvent({
  //       state: ATT.CallStatus.CALLING,
  //       to: currentEvent.to
  //     }));
  //     break;
  //   case ATT.RTCCallEvents.INVITATION_RECEIVED:
  //     // Added a getCodec method to the util to get access the codec
  //     var CODEC =  ATT.sdpFilter.getInstance().getCodecfromSDP(currentEvent.sdp),
  //       mediaType = (CODEC.length === 1) ? 'audio' : 'video';

  //     this.onEvent(rtcEvent.createRTCEvent({
  //       state: ATT.CallStatus.RINGING,
  //       from: currentEvent.from ? currentEvent.from.split('@')[0].split(':')[1] : ''
  //     }), {
  //       id: currentEvent.resourceURL.split('/')[6],
  //       from: currentEvent.from ? currentEvent.from.split('@')[0].split(':')[1] : '',
  //       mediaType: mediaType,
  //       remoteSdp: currentEvent.sdp
  //     });
  //     break;
  //   case ATT.RTCCallEvents.MODIFICATION_RECEIVED:
  //     action_data = {
  //       action: 'accept-mods',
  //       sdp: currentEvent.sdp,
  //       modId: currentEvent.modId
  //     };
  //     if (currentEvent.sdp.indexOf('recvonly') !== -1) {
  //       // Received hold request...
  //       this.onEvent(rtcEvent.createRTCEvent({
  //         state: ATT.CallStatus.HOLD,
  //         from: this.getSession().getCurrentCall().from
  //       }), action_data);
  //     } else if (currentEvent.sdp.indexOf('sendrecv') !== -1 && this.getSession().getCurrentCall().getRemoteSdp().sdp.indexOf('recvonly') !== -1) {
  //       // Received resume request...
  //       this.onEvent(rtcEvent.createRTCEvent({
  //         state: ATT.CallStatus.RESUMED,
  //         from: this.getSession().getCurrentCall().from
  //       }), action_data);
  //     } else {
  //       this.onEvent(null, action_data);
  //     }
  //     break;
  //   case ATT.RTCCallEvents.MODIFICATION_TERMINATED:
  //     action_data = {
  //       action: 'term-mods',
  //       sdp: currentEvent.sdp,
  //       modId: currentEvent.modId
  //     };
  //     if (currentEvent.reason !== 'success') {
  //       this.onEvent(rtcEvent.createRTCEvent({
  //         state: ATT.CallStatus.ERROR,
  //         from: this.getSession().getCurrentCall().from
  //       }), action_data);
  //     }
  //     if (currentEvent.sdp && currentEvent.reason === 'success') {
  //       if (currentEvent.sdp.indexOf('sendonly') !== -1 && currentEvent.sdp.indexOf('sendrecv') === -1) {
  //         // Hold call successful...other party is waiting...
  //         this.onEvent(rtcEvent.createRTCEvent({
  //           state: ATT.CallStatus.HOLD,
  //           from: this.getSession().getCurrentCall().from
  //         }), action_data);
  //       }
  //       if (currentEvent.sdp.indexOf('sendrecv') !== -1) {
  //         // Resume call successful...call is ongoing...
  //         this.onEvent(rtcEvent.createRTCEvent({
  //           state: ATT.CallStatus.RESUMED,
  //           from: this.getSession().getCurrentCall().from
  //         }), action_data);
  //       }
  //     }
  //     break;
  //   case ATT.RTCCallEvents.SESSION_OPEN:
  //     this.onEvent(rtcEvent.createRTCEvent({
  //       state: ATT.CallStatus.ESTABLISHED
  //     }), {
  //       sdp: currentEvent.sdp
  //     });
  //     break;
  //   case ATT.RTCCallEvents.CALL_IN_PROGRESS:
  //     this.onEvent(rtcEvent.createRTCEvent({
  //       state: ATT.CallStatus.INPROGRESS
  //     }));
  //     break;
  //   case ATT.RTCCallEvents.SESSION_TERMINATED:
  //     action_data = {
  //       action: 'term-session'
  //     };
  //     if (currentEvent.reason) {
  //       this.onEvent(rtcEvent.createRTCEvent({
  //         state: ATT.CallStatus.ERROR,
  //         error: errMgr.create(currentEvent.reason)
  //       }), action_data);
  //     } else {
  //       this.onEvent(rtcEvent.createRTCEvent({
  //         state: ATT.CallStatus.ENDED
  //       }), action_data);
  //     }
  //     break;
  //   default:
  //     logger.logError('Event with state ' + currentEvent.state + ' not handled');
  //   }
  // }

  function createEventManager(options) {

    var channelConfig,
      eventChannel,
      resourceManager,
      emitter;

    /*
     * Gives a friendly name to Event Channel events
     * @param {Object} event The event object
     */
    function processEvent(event) {
      var codec;

      if (!event) {
        logger.logError('Not able to consume null event...');
        return;
      }

      logger.logDebug('Consumed event from event channel', JSON.stringify(event));

      switch (event.state) {
      case ATT.RTCCallEvents.INVITATION_RECEIVED:
        codec = ATT.sdpFilter.getInstance().getCodecfromSDP(event.sdp);

        emitter.publish('call-incoming', {
          id: event.resourceURL.split('/')[6],
          from: event.from.split('@')[0].split(':')[1],
          mediaType: (codec.length === 1) ? 'audio' : 'video',
          remoteSdp: event.sdp
        });
        break;
      case ATT.RTCCallEvents.MODIFICATION_RECEIVED:
        emitter.publish('media-modifications', {
          remoteSdp: event.sdp,
          modificationId: event.modId
        });
        break;
      case ATT.RTCCallEvents.MODIFICATION_TERMINATED:
        emitter.publish('media-mod-terminations', {
          remoteSdp: event.sdp,
          modificationId: event.modId,
          reason: event.reason
        });
        break;
      case ATT.RTCCallEvents.SESSION_OPEN:
        emitter.publish('call-connected', {
          remoteSdp: event.sdp
        });
        break;
      case ATT.RTCCallEvents.SESSION_TERMINATED:
        emitter.publish('call-disconnected', {
          id: event.resourceURL.split('/')[6],
          from: event.from.split('@')[0].split(':')[1],
          reason: event.reason
        });
        break;
      }
    }

    function setupEventChannel(options) {
      logger.logDebug('setupEventChannel');

      // Set event channel configuration
      // All parameters are required
      // Also, see appConfigModule
      var channelOptions = {
        accessToken: options.token,
        endpoint: channelConfig.endpoint,
        sessionId: options.sessionId,
        publisher: emitter,
        resourceManager: resourceManager,
        publicMethodName: 'getEvents',
        usesLongPolling: ('longpolling' === channelConfig.type)
      };

      eventChannel = factories.createEventChannel(channelOptions);

      if (eventChannel) {
        logger.logInfo('Event channel up and running');

        eventChannel.on('api-event', function (event) {
          processEvent(event);
        });

        logger.logInfo('Subscribed to api-event from event channel');

        eventChannel.startListening({
          success: function (msg) {
            logger.logInfo(msg);
          },
          error: options.onError
        });
      }
      emitter.publish('listening');
    }

    function stop() {
      if (eventChannel) {
        eventChannel.stopListening();
        logger.logInfo('Event channel shutdown successfully');
      }
      emitter.publish('stop-listening');
    }

    function on(event, handler) {
      if ('listening' !== event
          && 'stop-listening' !== event
          && 'call-incoming' !== event
          && 'call-disconnected' !== event
          && 'remote-sdp' !== event
          && 'call-connected' !== event
          && 'media-modifications' !== event
          && 'media-mod-terminations' !== event
          && 'media-established' !== event) {
        throw new Error('Event not found');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler);
    }

    function setup(options) {
      if (undefined === options) {
        throw new Error('Options not defined');
      }
      if (undefined === options.sessionId) {
        throw new Error('Session id is not defined');
      }
      if (undefined === options.token) {
        throw new Error('Token not defined');
      }

      setupEventChannel(options);
    }

    logger = logManager.getLoggerByName("EventManager");
    logger.logDebug('createEventManager');

    if (undefined === options
        || 0 === Object.keys(options).length) {
      throw new Error('Invalid options');
    }
    if (undefined === options.resourceManager) {
      throw new Error('Must pass `options.resourceManager`');
    }
    if (undefined === options.channelConfig) {
      throw new Error('Must pass `options.channelConfig`');
    }
    channelConfig = options.channelConfig;
    resourceManager = options.resourceManager;
    emitter = factories.createEventEmitter();

    return {
      on: on,
      setup: setup,
      stop: stop
    };
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting createEventManager');
  }
  ATT.private.factories.createEventManager = createEventManager;
}());
