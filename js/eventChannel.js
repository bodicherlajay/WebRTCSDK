/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT, WebSocket, Env*/

/** WebRTC Event Channel Module: Will export method `ATT.utils.createEventChannel`
 * Extends the global object `ATT` with a method to create Event Channels
 * Event channel objects can be used to listen to a given `channel` continuously.
 */

(function () {
  'use strict';

  var utils = {},
    logger = Env.resourceManager.getInstance().getLogger("eventChannel");

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
    //logger.logDebug(channelConfig);
    // to appease the JSLint gods
    var channel = {}, // the channel to be configured and returned.
      httpConfig = {},
      isListening = false,
      ws, // socket to use in case we're using WebSockets
      locationForSocket,
      eventData,
      onSuccess,
      onError,
      onTimeOut;

    logger.logInfo("About to create event channel");

    if (undefined === channelConfig || 0 === Object.keys(channelConfig)
        || undefined === channelConfig.accessToken
        || undefined === channelConfig.endpoint
        || undefined === channelConfig.sessionId
        || undefined === channelConfig.publicMethodName
        || undefined === channelConfig.resourceManager
        || undefined === channelConfig.usesLongPolling
        || undefined === channelConfig.publisher) {
      throw new Error('Invalid Options. Cannot create channel with options:' + JSON.stringify(channelConfig));
    }
    //logger.logDebug(httpConfig);

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
            channelConfig.publisher.publish(sessID + '.responseEvent', events[evt].eventObject);
            logger.logDebug("Published event " + sessID + '.responseEvent', events[evt].eventObject);
          }
        }
      }
    }

    // setup success and error callbacks
    onSuccess =  function (response) {
      logger.logDebug("on success");
      logger.logDebug(response);
      if (!isListening) {
        logger.logDebug("Not processing response because event channel is not running");
        return;
      }
      if (true === channelConfig.usesLongPolling) { // long-polling
        logger.logDebug("Before processing messages");
        if (response.getResponseStatus() === 204) {
          logger.logInfo("No event response content, repolling again...");
          // continue polling
          setTimeout(function () {channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, httpConfig); }, 5);
        } else if (response.getResponseStatus() === 200) {
          processMessages(response);
          logger.logDebug("Processed messages, repolling again...");
          // continue polling
          setTimeout(function () {channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, httpConfig); }, 5);
        } else {
          logger.logDebug("Response code was:" + response.getResponseStatus() + " repolling again...");
          // continue polling
          setTimeout(function () {channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, httpConfig); }, 5);
        }
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
      }
    };

    onError =  function (error) { // only used for Long Polling
      logger.logError('ERROR: Network Error: ' + error);
      return;
    };

    onTimeOut = function () {
      logger.logInfo("Request timed out " + channelConfig.endpoint);
      // try again
      if (isListening) {
        logger.logInfo("Repolling again...");
        setTimeout(function () {channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, httpConfig); }, 5);
      }
    };

    function startListening() {
      isListening = true;
      logger.logInfo("Starting the event channel");
      //setup httpConfig for REST call
      httpConfig = {
        params: {
          url: {sessionId: channelConfig.sessionId, endpoint: channelConfig.endpoint},
          headers: {
            'Authorization' : 'Bearer ' + channelConfig.accessToken
          }
        },
        success: onSuccess,
        error: onError,
        ontimeout: onTimeOut
      };
      setTimeout(function () {channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, httpConfig); }, 5);
    }

    function stopListening() {
      //todo fix me, properly cancel the xhr request to end the channel
      logger.logInfo("Event channel stopped");
      isListening = false;
    }

    channel = {
      isListening: function () {
        return isListening;
      },
      startListening: startListening,
      stopListening: stopListening
    };

    return channel;
  }

  utils.createEventChannel = createEventChannel;
  // export method to ATT.createEventChannel
  if (ATT.utils === undefined) {
    ATT.utils = utils;
  } else {
    ATT.utils.createEventChannel = createEventChannel;
  }
}());