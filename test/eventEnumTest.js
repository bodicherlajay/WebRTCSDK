/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//TODO Add more tests
describe('EventEnums', function () {
    it('should contain Event Type CALLING', function (){
        expect(ATT.Event.CALLING).equals(1);
    });
});
