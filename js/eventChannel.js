/**
    WebRTC Event Channel Module
*/
var ATT = ATT || {};

(function (app) {
    'use strict';

    /**
    * Get Event Channel
    * @param {Boolean} useLongPolling Use Long Polling
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
          // grab the location from response headers
          var location = response.getResponseHeader('location');
          console.log('Connected to websocket: ' + location);
          // create new WebSocket instance with
          var ws = new WS(location, function(e) {
            // parse response
            var responseEvent = JSON.parse(e.data);
            // grab the sessionID
            var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4];
            // publish sessionID along with responseEvent payload
            ATT.event.publish( sessID + '.responseEvent', responseEvent );
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

    // place on ATT namespace
    app.WebRTC.eventChannel = getEventChannel;

}(ATT || {}));
