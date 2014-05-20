/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT*/
/** Will export utilities, therefore nothing in here depends on anything else.
 * Will create `ATT.utils` namespace
 */
if (!ATT) {
  var ATT = {};
}

var attUtils = (function (mainModule) {
  'use strict';

  /**
   * Check if browser has WebRTC capability.
   * @return {Boolean}
   */
  var hasWebRTC =  function () {
      return typeof navigator.mozGetUserMedia === 'function' ||
        typeof navigator.webkitGetUserMedia === 'function' ||
        typeof navigator.getUserMedia === 'function';
    },
    /**
     * Extends an existing object using deep copy.
     * Note: It will only deep-copy instances of Object.
     * @param destination
     * @param source
     * @returns {*} destination
     */
    extend = function (destination, source) {
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

  // update `utils` namespace under `ATT`
  mainModule.utils = {
    hasWebRTC: hasWebRTC,
    createNamespace: createNamespace,
    extend: extend,
    inherits: inherits
  };

  if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = mainModule;
  }

}(ATT));

