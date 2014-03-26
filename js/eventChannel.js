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
    function getEventChannel( useLongPolling ) {

      // config for setting up Web Socket with BF
      var wsConfig = {
        method: 'post',
        url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + ATT.WebRTC.Session.Id + '/websocket',
        headers: {
          'Authorization': 'Bearer ' + ATT.WebRTC.Session.accessToken,
          'Content-type': 'application/json',
          'Accept' : 'application/json'
        },
        success: function( response ) {
          var location = response.getResponseHeader('location');
          console.log('Connected to websocket: ' + location);
          var ws = new WS(location, function(e) {
            console.log(e);
          });
        }
      }

      if (useLongPolling) {
        // use long polling
      } else {
        // use websockets
        ATT.WebRTC.getEvents(wsConfig);
      }
    }

    app.WebRTC.eventChannel = getEventChannel;

}(ATT || {}));
