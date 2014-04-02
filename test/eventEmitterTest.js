/**
 * Unit tests for event emitter module.
 */
describe('Event emitter', function() {

    beforeEach(function () {});

    afterEach(function () {});

    it ('should contain subscribe, unsubscribe, and publish functions (on ATT.event).', function () {
        ATT.event.subscribe.should.be.a('function');
        ATT.event.unsubscribe.should.be.a('function');
        ATT.event.publish.should.be.a('function');
    });

    it('should call registered callbacks for a topic.', function (done) {
        var subscribe1Spy = sinon.spy(function (arg1, arg2) {
          expect(subscribe1Spy.calledWith(123, 'abc')).to.be.true;
          done();
        });

      var subscribe2Spy = sinon.spy(function (arg1, arg2) {
        expect(subscribe2Spy.called).to.be.true;
        expect(subscribe2Spy.calledWith(123, 'abc')).to.be.true;
        done();
      });

        ATT.event.subscribe('topicXYZ', subscribe1Spy);
        ATT.event.subscribe('topicXYZ', subscribe2Spy);
        ATT.event.publish('topicXYZ', 123, 'abc');
        expect(ATT.event.publish('topicXYZ', 123, 'abc')).to.be.true;
    });

    it('shouldnt call callbacks not registered on a topic', function (done) {
      var subscribe1Spy = sinon.spy(function (arg1, arg2) {
        expect(subscribe1Spy.called).to.be.true;
        expect(subscribe1Spy.calledWith(123)).to.be.true;
        done();
      });

      var subscribe2Spy = sinon.spy(function (arg1, arg2) {
        expect(subscribe2Spy.called).to.be.false;
        expect(subscribe2Spy.calledWith(123)).to.be.false;
        done();
      });
      
        ATT.event.subscribe('topicABC', subscribe1Spy);
        ATT.event.subscribe('topicXYZ', subscribe2Spy);
        ATT.event.publish('topicABC', 123);
    });

    it('should not call callbacks that have been unsubscribed from topic', function (done) {
      var subscribe1Spy = sinon.spy(function (arg1) {
        expect(subscribe1Spy.callCount).to.equal(1);
        done();
      });
            
        ATT.event.subscribe('topicABC', subscribe1Spy);
        ATT.event.publish('topicABC', 123);
        
        
        ATT.event.unsubscribe('topicABC', subscribe1Spy);
        ATT.event.publish('topicABC', 123);
    });

    it('should call callback every time publish called.', function (done) {
      var cnt = 0;
      var subscribe1Spy = sinon.spy(function () {
        cnt += 1;
        
        // need to return closure to keep track of cnt calls
        return {
            getCount: function () {
              return cnt;
            }
        };
      });
      
      ATT.event.subscribe('topicABC', subscribe1Spy);
      ATT.event.publish('topicABC', 123);
      expect(subscribe1Spy().getCount()).to.equal(1);
      
      ATT.event.publish('topicABC', 123);
      expect(subscribe1Spy().getCount()).to.equal(2);
      
      done();
    });

    it('should return false if unsubscribing non-existent topic and shouldn\'t unsubscribe callback', function () {
      
      var subscribe1Spy = sinon.spy(function () {
        expect(subscribe1Spy.callCount).to.equal(1);
        done();
      });

        ATT.event.subscribe('topicABC', subscribe1Spy);
        expect(ATT.event.unsubscribe('topicAAA', subscribe1Spy)).to.be.false;
        
        ATT.event.publish('topicABC');
    });
    
    it('shouldn\'t call any callbacks on non-existent topic', function () {
      var subscribe1Spy = sinon.spy(function () {
        expect(ATT.event.publish('topicBBB')).to.be.false;
        expect(subscribe1Spy.callCount).to.equal(0);
        done();
      });

        ATT.event.subscribe('topicABC', subscribe1Spy);
    });
});