/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam: true*/
/*global ATT:true, describe, beforeEach, afterEach, it, sinon, assert, expect, done*/

/**
 * Unit tests for event emitter module.
 */
'use strict';

describe('Event emitter', function () {

  describe('Constructor', function () {
    it('should export ATT.private.factories.createEventEmitter', function () {
      expect(ATT.private.factories.createEventEmitter).to.be.a('function');
    });
    it('should return return an object', function () {
      var eventEmitter = ATT.private.factories.createEventEmitter();
      expect(eventEmitter).to.be.an('object');
    });

    describe('Different instances should not share topics', function () {
      var eventEmitter1,
        eventEmitter2;

      beforeEach(function () {
        eventEmitter1 = ATT.private.factories.createEventEmitter();
        eventEmitter2 = ATT.private.factories.createEventEmitter();
      });

      it('should return different instances of eventEmitter for each call', function () {
        expect(eventEmitter1).to.not.equal(eventEmitter2);
      });

      it('should return different `topics` array for different instances of emitters', function () {
        expect(eventEmitter1.getTopics()).to.not.equal(eventEmitter2.getTopics());
      });
    });
  });

  describe('Methods', function () {
    var eventEmitter;

    beforeEach(function () {
      eventEmitter = ATT.private.factories.createEventEmitter();
    });

    describe('getTopics', function () {
      it('should exists a getTopics function', function () {
        expect(eventEmitter.getTopics).to.be.a('function');
      });

      it('should return an emtpy object if no topics have been created', function () {
        var topics = eventEmitter.getTopics();
        expect(Object.keys(topics).length).to.equal(0);
      });
      it('should return topics object', function () {
        expect(eventEmitter.getTopics()).to.be.an('object');
      });

    });

    describe('subscribe', function () {
      it('should exist', function () {
        expect(eventEmitter.subscribe).to.be.a('function');
      });

      it('should return false if the `topic` is invalid', function () {
        var callback = function () { return; },
          context = null;
        expect(eventEmitter.subscribe('', callback, context)).to.equal(false);
        expect(eventEmitter.subscribe(null, callback, context)).to.equal(false);
        expect(eventEmitter.subscribe(undefined, callback, context)).to.equal(false);
      });

      it('should return false if the `callback` is not a function', function () {
        var context = null;
        expect(eventEmitter.subscribe('bogus', undefined, context)).to.equal(false);
      });

      it('should return false if `context` is `null` or if it\'s not an object', function () {
        expect(eventEmitter.subscribe('bogus', function () { return; }, null)).to.equal(false);
        expect(eventEmitter.subscribe('bogus', function () { return; }, 'anystring')).to.equal(false);
        expect(eventEmitter.subscribe('bogus', function () { return; }, 123)).to.equal(false);
      });

      it('should return true when context is not passed as a parameter', function () {
        expect(eventEmitter.subscribe('bogus', function () { return; })).to.equal(true);
        expect(eventEmitter.subscribe('bogus', function () { return; }, undefined)).to.equal(true);
      });

      it('should add a topic to the list of topics', function () {
        var topics,
          currentTopic = 'arun',
          eventEmitter3 = ATT.private.factories.createEventEmitter();

        topics = eventEmitter3.getTopics();
        expect(Object.keys(topics).length).to.equal(0);

        eventEmitter3.subscribe(currentTopic, function () { return; });
        expect(Object.keys(topics).length).to.equal(1);
      });

      it('should add a subscriber to an existing topic', function () {
        var topic = 'addSubscriber',
          subscribers,
          handler = function () { return; },
          handler2 = function () { return; };

        eventEmitter.subscribe(topic, handler);
        subscribers = eventEmitter.getTopics()[topic];
        expect(subscribers.length).to.equal(1);

        eventEmitter.subscribe(topic, handler2);
        subscribers = eventEmitter.getTopics()[topic];
        expect(subscribers.length).to.equal(2);
      });
    });

    describe('publish', function () {
      it('should exist', function () {
        expect(eventEmitter.publish).to.be.a('function');
      });

      it('should return false if the `topic` does not exist', function () {
        expect(eventEmitter.publish('notopic')).to.equal(false);
      });

      it('should call registered callbacks for a topic.', function (done) {
        var onHandlerSpy = sinon.spy();

        eventEmitter.subscribe('publish', onHandlerSpy);
        eventEmitter.publish('publish');

        setTimeout(function () {
          try {
            expect(onHandlerSpy.called).to.equal(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      });

      it('should not publish to events on an unsubscribed topic', function () {
        var handlerSpy = sinon.spy(),
          topic = 'toUnsubscribe';

        eventEmitter.subscribe(topic, handlerSpy);
        eventEmitter.unsubscribe(topic, handlerSpy);

        eventEmitter.publish(topic);
        expect(handlerSpy.called).to.equal(false);
      });
    });

    describe('unsubscribe', function () {

      it('should exist', function () {
        expect(eventEmitter.unsubscribe).to.be.a('function');
      });

      it('should return false if topic not found', function () {
        expect(eventEmitter.unsubscribe('notfound', function () { return; })).to.equal(false);
      });

      it('should throw error if `callback` is not a function', function () {
        var topic = 'topic';
        eventEmitter.subscribe(topic, function () { return; });
        expect(eventEmitter.unsubscribe.bind(eventEmitter, topic, 'asdf')).to.throw('Must pass in the callback you are unsubscribing');
      });

      it('should return true if `callback` is found for an existent `topic`', function () {
        var topic = 'topic',
          handler = function () { return; };
        eventEmitter.subscribe(topic, handler);
        expect(eventEmitter.unsubscribe(topic, handler)).to.equal(true);
      });
      it('should return false if `callback` is not a found for an existent `topic`', function () {
        var topic = 'topic';
        eventEmitter.subscribe(topic, function () { return; });
        expect(eventEmitter.unsubscribe(topic, function () { return; })).to.equal(false);
      });

      it('should remove the subscriber from an existing topic', function () {
        var topic = "removeSubscriber",
          handler1 = function () { return; },
          handler2 = function () { return; };

        eventEmitter = ATT.private.factories.createEventEmitter();

        eventEmitter.subscribe(topic, handler1);
        eventEmitter.subscribe(topic, handler2);

        eventEmitter.unsubscribe(topic, handler1);

        expect(eventEmitter.getTopics()[topic].length).to.equal(1);
      });

      it('should remove a topic when the last subscriber unsubscribes', function () {
        var topic = "lastsubscriber",
          handler = function () { return; },
          eventEmitterToEmtpy = ATT.private.factories.createEventEmitter();

        eventEmitterToEmtpy.subscribe(topic, handler);
        eventEmitterToEmtpy.unsubscribe(topic, handler);

        expect(eventEmitterToEmtpy.getTopics()[topic]).to.equal(undefined);
      });

    });
  });
});
