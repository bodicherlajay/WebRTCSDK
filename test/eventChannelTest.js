/**
 * Unit tests for event channel module.
 */
describe('Event Channel', function() {
    
    beforeEach(function() {});

    afterEach(function() {});

    it ('should contain eventChannel function (on ATT.WebRTC).', function () {
        ATT.WebRTC.eventChannel.should.be.a('function');
    });
});