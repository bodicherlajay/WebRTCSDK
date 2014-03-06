'use strict';

describe('This', function() {

    it('is a test', function() {
        var unit = foo.foo;

        unit.should.equal('foo');
        expect(unit).to.equal('foo');
        assert.equal(unit, 'foo');
    });

});