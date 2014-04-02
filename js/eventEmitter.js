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
  "use strict";
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

    // if a context is passed in, bind the passed context.
    if (typeof context === 'object') {
      callback.bind(context);
    }

    topics[topic].push(callback);
    return true;
  };

  module.unsubscribe = function (topic, callback) {
    var i, len;
    if (!topics.hasOwnProperty(topic)) {
      return false;
    }

    for (i = 0, len =  topics[topic].length; i < len; i = i + 1) {
      if (topics[topic][i] === callback) {
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

  callMethodOnTopic = function (method, args) {
    method.apply(null, args);
  };

  //Name of the module
  mainModule.event  =  module;

}(ATT || {}));