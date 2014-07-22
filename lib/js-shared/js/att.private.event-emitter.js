/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/
/**
 Event Emitter implements Mediator pattern publishes local SDP offers to SignallingChannel - triggered by PeerConnectionService
 Publishes remote SDP answer... to PeerConnectionService - triggered by EventChannel
 Acts as single publishing point for UI callbacks

 Give a call object it will give you callback handle for this call object
 Maintains topic style of pub/sub
 **/

(function () {

  'use strict';
  var typeofATT;

  function createEventEmitter() {
    var topics  =  {};

    function callMethodOnTopic(topicObj, args) {
      topicObj.callback.apply(topicObj.context, args);
    }

    return {
      getTopics : function () {
        return topics;
      },
      unsubscribe : function (topic, callback) {
        var i,
          subscribers;
        if (!topics.hasOwnProperty(topic)) {
          return false;
        }
        if (typeof callback !== 'function') {
          throw new Error('Must pass in the callback you are unsubscribing');
        }

        subscribers = topics[topic];
        for (i = 0; i < subscribers.length; i = i + 1) {
          if (subscribers[i].callback === callback) {
            subscribers.splice(i, 1);
            if (subscribers.length === 0) {
              delete topics[topic];
            }
            return true;
          }
        }
        return false;
      },
      publish : function () {
        var args  =  Array.prototype.slice.call(arguments),
          topic  =  args.shift(),
          i,
          subscribers;
        if (!topics.hasOwnProperty(topic)) {
          return false;
        }
        subscribers = topics[topic];

        for (i = 0; i  <  subscribers.length; i = i + 1) {
          setTimeout(callMethodOnTopic.bind(null, topics[topic][i], args), 0);
        }
        return true;
      },
      /**
       *
       * @param {String} topic The topic name.
       * @param {Function} callback The callback function.
       * @param {Object} context Optional callback context.
       * @returns {boolean}
       */
      subscribe  :  function (topic, callback, context) {
        var subscribers, i;
        if ('' === topic
            || null === topic
            || undefined === topic) {
          return false;
        }

        if (typeof callback !== 'function') {
          return false;
        }

        if (undefined !== context
            && (context === null
            || typeof context !== 'object')) {
          return false;
        }

        var topicObj = {
          context: context,
          callback: callback
        };

        if (!topics.hasOwnProperty(topic)) {
          topics[topic] =  [];
        }

        subscribers = topics[topic];

        for (i = 0; i < subscribers.length; i = i + 1) {
          if (callback === subscribers[i].callback) {
            return false;
          }
        }

        topics[topic].push(topicObj);
        return true;
      }
    };
  }

  typeofATT = typeof window.ATT;
  if (undefined ===  typeofATT) {
    window.ATT = {
      private: {
        factories : { }
      }
    };
  } else if (undefined === ATT.private) {
    ATT.private = {
      factories : { }
    };
  }
  ATT.private.factories.createEventEmitter = createEventEmitter;

}());