/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */

/**
 *  The WebRTC SDK.
 *  @file Handles all the calls related to WebRTC
 *  @namespace Phone
 *  @overview ATT RTC SDK [TODO: To be filled by marketing?]
 *  @copyright AT&T [TODO: what we show here]
 *  @ ATT.rtc.Phone
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

  /** 
    Creates a new Phone.
    @global
    @class Represents a Phone.
    @constructor
  */
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
          && 'media-established' !== event
          && 'call-error' !== event) {
        throw new Error('Event not defined');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }

  /**
    * @summary Creates a WebRTC Session.
    * @desc Used to establish webRTC session so that the user can place webRTC calls.
    * The service parameter indicates the desired service such as audio or video call
    * @memberOf Phone
    * @instance
    * @param {Object} options
    * @param {String} options.token OAuth Access Token.
    * @param {String} options.e911Id E911 Id. Optional parameter for NoTN users. Required for ICMN and VTN users
    * @fires Phone#session-ready  This callback gets invoked when SDK is initialized and ready to make, receive calls
    * @example
    *
      phone.login({
        token: token,
        e911Id: e911Id
      });
   */
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
        /**
        * Session Ready event.
        *
        * @event Phone#session-ready
        * @type {object}
        * @property {String} sessionId - The ID of the session.
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('session-ready', data);
      });

      session.connect(options);
    }

    /**
    * @summary Deletes the current RTC Session
    * @desc
    * Logs out the user from RTC session. When invoked webRTC session gets deleted, future event channel polling
    * requests gets stopped
    * @memberof Phone
    * @instance
    * @fires Phone#session-disconnected  This callback gets invoked when the session gets successfully deleted
    * @fires Phone#error  This callback gets invoked while encountering issues
    * @example
    * var phone = ATT.rtc.Phone.getPhone();
    * phone.logout();
    */
    function logout() {
      session.on('disconnected', function (data) {
        /**
        * Session Disconnected event.
        *
        * @event Phone#session-disconnected
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('session-disconnected', data);
      });

      session.disconnect();

      session = undefined;
    }

  /**
   * @summary
   * Start a call.
   * @param {Object} options
   * @memberOf Phone
   * @instance
   * @param {String} options.destination The Phone Number or User Id of the called party.
   * @param {HTMLElement} options.localVideo
   * @param {HTMLElement} options.remoteVideo
   * @param {String} options.mediaType
   
   * @fires Phone#dialing This callback function gets invoked immediately.
   * @fires Phone#call-connecting Indicates succesful creation of the call.
   * @fires Phone#call-cancelled
   * @fires Phone#call-rejected
   * @fires Phone#call-connected
   * @fires Phone#media-established This callback function gets invoked when both
   *        parties are completed negotiation and engaged in active conversation.
   * @fires Phone#call-hold This callback function gets invoked when hold call is successful
   * @fires Phone#call-resume This callback function gets invoked when the current call successfully resumed
   * @fires Phone#call-disconnected This callback function gets invoked when outgoing call is ended
   * @fires Phone#call-error This callback function gets invoked when encountering issues during the call flow

   * @example
    // Start video call with an ICMN User
    phone.dial({  
      destination: '11231231234',
      mediaType: 'video',
      localMedia: document.getElementById('localVideo'),
      remoteMedia: document.getElementById('remoteVideo'),
    };
    @example  
    // Start audio call with a NoTN/VTN User
    phone.dial({  
      destination: 'john@domain.com',
      mediaType: 'audio',
      localMedia: document.getElementById('localVideo'),
      remoteMedia: document.getElementById('remoteVideo'),
    };
   */
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

      /**
      * Dialing event.
      *
      * @event Phone#dialing
      * @type {object}
      * @property {Date} timestamp - Event fire time.
      */
      emitter.publish('dialing');

      call = session.createCall({
        peer: options.destination,
        type: ATT.CallTypes.OUTGOING,
        mediaType: options.mediaType,
        localMedia: options.localMedia,
        remoteMedia: options.remoteMedia
      });

      call.on('connecting', function () {

        /**
        * Call connecting event.
        *
        * @event Phone#call-connecting
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-connecting');
      });
      call.on('canceled', function () {
        /**
        * Call canceled event.
        *
        * @event Phone#call-canceled
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-canceled');
      });
      call.on('rejected', function () {
        /**
        * Call rejected event.
        *
        * @event Phone#call-rejected
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-rejected');
      });
      call.on('connected', function () {
        /**
        * Call connected event.
        *
        * @event Phone#call-connected
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-connected');
      });
      call.on('media-established', function () {
        /**
        * Media established event.
        *
        * @event Phone#media-established
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('media-established');
      });
      call.on('hold', function () {
        /**
        * Call on hold event.
        *
        * @event Phone#call-hold
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-hold');
      });
      call.on('resume', function () {
        /**
        * Call resumed event.
        *
        * @event Phone#call-resume
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-resume');
      });
      call.on('disconnected', function (data) {
        /**
        * Call disconnected event.
        *
        * @event Phone#call-disconnected
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-disconnected', data);
        session.deleteCurrentCall();
      });
      call.on('error', function () {
        /**   
        * Call Error event.
        *
        * @event Phone#call-error
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
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
      call.on('media-established', function () {
        emitter.publish('media-established');
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
      call = session.currentCall;

      if (undefined === call || null === call) {
        throw new Error('Call object not defined');
      }
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

  /**
  * AT&T SDK.
  * @namespace ATT
  */

  /**
  * Real-Time Communications functionality.
  * @namespace ATT.rtc
  */

  /**
  * Phone API for RTC functionality.
  * @namespace ATT.rtc.Phone
  */

  ATT.rtc.Phone = (function () {
    var instance;

    return {
      /**
      * @summary Get the current instance of Phone.
      * @description There can only be one instance of the Phone object.
      * @function getPhone 
      * @static
      * @memberof ATT.rtc.Phone
      * @returns {Phone} A Phone object.
      */
      getPhone: function () {
        if (undefined === instance) {
          instance = new ATT.private.Phone();
        }
        return instance;
      }
    };
  }());

}());
