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

      // Long Pollling Config
      var lpConfig = {
        method: 'get',
        url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + '7e7e337e-bec0-46c5-92a1-c6071951b8c1' + '/events',
        headers: {
          'Authorization': 'Bearer ' + ATT.WebRTC.Session.accessToken,
          'Content-type': 'application/json',
          'Accept' : 'application/json'
        },
        success: function( response ) {
          var responseEvent = JSON.parse(response.responseText);
          
          if ( responseEvent ) {
            // dump to console
            console.log( JSON.stringify(response.responseText) );
            // grab session id
            var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4];
            // grab state
            var state = responseEvent.events.eventList[0].eventObject.state;
            // publish event
            ATT.event.publish( sessID + '.responseEvent', responseEvent );
          }

          // repoll
          if ( state !== 'session-terminated' ) {
            ATT.WebRTC.getEvents(lpConfig);
          }
        },
        error: function(response) {
          console.log('ERROR');
        }
      };

      // Web Socket Config
      var wsConfig = {
        method: 'post',
        url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + '38a0bd4e-74ee-4cc1-89ba-16916cf2a7f2' + '/websocket',
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
            var ws = new WebSocket(location);
            // handle messages
            ws.onmessage = function(e) {
              // parse response
              var responseEvent = JSON.parse(e.data);
              // dump res & event state to console
              console.log( JSON.stringify(responseEvent) );
              // grab the sessionID
              var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4];
              // publish sessionID along with responseEvent Object
              ATT.event.publish( sessID + '.responseEvent', responseEvent );
            }
          }
        },
        error: function() {
          console.log('ERROR');
        }
      };

      if (useLongPolling) {
        // use long pollling
        ATT.WebRTC.getEvents(lpConfig);
      } else {
        // use websockets
        ATT.WebRTC.getEvents(wsConfig);
      }
    }

    // place on ATT namespace
    app.WebRTC.eventChannel = getEventChannel;

}(ATT || {}));