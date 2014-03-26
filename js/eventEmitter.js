/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/

/**
 Event Emitter implements Mediator pattern publishes local SDP offers to SignallingChannel - triggered by PeerConnectionService
 Publishes remote SDP answer... to PeerConnectionService - triggered by EventChannel
 Acts as single publishing point for UI callbacks

 Give a call object it will give you callback handle for this call object
 Maintains topic style of pub/sub
 **/
var ATT = ATT || {};

(function (mainModule) {
  "use strict";
  var module  =  {}, topics  =  {};

  module.subscribe  =  function (topic, callback) {
    if (!topics.hasOwnProperty(topic)) {
      topics[topic] =  [];
    }
    topics[topic].push(callback);
    return true;
  };

  module.unsubscribe  =  function (topic, callback) {
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

    for (i  =  0, len  =  topics[topic].length; i  <  len; i = i + 1) {
      topics[topic][i].apply(undefined, args);
    }
    return true;
  };
  //Name of the module
  mainModule.event  =  module;

}(ATT || {}));