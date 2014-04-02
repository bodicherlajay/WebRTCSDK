/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/


if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";
  var module = {};

  module.Event = {
    READY: 0,
    CALLING: 1,
    RINGING: 2,
    INPROGRESS: 3,
    HOLD: 4,
    TRANSITION: 5,
    WAITING: 6,
    ENDED: 7,
    ERROR: 8
  };

  mainModule.Event = module.Event;

}(ATT || {}));
