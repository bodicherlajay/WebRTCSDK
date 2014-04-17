/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, nomen:true */

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
            destination[property] = this.extend(source[property]);
          }
        }
      }
      return destination;
    },
    inherits = function (ctor, superCtor) {
      ctor.super_ = superCtor;
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

  app.utils = {
    createNamespace: createNamespace,
    extend: extend,
    hasWebRTC: hasWebRTC,
    inherits: inherits
  };
}(ATT));