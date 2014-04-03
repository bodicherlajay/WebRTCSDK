/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";

  var module = {}, instance, init = function () {


  };

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  mainModule.resourceManager = module;

}(ATT || {}));
