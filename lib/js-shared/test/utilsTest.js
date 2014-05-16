/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, describe, it, afterEach, beforeEach, expect, xit, sinon*/

describe('ATT.utils namespace', function () {
  'use strict';

  it('should have method `hasWebRTC`', function () {
    expect(ATT.utils.hasWebRTC).to.be.a('function');
  });
  it('should have method `extend`', function () {
    expect(ATT.utils.extend).to.be.a('function');
  });
  it('should have method `inherits`', function () {
    expect(ATT.utils.inherits).to.be.a('function');
  });
  it('should have method `createNamespace`', function () {
    expect(ATT.utils.createNamespace).to.be.a('function');
  });

  it('hasWebRTC should return true', function () {
    var hasWebRTC = ATT.utils.hasWebRTC;
    expect(hasWebRTC).to.be.a('function');
  });
  it('extend should return an object with the properties of the source object', function () {
    var target = {z: 'z'},
      source = {a: 'a', b: 'b'};
    target = ATT.utils.extend(target, source);
    expect(target.a).to.equal(source.a);
    expect(target.b).to.equal(source.b);
  });
  it('inherits should set the prototype of an object to that of the specified class', function () {
    var obj = {};
    ATT.utils.inherits(obj, String);
    expect(obj.prototype instanceof String).to.equal(true);
    expect(String === obj.super).to.equal(true);
  });
  it('should create namespace a.b.c on X namespace', function () {
    var X = {};
    ATT.utils.createNamespace(X, 'a.b.c');
    expect(X.a.b.c).to.be.an('object');
  });
});