/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/
describe('SDPFilter', function () {
    it('should be a singleton', function (){
        var instance1 = ATT.sdpFilter.getInstance();
        var instance2 = ATT.sdpFilter.getInstance();
        expect(instance1).equals(instance2);
    });
});
