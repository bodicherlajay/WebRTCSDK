/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
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
    // channel id
      channelID,
    // websocket instance
      ws;

    /**
     * Process Events
     * @param {Object} messages The messages
     **/
    function processMessages(messages) {
      // parse response
      responseEvent = JSON.parse(messages.data);

      // if we have events in the responseText
      if (responseEvent.events) {
        // grab session id & loop through event list
        var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4], events = responseEvent.events.eventList, e;
        // publish
        for (e in events) {
          if (events.hasOwnProperty(e)) {
            app.event.publish(sessID + '.responseEvent', events[e].eventObject);
            console.log(sessID + '.responseEvent', events[e].eventObject);
          }
        }
      }
    }

    /*===========================================
     =            Long Polling Config           =
     ===========================================*/
    lpConfig = {
      method: 'get',
      url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + app.WebRTC.Session.Id + '/events',
      timeout: 30000,
      headers: {
        'Authorization': 'Bearer ' + app.WebRTC.Session.accessToken
      },
      success: function (response) {
        processMessages(response);
        // repoll
        app.WebRTC.getEvents(lpConfig);
      },
      error: function () {
        // repoll
        app.WebRTC.getEvents(lpConfig);
      },
      ontimeout: function () {
        // repoll
        app.WebRTC.getEvents(lpConfig);
      }
    };

    /*===========================================
     =        Web Socket Config                 =
     ===========================================*/
    wsConfig = {
      method: 'post',
      url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + app.WebRTC.Session.Id + '/websocket',
      headers: {
        'Authorization': 'Bearer ' + app.WebRTC.Session.accessToken
      },
      success: function (messages) {
        // grab the location from response headers
        var location = messages.getResponseHeader('location');
        // if we have a success location
        if (location) {
          // channelID is channel query string param
          channelID = location.split('=')[1];
          // dump to console
          console.log('CONNECTION CREATED. CHANNEL ID = ' + channelID);
          // create new WebSocket instance
          ws = new WebSocket(location);
          // handle messages
          ws.onmessage = function (messages) {
            processMessages(messages);
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
      console.log("Using long polling");
      app.WebRTC.getEvents(lpConfig);
    } else {
      console.log("Using web sockets");
      app.WebRTC.getEvents(wsConfig);
    }
  }

  // place on ATT namespace
  app.WebRTC.eventChannel = getEventChannel;

}(ATT || {}));