/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global arg, WebSocket*/
/**
* WebSocket Class
* @param {String} URL The Web Socket Location
* @param {Function} message_handler The callback
* @param {Number} debug_level The Console Log condition
**/

function WS(url, message_handler, debug_level) {
  "use strict";

  var self = this,
    queue = [],
    message;

  function log(message) {
    console.log('WebSocket:' + message);
  }

  debug_level = (arg === undefined ? debug_level : 1);

  self.websocket = new WebSocket(url);

  self.websocket.onopen = function () {
    log('OnOpen');
    while (queue.length > 0) {
      message = queue[0];
      self.send(message);
      queue.shift();
    }
  };

  self.websocket.onclose = function (evt) {
    log('OnClose');
  };

  self.websocket.onmessage = function (evt) {
    log('OnMessage');
    message_handler(evt);
  };

  self.websocket.onerror = function (evt) {
    log('OnError');
  };

  self.close = function () {
    self.websocket.close();
  };

  self.send = function (message) {
    var CONNECTING = 0,
      OPEN = 1,
      CLOSING = 2,
      CLOSED = 3;

    if (self.websocket.readyState === OPEN) {
      log('sent ' + message);
      self.websocket.send(message);
    } else {
      log('sent queued due to non-open WebSocket');
      queue.push(message);
    }
  };
}