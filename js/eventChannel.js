/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT,cmgmt, WebSocket:true, Env: true*/
/**
 WebRTC Event Channel Module
 */

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  var resourceManager = Env.resourceManager.getInstance(),
    apiObject = resourceManager.getAPIObject();

  /**
   * Get Event Channel
   * @param {Boolean} useLongPolling Use Long Polling
   */
  function getEventChannel(useLongPolling, sessionId) {
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
     * @param {Boolean} lp T/F for Long Polling
     **/
    function processMessages(messages, lp) {
      // Using Long Polling
      if (lp) {
        responseEvent = JSON.parse(messages.responseText);
      } else {
        responseEvent = JSON.parse(messages.data);
      }
      if (responseEvent.events) {
        console.log(responseEvent.events);
        var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4], events = responseEvent.events.eventList, e;
        // publish individually
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
      url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + sessionId + '/events',
      timeout: 30000,
      headers: {
        'Authorization': 'Bearer ' + cmgmt.CallManager.getInstance().getSessionContext().getAccessToken()
      },
      success: function (response) {
        processMessages(response, true);
        apiObject.getEvents(lpConfig);
      },
      error: function () {
        apiObject.getEvents(lpConfig);
      },
      ontimeout: function () {
        apiObject.getEvents(lpConfig);
      }
    };

    /*===========================================
     =        Web Socket Config                 =
     ===========================================*/
    wsConfig = {
      method: 'post',
      url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions/' + sessionId + '/websocket',
      headers: {
        'Authorization': 'Bearer ' + cmgmt.CallManager.getInstance().getSessionContext().getAccessToken()
      },
      success: function (messages) {
        var location = messages.getResponseHeader('location');
        if (location) {
          channelID = location.split('=')[1];
          console.log('CONNECTION CREATED. CHANNEL ID = ' + channelID);
          ws = new WebSocket(location);
          ws.onmessage = function (messages) {
            processMessages(messages, false);
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
      apiObject.getEvents(lpConfig);
    } else {
      console.log("Using web sockets");
      apiObject.getEvents(wsConfig);
    }
  }

  // place on ATT namespace
  apiObject.eventChannel = getEventChannel;

}(ATT || {}));