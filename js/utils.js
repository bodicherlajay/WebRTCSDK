/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */

if (!ATT) {
  var ATT = {};
}

(function (app) {
  "use strict";

  /**
   * Check if browser has WebRTC capability.
   * @return {Boolean}
   */

  var hasWebRTC =  function () {
    return typeof navigator.mozGetUserMedia === 'function' ||
      typeof navigator.webkitGetUserMedia === 'function' ||
      typeof navigator.getUserMedia === 'function';
  };

  app.utils = {
    hasWebRTC: hasWebRTC
  };
}(ATT));
