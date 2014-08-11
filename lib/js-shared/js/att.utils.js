/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/
/** Will export utilities, therefore nothing in here depends on anything else.
 * Will create `ATT.utils` namespace
 */

var attUtils = (function (mainModule) {
  'use strict';

    /**
     * Extends an existing object using deep copy.
     * Note: It will only deep-copy instances of Object.
     * @param destination
     * @param source
     * @returns {*} destination
     */
  var extend = function (destination, source) {
      var property;
      for (property in source) {
        // if the source has `property` as a `direct property`
        if (source.hasOwnProperty(property)) {
          // if that property is NOT an `Object`
          if (!(source[property] instanceof Object)) {
            // copy the value into the destination object
            destination[property] = source[property];
          } else {// `property` IS an `Object`
            // copy `property` recursively
            destination[property] = extend(source[property]);
          }
        }
      }
      return destination;
    },
    inherits = function (ctor, superCtor) {
      ctor.super = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    },

    /**
     Places namespaces on root object.  s is dot separated string of names adding to root.
     The namespace created is returned.
     */
    createNamespace = function (root, s) {
      var names = s.split('.'),
        parent = root;

      names.forEach(function (name) {
        if (!parent[name]) { parent[name] = {}; }
        parent = parent[name];
      });
      return parent;
    };

  function createCalledPartyUri(destination) {
    if (destination.match(new RegExp('[^0-9]')) === null) { // Number (ICMN/VTN/PSTN)
      if (destination.length === 10) {  // 10 digit number
        return 'tel:+1' + destination;
      }
      if (destination.indexOf('1') === 0) {  // 1 + 10 digit number
        return 'tel:+' + destination;
      }
      if (destination.indexOf('+') === 0) { // '+' + Number
        return 'tel:' + destination;
      }
      return 'sip:' + destination + '@icmn.api.att.net'; // if nothing works this will
    }
    if (destination.indexOf('@') > 0) { // NoTN (assuming domain supplied to SDK dial)
      return 'sip:' + destination;
    }
    return null;
  }

  // update `utils` namespace under `ATT`
  mainModule.utils = {
    createNamespace: createNamespace,
    extend: extend,
    inherits: inherits,
    createCalledPartyUri: createCalledPartyUri
  };

  if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = mainModule;
  }

}(ATT));

