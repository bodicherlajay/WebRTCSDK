/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, describe:true,it:true,expect:true, assert:true*/

//TODO Add more tests
describe('ATT Enums', function () {
  "use strict";

  it('should contain Needed Enums', function () {
    assert.typeOf(ATT.UserTypes, 'object');
    assert.typeOf(ATT.SdkEvents, 'object');
    assert.typeOf(ATT.SessionEvents, 'object');
    assert.typeOf(ATT.CallStatus, 'object');
    assert.typeOf(ATT.RTCCallEvents, 'object');
    assert.typeOf(ATT.MediaTypes, 'object');
  });

  it('should have `frozen` Enums', function () {
    assert.isTrue(Object.isFrozen(ATT.UserTypes));
    assert.isTrue(Object.isFrozen(ATT.SdkEvents));
    assert.isTrue(Object.isFrozen(ATT.SessionEvents));
    assert.isTrue(Object.isFrozen(ATT.CallStatus));
    assert.isTrue(Object.isFrozen(ATT.RTCCallEvents));
    assert.isTrue(Object.isFrozen(ATT.MediaTypes));
  });
});