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
        url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + '3c0112b2-96a7-4c9e-ba63-850bc520fe3e' + '/websocket',
        headers: {
          'Authorization': 'Bearer ' + ATT.WebRTC.Session.accessToken,
          'Content-type': 'application/json',
          'Accept' : 'application/json'
        },
        success: function( response ) {
          // grab the location from response headers
          var location = response.getResponseHeader('location');

          // if we have a success location
          if ( location ) {
            // channelID is channel query string param
            var channelID = location.split('=')[1];
            // dump to console
            console.log('CONNECTION CREATED. CHANNEL ID = ' + channelID);
            // create new WebSocket instance
            var ws = new WS(location, function(e) {
              // parse response
              var responseEvent = JSON.parse(e.data);
              // dump res & event state to console
              console.log(responseEvent, responseEvent.events.eventList[0].eventObject.state);
              // grab the sessionID
              var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4];
              // publish sessionID along with responseEvent Object
              ATT.event.publish( sessID + '.responseEvent', responseEvent );
            });
          }
        },
        error: function() {
          console.log('ERROR');
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