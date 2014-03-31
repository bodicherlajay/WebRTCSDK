/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global WebSocket,ATT:true*/
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
  function getEventChannel(useLongPolling) {

    /*===========================================
    =            Long Polling Config           =
    ===========================================*/
    var lpConfig = {
      method: 'get',
      url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + app.WebRTC.Session.Id + '/events',
      async: true,
      headers: {
        'Authorization': 'Bearer ' + app.WebRTC.Session.accessToken,
        'Accept' : 'application/json'
      },
      success: function(response) {
        // repoll
        if (app.WebRTC.Session.isAlive) {
          app.WebRTC.getEvents(lpConfig);
        }
        // parse response
        var responseEvent = JSON.parse(response.responseText);
        // dump to console
        console.log(JSON.stringify(response.responseText));
        // if we have events in the responseText
        if (responseEvent.events) {
          // grab session id & state
          var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4],
            state = responseEvent.events.eventList[0].eventObject.state;
          // publish event
          app.event.publish(sessID + '.responseEvent', responseEvent);
        }
      },
      error: function() {
        // repoll
        if (app.WebRTC.Session.isAlive) {
          app.WebRTC.getEvents(lpConfig);
        }
      }
    };

    /*===========================================
    =        Web Socket Config                 =
    ===========================================*/ 
    var wsConfig = {
      method: 'post',
      url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + app.WebRTC.Session.Id + '/websocket',
      async: true,
      headers: {
        'Authorization': 'Bearer ' + app.WebRTC.Session.accessToken,
        'Content-type': 'application/json',
        'Accept' : 'application/json'
      },
      success: function(response) {
        // grab the location from response headers
        var location = response.getResponseHeader('location');
        // if we have a success location
        if (location) {
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
            console.log(JSON.stringify(responseEvent));
            // grab the sessionID
            var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4];
            // publish sessionID along with responseEvent Object
            app.event.publish(sessID + '.responseEvent', responseEvent);
          }
        }
      },
      error: function(e) {
        console.log('ERROR', e);
      }
    };

    // Create the event channel based on the useLongPolling flag
    useLongPolling ? app.WebRTC.getEvents(lpConfig) : app.WebRTC.getEvents(wsConfig);

  }

  // place on ATT namespace
  app.WebRTC.eventChannel = getEventChannel;

}(ATT || {}));