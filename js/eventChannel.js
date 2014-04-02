/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, nomen: true*/
/*global ATT,WebSocket:true*/
/**
    WebRTC Event Channel Module
*/

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  /**
  * Get Event Channel
  * @param {Boolean} useLongPolling Use Long Polling
  */
  function getEventChannel(useLongPolling) {
    // to appease the JSLint gods
    var lpConfig,
      // websocket config
      wsConfig,
      // response event
      responseEvent,
      // session id
      sessID,
      // channel id
      channelID,
      // websocket instance
      ws;

    /**
    * Process Events
    * @param {Object} response The response
    **/
    function _processMessages(response) {
      // repoll
      if (app.WebRTC.Session.isAlive) {
        app.WebRTC.getEvents(lpConfig);
      }
      // parse response
      responseEvent = JSON.parse(response.responseText);
      // dump to console
      console.log(JSON.stringify(response.responseText));
      // if we have events in the responseText
      if (responseEvent.events) {
        // grab session id
        sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4];
        // publish event
        app.event.publish(sessID + '.responseEvent', responseEvent.events.eventList);
        // log the publish
        console.log(sessID + '.responseEvent', responseEvent.events.eventList);
      }
    }
    /*===========================================
    =            Long Polling Config           =
    ===========================================*/
    lpConfig = {
      method: 'get',
      url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + app.WebRTC.Session.Id + '/events',
      async: true,
      timeout: 30000,
      headers: {
        'Authorization': 'Bearer ' + app.WebRTC.Session.accessToken,
        'Accept' : 'application/json'
      },
      success: function (response) {
        _processMessages(response);
      },
      error: function () {
        // repoll
        if (app.WebRTC.Session.isAlive) {
          app.WebRTC.getEvents(lpConfig);
        }
      },
      ontimeout: function () {
        // repoll
        if (app.WebRTC.Session.isAlive) {
          app.WebRTC.getEvents(lpConfig);
        }
      }
    };

    /*===========================================
    =        Web Socket Config                 =
    ===========================================*/
    wsConfig = {
      method: 'post',
      url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + app.WebRTC.Session.Id + '/websocket',
      async: true,
      headers: {
        'Authorization': 'Bearer ' + app.WebRTC.Session.accessToken,
        'Content-type': 'application/json',
        'Accept' : 'application/json'
      },
      success: function (response) {
        // grab the location from response headers
        var location = response.getResponseHeader('location');
        // if we have a success location
        if (location) {
          // channelID is channel query string param
          channelID = location.split('=')[1];
          // dump to console
          console.log('CONNECTION CREATED. CHANNEL ID = ' + channelID);
          // create new WebSocket instance
          ws = new WebSocket(location);
          // handle messages
          ws.onmessage = function (response) {
            _processMessages(response);
          };
        }
      },
      error: function (e) {
        console.log('ERROR', e);
      }
    };

    // Kickstart the event channel
    // @TODO: invalid session bug
    if (useLongPolling) {
      app.WebRTC.getEvents(lpConfig);
    } else {
      app.WebRTC.getEvents(wsConfig);
    }
  }

  // place on ATT namespace
  app.WebRTC.eventChannel = getEventChannel;

}(ATT || {}));