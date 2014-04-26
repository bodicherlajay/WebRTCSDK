/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global WebSocket*/

/** WebRTC Event Channel Module: Will export method `ATT.utils.createEventChannel`
 * Extends the global object `ATT` with a method to create Event Channels
 * Event channel objects can be used to listen to a given `channel` continuously.
 */

(function () {
  'use strict';
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
      isListenning = false,
      ws, // socket to use in case we're using WebSockets
      locationForSocket,
      eventData;

    if (undefined === channelConfig || 0 === Object.keys(channelConfig)
        || undefined === channelConfig.url) {
      throw new Error('Invalid Options. Cannot create channel.');
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
          e;
        // publish individually
        for (e in events) {
          if (events.hasOwnProperty(e)) {
            channelConfig.publisher.publish(sessID + '.responseEvent', events[e].eventObject);
          }
        }
      }
    }

    // setup success and error callbacks
    function onSuccess(response) {
      if (channelConfig.usesLongPolling
          && ('function' === typeof channelConfig.callback)) {
        channelConfig.callback(response);
        processMessages(response);
        // continue polling
        channelConfig.resourceManager.getAPIObject().getEvents();
        return;
      }

      // if the channel uses sockets
      locationForSocket = response.getResponseHeader('location');
      // create a new socket if this channel doesn't have one already
      if (undefined === ws && locationForSocket) {
        ws = new WebSocket(location);
        ws.onmessage = function (message) {
          processMessages(message);
        };
      }

    }

    function onError(error) {
      if (channelConfig.usesLongPolling) {
        // try again
        channelConfig.resourceManager.getAPIObject().getEvents();
        return;
      }
      // using sockets
      console.log('ERROR', error);
    }

    function onTimeOut() {
      // try again
      channelConfig.resourceManager.getAPIObject().getEvents();
    }

    // configure callbacks for this channel
    channelConfig.success = onSuccess;
    channelConfig.error = onError;
    if (true === channelConfig.usesLongPolling) {
      channelConfig.ontimeout = onTimeOut;
    }

    function startListenning() {
      isListenning = true;
      // TODO: Remove Note
      // Note: This seems to be equivalent to do `ATT.resourceManager.getInstance().getAPIObject().getEvents()`
      // Will start making HTTP requests and process the responses using this channel.
      channelConfig.resourceManager.doOperation(channelConfig.publicMethodName, channelConfig);
    }

    // TODO: Remove Note
    // Will create a method with name `publicMethodName` in the resource manager 
    // that will execute the function in the second parameter.
    // Note: Apparently this is so you can do `ATT.resourceManager.getInstance().getAPIObject().getEvents()`... too long!
    channelConfig.resourceManager.addPublicMethod(channelConfig.publicMethodName, startListenning);

    channel = {
      isListenning: function () {
        return isListenning;
      },
      startListenning: startListenning
    };

    return channel;
  }

  // export method to ATT.createEventChannel
  if (window.ATT === undefined) {
    window.ATT = { utils : {}};
  }
  window.ATT.utils.createEventChannel = createEventChannel;

}());