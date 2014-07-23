/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT, WebSocket, Env*/

/** WebRTC Event Channel Module: Will export method `ATT.utils.createEventChannel`
 * Extends the global object `ATT` with a method to create Event Channels
 * Event channel objects can be used to listen to a given `channel` continuously.
 */

(function () {
  'use strict';

  var logManager = ATT.logManager.getInstance(),
    factories = ATT.private.factories;

  /**
   * Creates an Event Channel with the given configuration:
   * @returns The configured event channel.
   * @channelConfig {object} An object specifier with the properties of the channel.
   * * WebSockets:
   *   * params {
   *       url: {Array},
   *       headers: {Object}
   *     }
   * * Long Polling:
   *   * method: {String}
   *   * timeout: {integer}
   *   * headers: {Object}
   */
  function createEventChannel(channelConfig) {
    var channel = {}, // the channel to be configured and returned.
      httpConfig = {},
      isListening = false,
      ws, // socket to use in case we're using WebSockets
      locationForSocket,
      eventData,
      onSuccess,
      onError,
      onTimeOut,
      interval = 2000,
      maxPollingTime = 5*60*1000,
      methodName = 'getEvents',
      emitter,
      logger;

    try {
      logger = logManager.getLoggerByName("eventChannel");
    } catch (e) {
      console.log("Unable to initialize dependencies for Event Channel");
    }

    logger.logInfo("About to create event channel");

    if (undefined === channelConfig
        || 0 === Object.keys(channelConfig).length) {
      throw new Error('No options');
    }
    if (undefined === channelConfig.accessToken) {
      throw new Error('No Access Token');
    }
    if (undefined === channelConfig.endpoint) {
      throw new Error('No Endpoint');
    }
    if (undefined === channelConfig.sessionId) {
      throw new Error('No Session Id');
    }
    if (undefined === channelConfig.resourceManager) {
      throw new Error('No Resource Manager');
    }

    if (channelConfig.interval !== undefined) {
      logger.logInfo("Configuring interval to " + channelConfig.interval);
      interval = channelConfig.interval;
    }

    if (channelConfig.maxPollingTime !== undefined) {
      logger.logInfo("Configuring maximum polling time to " + channelConfig.maxPollingTime);
      maxPollingTime = channelConfig.maxPollingTime;
    }

    emitter = factories.createEventEmitter();

    logger.logDebug(httpConfig);

    /**
     * Process Events
     * @param {Object} messages The messages
     **/
    function processMessages(messages) {
      logger.logDebug("processing events");
      // Using Long Polling
      if (true === channelConfig.usesLongPolling) {
        eventData = JSON.parse(messages.responseText);
      } else { // using websockets
        eventData = JSON.parse(messages.data);
      }
      logger.logDebug("Event data from event channel...");
      logger.logDebug(eventData);
      if (eventData.events) {
        var sessID = eventData.events.eventList[0].eventObject.resourceURL.split('/')[4],
          events = eventData.events.eventList,
          evt;
        // publish individually
        for (evt in events) {
          if (events.hasOwnProperty(evt)) {
            events[evt].timestamp = new Date();
            emitter.publish('api-event', events[evt].eventObject);
            logger.logDebug("Published event " + sessID + '.responseEvent', events[evt].eventObject);
          }
        }
      }
    }

    function stopListening() {
      logger.logInfo("Stopped listening to event channel");
      isListening = false;
    }

    function on(event, handler) {

      if (event !== 'api-event' && event !='channel-error') {
        throw new Error('Event not defined');
      }

      if (typeof handler !== 'function') {
        throw new Error('Handler is not a function');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }

    function retry(config, error) {
      logger.logDebug(config);
      logger.logInfo("Repolling again...");
      if ((error.errorDetail.HttpStatusCode !== 204 )) { //&& error.errorDetail.HttpStatusCode > 0)) {
        logger.logError("[FATAL] Response code was:" + error + " repolling again...");
        //stopListening();
        //emitter.publish('channel-error',ATT.Error.createAPIErrorCode(error,"ATT.rtc.Phone","events","RTC"));
        //return;
      } else if (error.errorDetail.HttpStatusCode == 0) {
        logger.logInfo("Request timed out, repolling again");
      } else {
        logger.logError("Response code was:" + error + " repolling again...");
      }
      setTimeout(function () {
        // continue polling
        channelConfig.resourceManager.doOperation(methodName, httpConfig);
      }, 0);
    }

    // setup success and error callbacks
    onSuccess =  function (config, response) {
      logger.logDebug("on success");
      logger.logDebug(response);

      if (typeof config.success === 'function') {
        config.success('Sucessfully got response from event channel');
      }

      if (!isListening) {
        logger.logDebug("Not processing response because event channel is not running");
        return;
      }

      if (true === channelConfig.usesLongPolling) { // long-polling
        logger.logDebug("Before processing messages");

        if (response.getResponseStatus() === 200) {
          processMessages(response);
          logger.logDebug("Processed messages, repolling again...");
        }

        setTimeout(function () {
          // continue polling
          channelConfig.resourceManager.doOperation(methodName, httpConfig);
        }, 0);

        return;
      }

      // if the channel uses sockets
      locationForSocket = response.getResponseHeader('location');
      // create a new socket if this channel doesn't have one already
      if (undefined === ws && locationForSocket) {
        ws = new WebSocket(locationForSocket);
        ws.onmessage = function (message) {
          processMessages(message);
        };
        channelConfig.onCreateWebSocket(ws); // testability
      }
    };

    onError =  function (config, error) { // only used for Long Polling
      if (isListening) {
        logger.logInfo("onError - Repolling again...");
        //Increment by 2 times
        interval = interval * 2;
        if (interval > maxPollingTime) {
          logger.logInfo("Stopping Event Channel, maximum polling time reached, interval = "
            + interval + ", maximum polling time = " + maxPollingTime);
          stopListening();
          emitter.publish('channel-error',ATT.Error.createAPIErrorCode(error,"ATT.rtc.Phone","events","RTC"));
          return;
        } else {
          retry(config, error);
        }
      } else {
        logger.logError("Event channel is not running...");
        logger.logError(error);
      }
    };

    onTimeOut = function (config, error) {
      if (isListening) {
        logger.logInfo("Request timed out " + channelConfig.endpoint);
        retry(config, error);
      }
    };

    function startListening(config) {
      isListening = true;
      logger.logInfo("Listening to event channel");
      //setup httpConfig for REST call
      httpConfig = {
        params: {
          url: {
            sessionId: channelConfig.sessionId,
            endpoint: channelConfig.endpoint
          },
          headers: {
            'Authorization' : 'Bearer ' + channelConfig.accessToken
          }
        },
        success: onSuccess.bind(this, config),
        error: onError.bind(this, config),
        ontimeout: onTimeOut.bind(this, config)
      };
      channelConfig.resourceManager.doOperation(methodName, httpConfig);
    }

    channel = {
      isListening: function () {
        return isListening;
      },
      startListening: startListening,
      stopListening: stopListening,
      on : on
    };

    return channel;
  }

  if (undefined === ATT.private.factories) {
    throw new Error('Error exporting `createEventChannel`');
  }
  ATT.private.factories.createEventChannel = createEventChannel;
//  ATT.utils.setResourceManager = setResourceManager;
//  ATT.utils.setLogger = setLogger;
}());
