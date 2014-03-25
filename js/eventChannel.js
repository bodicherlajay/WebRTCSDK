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
        url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + '24a9a483-d603-4d23-8d52-4a4f643c1e5a' + '/websocket',
        headers: {
          'Authorization': 'Bearer ' + ATT.WebRTC.Session.accessToken,
          'Content-type': 'application/json',
          'Accept' : 'application/json'
        },
        success: function( response ) {
          var location = response.getResponseHeader('location');
          
          // Create New Web Socket Instance
          _initSocket( location );
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
      function _initSocket(location) {
        var ws = new WS(location, cb, 1);
      }
    }

    app.WebRTC.eventChannel = getEventChannel;

}(ATT || {}));
