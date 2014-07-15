/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */

/**
 *  The WebRTC SDK.
 *  @fileOverview Handles all the calls related to web rtc
 *  @namespace ATT.rtc.Phone
 *  @overview ATT RTC SDK [TODO: To be filled by marketing?]
 *  @copyright AT&T [TODO: what we show here]
 *  @class ATT.rtc.Phone
 *  @license [TODO: to be filled by marketing]
 *  @classdesc RTC Phone Implementation [TODO: to be filled by marketing]
 */
(function () {
  'use strict';

//  /**
//   * @summary
//   * Cancel an outgoing call before it's completed.
//   * @desc
//   * Similar to hangup, but before the call is connected.
//   */
//  function cancel() {
//    try {
//      rtcManager.cancelCall();
//    } catch (e) {
//      ATT.Error.publish('SDK-20034', null);
//    }
//  }
//
//  /**
//   * @summary
//   * Reject an incoming call
//   * @desc
//  * Rejects an incoming call
//  */
//  function reject() {
//    try {
//      if (!rtcManager) {
//        throw 'Unable to reject a web rtc call. There is no valid RTC manager to perform this operation';
//      }
//      rtcManager.rejectCall();
//    } catch (e) {
//      ATT.Error.publish('SDK-20035', null);
//    }
//  }
//

  function Phone() {

    var emitter = ATT.private.factories.createEventEmitter(),
      session = new ATT.rtc.Session(),
      call = null;

    session.on('call-incoming', function () {
      emitter.publish('call-incoming');
    });

    function getSession() {
      return session;
    }

    function on(event, handler) {
      if ('session-ready' !== event
          && 'session-disconnected' !== event
          && 'dialing' !== event
          && 'answering' !== event
          && 'call-incoming' !== event
          && 'call-connecting' !== event
          && 'call-disconnecting' !== event
          && 'call-disconnected' !== event
          && 'call-canceled' !== event
          && 'call-rejected' !== event
          && 'call-connected' !== event
          && 'call-muted' !== event
          && 'call-unmuted' !== event
          && 'call-hold' !== event
          && 'call-resume' !== event
          && 'address-updated' !== event
          && 'call-established' !== event
          && 'call-error' !== event) {
        throw new Error('Event not defined');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }

    function login(options) {
      if (undefined === options) {
        //todo remove throw and publish it using error callback handler
        throw new Error(ATT.errorDictionary.getSDKError('2002').ErrorMessage);
      }
      if (undefined === options.token) {
        //todo remove throw and publish it using error callback handler
        throw new Error(ATT.errorDictionary.getSDKError('2001').ErrorMessage);
      }

      session.on('ready', function (data) {
        emitter.publish('session-ready', data);
      });

      session.connect(options);
    }

    function logout() {
      session.on('disconnected', function (data) {
        emitter.publish('session-disconnected', data);
      });

      session.disconnect();

      session = undefined;
    }

    function dial(options) {

      if (undefined === options) {
        throw new Error('Options not defined');
      }

      if (undefined === options.localMedia) {
        throw new Error('localMedia not defined');
      }

      if (undefined === options.remoteMedia) {
        throw new Error('remoteMedia not defined');
      }

      if (undefined === options.destination) {
        throw new Error('Destination not defined');
      }

      emitter.publish('dialing');

      call = session.createCall({
        peer: options.destination,
        type: ATT.CallTypes.OUTGOING,
        mediaType: options.mediaType,
        localMedia: options.localMedia,
        remoteMedia: options.remoteMedia
      });

      call.on('connecting', function () {
        emitter.publish('call-connecting');
      });
      call.on('canceled', function () {
        emitter.publish('call-canceled');
      });
      call.on('rejected', function () {
        emitter.publish('call-rejected');
      });
      call.on('connected', function () {
        emitter.publish('call-connected');
      });
      call.on('established', function () {
        emitter.publish('call-established');
      });
      call.on('hold', function () {
        emitter.publish('call-hold');
      });
      call.on('resume', function () {
        emitter.publish('call-resume');
      });
      call.on('disconnected', function (data) {
        emitter.publish('call-disconnected', data);
        session.deleteCurrentCall();
      });
      call.on('error', function () {
        emitter.publish('call-error');
      });

      call.connect(options);


    }

    function answer(options) {

      if (undefined === options) {
        throw new Error('Options not defined');
      }

      if (undefined === options.localMedia) {
        throw new Error('localMedia not defined');
      }

      if (undefined === options.remoteMedia) {
        throw new Error('remoteMedia not defined');
      }

      emitter.publish('answering');

      call = session.currentCall;

      if (call === null) {
        throw new Error('Call object not defined');
      }

      call.on('connecting', function () {
        emitter.publish('call-connecting');
      });
      call.on('canceled', function () {
        emitter.publish('call-canceled');
      });
      call.on('rejected', function () {
        emitter.publish('call-rejected');
      });
      call.on('connected', function () {
        emitter.publish('call-connected');
      });
      call.on('established', function () {
        emitter.publish('call-established');
      });
      call.on('hold', function () {
        emitter.publish('call-hold');
      });
      call.on('resume', function () {
        emitter.publish('call-resume');
      });
      call.on('error', function () {
        emitter.publish('call-error');
      });
      call.on('disconnected', function (data) {
        emitter.publish('call-disconnected', data);
        session.deleteCurrentCall();
      });

      call.connect(options);
    }

    function mute() {
      call.on('muted', function () {
        emitter.publish('call-muted');
      });

      call.mute();
    }

    function unmute() {
      call.on('unmuted', function () {
        emitter.publish('call-unmuted');
      });

      call.unmute();
    }

    function getMediaType() {
      return call ? call.mediaType : null;
    }

    function hangup() {
      call.on('disconnecting', function () {
        emitter.publish('call-disconnecting');
      });
      call.disconnect();
    }

    function reject() {
      call.reject();
    }

    function hold() {
      call.hold();
    }

    function resume() {
      call.resume();
    }

    function  updateE911Id(options) {
      session.on('address-updated', function () {
        emitter.publish('address-updated');
      });

      session.updateE911Id(options);
    }

    this.on = on.bind(this);
    this.getSession = getSession.bind(this);
    this.login = login.bind(this);
    this.logout = logout.bind(this);
    this.dial = dial.bind(this);
    this.answer = answer.bind(this);
    this.mute = mute.bind(this);
    this.unmute = unmute.bind(this);
    this.getMediaType = getMediaType.bind(this);
    this.hangup = hangup.bind(this);
    this.hold = hold.bind(this);
    this.resume = resume.bind(this);
    this.reject = reject.bind(this);
    this.updateE911Id = updateE911Id.bind(this);
    this.cleanPhoneNumber = ATT.phoneNumber.cleanPhoneNumber;
    this.formatNumber = ATT.phoneNumber.formatNumber;
  }


  if (undefined === ATT.private) {
    throw new Error('Error exporting ATT.private.Phone.');
  }
  ATT.private.Phone = Phone;

  if (undefined === ATT.rtc) {
    throw new Error('Error exporting ATT.rtc.Phone.');
  }
  ATT.rtc.Phone = (function () {
    var instance;

    return {
      getPhone: function () {
        if (undefined === instance) {
          instance = new ATT.private.Phone();
        }
        return instance;
      }
    };
  }());

}());
