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
    function getEventChannel( useLongPolling, messageHandler ) {

      // config for setting up Web Socket with BF
      var wsConfig = {
        method: 'post',
        // CURL endpoint to gen new sessionID
        url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + '439bfe71-ca89-4983-9919-3b0931b95c04' + '/websocket',
        headers: {
          // Where is our access token now?
          'Authorization': 'Bearer abcd',
          'Content-type': 'application/json',
          'Accept' : 'application/json'
        },
        success: function( response ) {
          var location = response.getResponseHeader('location');
          console.log('Connected to websocket: ' + location);
          var ws = new WS(location, function messageHandler(e) {
            console.log(e);
            //ATT.event.publish(event);
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
