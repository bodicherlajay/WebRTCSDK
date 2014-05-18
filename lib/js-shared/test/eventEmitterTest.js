/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam: true*/
/*global ATT:true, describe, beforeEach, afterEach, it, sinon, assert, expect, done*/

/**
 * Unit tests for event emitter module.
 */
'use strict';

describe('Event emitter', function () {

  beforeEach(function () {
    console.log('Executing `beforeEach`...');
  });

  afterEach(function () {
    console.log('Executing `afterEach`...');
  });

  it('should contain subscribe, unsubscribe, and publish functions (on ATT.event).', function () {
    ATT.event.subscribe.should.be.a('function');
    ATT.event.unsubscribe.should.be.a('function');
    ATT.event.publish.should.be.a('function');
  });

  it('should call registered callbacks for a topic.', function (done) {
    var callbackSpy;

    // defining a callback with two arguments
    callbackSpy = sinon.spy(function (arg1, arg2) {
      assert(expect(callbackSpy.called).to.be.true);
      assert(expect(callbackSpy.calledWith(123, 'abc')).to.be.true);
      done();
    });

    // use `callback` everytime there's an update on `topicXYZ`
    ATT.event.subscribe('topicXYZ', callbackSpy);
    // publishing an update on `topicXYZ` with two params
    ATT.event.publish('topicXYZ', 123, 'abc');
  });

  it('shouldnt call callbacks not registered on a topic', function (done) {
    var subscribe1Spy, subscribe2Spy;
    subscribe1Spy = sinon.spy(function (arg1, arg2) {
      assert(expect(subscribe1Spy.called).to.be.true);
      assert(expect(subscribe1Spy.calledWith(123)).to.be.true);
      done();
    });

    subscribe2Spy = sinon.spy(function (arg1, arg2) {
      assert(expect(subscribe2Spy.called).to.be.false);
      assert(expect(subscribe2Spy.calledWith(123)).to.be.false);
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
    var subscribe1Spy, cnt;
    cnt = 0;
    subscribe1Spy = sinon.spy(function () {
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
    assert(expect(subscribe1Spy().getCount()).to.equal(2));
    done();
  });

  it('should return false if unsubscribing non-existent topic and shouldn\'t unsubscribe callback', function () {

    var subscribe1Spy = sinon.spy(function () {
      expect(subscribe1Spy.callCount).to.equal(1);
    });

    ATT.event.subscribe('topicABC', subscribe1Spy);
    assert(expect(ATT.event.unsubscribe('topicAAA', subscribe1Spy)).to.be.false);

    ATT.event.publish('topicABC');
  });

  it('shouldn\'t call any callbacks on non-existent topic', function () {
    var subscribe1Spy = sinon.spy(function () {
      assert(expect(ATT.event.publish('topicBBB')).to.be.false);
      expect(subscribe1Spy.callCount).to.equal(0);
      done();
    });

    ATT.event.subscribe('topicABC', subscribe1Spy);
  });

  it('unsubscribe should throw error if no function passed in.', function () {
    ATT.event.subscribe('topicABC');
    expect(ATT.event.unsubscribe.bind(ATT.event, 'topicABC'))
      .to.throw('Must pass in the callback you are unsubscribing');
  });
});
