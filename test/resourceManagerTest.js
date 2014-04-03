/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global Env:true*/
describe('ResourceManager', function () {
    it('should be a singleton', function (){
        var instance1 = Env.resourceManager.getInstance();
        var instance2 = Env.resourceManager.getInstance();
        expect(instance1).equals(instance2);
    });
});
