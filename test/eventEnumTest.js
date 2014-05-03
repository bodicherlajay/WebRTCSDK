/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, describe:true,it:true,expect:true*/

//TODO Add more tests
describe.only('EventEnums', function () {
  "use strict";
  it('should contain Event Type CALLING', function () {
    expect(ATT.CallStatus.CALLING).equals(1);
  });
});
