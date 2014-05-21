/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/
/**
 Event Emitter implements Mediator pattern publishes local SDP offers to SignallingChannel - triggered by PeerConnectionService
 Publishes remote SDP answer... to PeerConnectionService - triggered by EventChannel
 Acts as single publishing point for UI callbacks

 Give a call object it will give you callback handle for this call object
 Maintains topic style of pub/sub
 **/

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';
  var module = {},
    topics  =  {},
    callMethodOnTopic;

  /**
   * 
   * @param {String} topic The topic name.
   * @param {Function} callback The callback function.
   * @param {Object} context Optional callback context.
   * @returns {boolean}
   */
  module.subscribe  =  function (topic, callback, context) {
    if (!topics.hasOwnProperty(topic)) {
      topics[topic] =  [];
    }
    var topicObj = {
      context: context,
      callback: callback
    }

    topics[topic].push(topicObj);
    return true;
  };

  module.unsubscribe = function (topic, callback) {
    var i, len;
    if (!topics.hasOwnProperty(topic)) {
      return false;
    }

    if (typeof callback !== 'function') {
      throw new Error('Must pass in the callback you are unsubscribing');
    }

    for (i = 0, len =  topics[topic].length; i < len; i = i + 1) {
      if (topics[topic][i].callback === callback) {
        topics[topic].splice(i, 1);
        return true;
      }
    }
    return false;
  };

  module.publish  =  function () {
    var args  =  Array.prototype.slice.call(arguments),
      topic  =  args.shift(),
      i,
      len;

    if (!topics.hasOwnProperty(topic)) {
      return false;
    }

    for (i = 0, len  =  topics[topic].length; i  <  len; i = i + 1) {
      setTimeout(callMethodOnTopic.bind(null, topics[topic][i], args), 0);
    }
    return true;
  };

  callMethodOnTopic = function (topicObj, args) {
    topicObj.callback.apply(topicObj.context, args);
  };

  //Name of the module
  mainModule.event  =  module;

}(ATT || {}));