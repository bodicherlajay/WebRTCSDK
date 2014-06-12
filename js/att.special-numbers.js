/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//Dependency: None

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';

  var module = {};

  module.SpecialNumbers = {
    "911": true,
    "411": true,
    "611": true,
    "*69": true,
    "#89": true
  };


  mainModule.SpecialNumbers = Object.freeze(module.SpecialNumbers);

}(ATT || {}));
