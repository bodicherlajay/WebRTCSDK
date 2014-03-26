/**
    WebRTC Event Channel Module
*/
var ATT = ATT || {};

(function (app) {
    'use strict';

    /**
    * Get Event Channel
    * @param {Boolean} useLongPolling Use Long Polling
    * @param {Function} cb The Callback
    */
    function getEventChannel( useLongPolling, cb ) {

      // config for setting up Web Socket with BF
      var wsConfig = {
        method: 'post',
        // CURL endpoint to gen new sessionID
        url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + 'd5cb9e41-1f16-4a02-b434-e965c3ad9a7d' + '/websocket',
        headers: {
          // Where is our access token now?
          'Authorization': 'Bearer abcd',
          'Content-type': 'application/json',
          'Accept' : 'application/json'
        },
        success: function( response ) {
          var location = response.getResponseHeader('location');
          console.log('Connected to websocket: ' + location);
          // Create New Web Socket Instance
          _initWebSocket( location );
        }
      }

      if (useLongPolling) {
        // use long polling
      } else {
        // use websockets
        ATT.WebRTC.getEvents(wsConfig);
      }

      /**
      * Initialize Socket instance
      * @param {String} locaiton The WebSocket Location URL
      **/
      function _initWebSocket( location ) {
        var ws = new WS(location);
      }
    }

    app.WebRTC.eventChannel = getEventChannel;

}(ATT || {}));
