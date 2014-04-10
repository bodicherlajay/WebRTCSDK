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
    apiObject = resourceManager.getAPIObject(),
    callManager = cmgmt.CallManager.getInstance();

  /**
   * Get Event Channel
   * @param {Boolean} useLongPolling Use Long Polling
   */
  function getEventChannel(useLongPolling, sessionId, callback) {
    // to appease the JSLint gods
    var eventChannelInitiated = false,
    // longpolling config
      lpConfig,
    // websocket config
      wsConfig,
    // response event
      responseEvent,
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
        var sessID = responseEvent.events.eventList[0].eventObject.resourceURL.split('/')[4], events = responseEvent.events.eventList, e;
        // publish individually
        for (e in events) {
          if (events.hasOwnProperty(e)) {
            app.event.publish(sessID + '.responseEvent', events[e].eventObject);
            console.log(sessID + '.responseEvent', JSON.stringify(events[e].eventObject));
          }
        }
      }
    }

    /*===========================================
     =            Long Polling Config           =
     ===========================================*/
    lpConfig = {
      method: 'get',
      url: app.appConfig.BFEndpoint + '/sessions/' + sessionId + '/events',
      timeout: 30000,
      headers: {
        'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken()
      },
      success: function (response) {
        if (!eventChannelInitiated) {
          eventChannelInitiated = true;
          if (typeof callback === 'function') {
            callback();
          }
        }
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
      url: app.appConfig.BFEndpoint + '/sessions/' + sessionId + '/websocket',
      headers: {
        'Authorization': 'Bearer ' + callManager.getSessionContext().getAccessToken()
      },
      success: function (messages) {
        if (!eventChannelInitiated) {
          eventChannelInitiated = true;
          if (typeof callback === 'function') {
            callback();
          }
        }
        var location = messages.getResponseHeader('location');
        if (location) {
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