/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//Dependency: None

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';

  var module = {};

  SpecialNumbers = {
    "911", "411", "*69"
  };

  mainModule.SpecialNumbers = Object.freeze(module.SpecialNumbers);

}(ATT || {}));