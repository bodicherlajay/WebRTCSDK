/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, nomen:true */

var util = {
  extend: function (destination, source) {
    "use strict";
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

  inherits: function (ctor, superCtor) {
    "use strict";
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  }
};