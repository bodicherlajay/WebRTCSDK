/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/


if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";
  var module = {};

  //todo setup event subscription for all RTC events
  function onSessionOpen(evt) {
  }
  function onSessionClose(evt) {
  }
  //todo implement other events
  mainModule.RTCEvent = module;
}(ATT || {}));
