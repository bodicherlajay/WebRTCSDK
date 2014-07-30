/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/

//Dependency: ATT.logManager

(function () {
  'use strict';

  var factories = ATT.private.factories,
    logManager = ATT.logManager.getInstance(),
    logger = logManager.getLoggerByName("EventManager");

//  function handleError(operation, errHandler, err) {
//    logger.logDebug('handleError: ' + operation);
//
//    logger.logInfo('There was an error performing operation ' + operation);
//
//    var error = errMgr.create(err, operation);
//
//    if (typeof errHandler === 'function') {
//      errHandler(error);
//    }
//  }

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
          breed: event.type === 'calls' ? 'call' : 'conference',
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
          type: event.type,
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

        eventChannel.on('channel-error', function (event) {
          options.onError(event);
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

    function off(event, handler) {
      emitter.unsubscribe(event, handler);
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
      off: off,
      setup: setup,
      stop: stop
    };
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting createEventManager');
  }
  ATT.private.factories.createEventManager = createEventManager;
}());
