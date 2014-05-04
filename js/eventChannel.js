/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT, WebSocket*/

/** WebRTC Event Channel Module: Will export method `ATT.utils.createEventChannel`
 * Extends the global object `ATT` with a method to create Event Channels
 * Event channel objects can be used to listen to a given `channel` continuously.
 */

(function () {
  'use strict';

  var utils = {};

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
    // to appease the JSLint gods
    var channel = {}, // the channel to be configured and returned.
      httpConfig = {},
      isListenning = false,
      ws, // socket to use in case we're using WebSockets
      locationForSocket,
      eventData;

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
    /**
     * Process Events
     * @param {Object} messages The messages
     **/
    function processMessages(messages) {
      // Using Long Polling
      if (true === channelConfig.usesLongPolling) {
        eventData = JSON.parse(messages.responseText);
      } else { // using websockets
        eventData = JSON.parse(messages.data);
      }
      if (eventData.events) {
        var sessID = eventData.events.eventList[0].eventObject.resourceURL.split('/')[4],
          events = eventData.events.eventList,
          evt;
        // publish individually
        for (evt in events) {
          if (events.hasOwnProperty(evt)) {
            channelConfig.publisher.publish(sessID + '.responseEvent', events[evt].eventObject);
            console.log(sessID + '.responseEvent', events[evt].eventObject);
          }
        }
      }
    }

    // setup success and error callbacks
    function onSuccess(response) {
      if ('/events' === channelConfig.endpoint) { // long-polling
        processMessages(response);
        // continue polling
        channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, httpConfig);
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
    }

    function onError(error) { // only used for Long Polling
      console.log('ERROR: Network Error: ' + JSON.stringify(error));
      return;
    }

    function onTimeOut() {
      // try again
      channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, httpConfig);
    }

    function startListening() {
      isListenning = true;
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

      channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, httpConfig);
    }

    channel = {
      isListenning: function () {
        return isListenning;
      },
      startListening: startListening
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