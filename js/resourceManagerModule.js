/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Env:true*/

if (!Env) {
  var Env = {};
}

Env = (function () {
  "use strict";

  var module = {}, instance, init = function () {


  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  return {
    resourceManager : module
  };

}());
