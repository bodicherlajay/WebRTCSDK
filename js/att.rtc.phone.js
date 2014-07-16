/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT:true, RESTClient, Env, cmgmt */

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

    /**
    * @summary
    * Get the current WebRTC Session.
    * @memberOf Phone
    * @instance
    * @returns {Session} The current Session.

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.getSession();
    */
    function getSession() {
      return session;
    }
   /**
    * @summary
    * Subscribe to events on a Phone object.
    * @memberOf Phone
    * @instance

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.on('session-ready', function (data) {
        // ... do something
      });
    */
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
    * @fires Phone#session-ready
    * @example
    *
      var phone = ATT.rtc.Phone.getPhone();
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
        * @desc Indicates the SDK is initialized and ready to make, receive calls
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
    * @fires Phone#session-disconnected
    * @fires Phone#call-error
    * @example
    * var phone = ATT.rtc.Phone.getPhone();
    * phone.logout();
    */
    function logout() {
      session.on('disconnected', function (data) {
        /**
        * Session Disconnected event.
        * @desc Session was successfully deleted.
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
   
   * @fires Phone#dialing
   * @fires Phone#call-connecting
   * @fires Phone#call-canceled
   * @fires Phone#call-rejected
   * @fires Phone#call-connected
   * @fires Phone#media-established
   * @fires Phone#call-hold
   * @fires Phone#call-resume
   * @fires Phone#call-disconnected
   * @fires Phone#call-error

   * @example
    // Start video call with an ICMN User
    var phone = ATT.rtc.Phone.getPhone();
    phone.dial({  
      destination: '11231231234',
      mediaType: 'video',
      localMedia: document.getElementById('localVideo'),
      remoteMedia: document.getElementById('remoteVideo'),
    };
    @example  
    // Start audio call with a NoTN/VTN User
    var phone = ATT.rtc.Phone.getPhone();
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
      * @desc Triggered immediately.
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
        * @desc Indicates succesful creation of the call.
        * @event Phone#call-connecting
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-connecting');
      });
      call.on('canceled', function () {
        /**
        * Call canceled event.
        * @desc Succesfully canceled the current call.
        * @event Phone#call-canceled
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-canceled');
      });
      call.on('rejected', function () {
        /**
        * Call rejected event.
        * @desc Successfully rejected an incoming call.
        * @event Phone#call-rejected
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-rejected');
      });
      call.on('connected', function () {
        /**
        * Call connected event.
        * @desc Successfully established a call.
        * @event Phone#call-connected
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-connected');
      });
      call.on('media-established', function () {
        /**
        * Media established event.
        * @desc Triggered when both parties are completed negotiation 
        * and engaged in active conversation.
        * @event Phone#media-established
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('media-established');
      });
      call.on('hold', function () {
        /**
        * Call on hold event.
        * @desc Successfully put the current call on hold.
        * @event Phone#call-hold
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-hold');
      });
      call.on('resume', function () {
        /**
        * Call resumed event.
        * @desc Successfully resume a call that was on hold.
        * @event Phone#call-resume
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-resume');
      });
      call.on('disconnected', function (data) {
        /**
        * Call disconnected event.
        * @desc Successfully disconnected the current call.
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
        * @desc Indicates an error condition during a call's flow
        *
        * @event Phone#call-error
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-error');
      });

      call.connect(options);
    }

  /**
   * @summary
   * Answer an incoming call
   * @desc
   * When call arrives via an incoming call event, call can be answered by using this method
   * @memberof Phone
   * @instance
   * @param {Object} options
   * @param {HTMLElement} options.localVideo
   * @param {HTMLElement} options.remoteVideo

   * @fires Phone#call-connecting
   * @fires Phone#call-canceled
   * @fires Phone#call-rejected
   * @fires Phone#call-connected
   * @fires Phone#media-established
   * @fires Phone#call-hold
   * @fires Phone#call-resume
   * @fires Phone#call-disconnected
   * @fires Phone#call-error

   * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.answer({
        localMedia: document.getElementById('localVideo'),
        remoteMedia: document.getElementById('remoteVideo')
      });
   */
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

    /**
    * @summary
    * Mute the current call.
    * @memberOf Phone
    * @instance

    * @fires Phone#call-muted
    * @fires Phone#call-error

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.mute();
    */
    function mute() {
      call.on('muted', function () {
        /**
        * Call muted event.
        * @desc Call was successfully muted.
        *
        * @event Phone#call-muted
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-muted');
      });

      call.mute();
    }

    /**
    * @summary
    * Unmute the current call.
    * @memberOf Phone
    * @instance

    * @fires Phone#call-unmuted
    * @fires Phone#call-error

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.unmute();
    */
    function unmute() {
      call.on('unmuted', function () {
        /**
        * Call unmuted event.
        * @desc Call was successfully unmuted.
        *
        * @event Phone#call-unmuted
        * @type {object}
        * @property {Date} timestamp - Event fire time.
        */
        emitter.publish('call-unmuted');
      });

      call.unmute();
    }

    /**
    * @summary
    * Get the media type of the current call.
    * @memberOf Phone
    * @instance

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.getMediaType();
    */
    function getMediaType() {
      return call ? call.mediaType : null;
    }

    /**
    * @summary
    * Hangup current call.
    * @memberOf Phone
    * @instance

    * @fires Phone#call-disconnected
    * @fires Phone#call-error

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.hangup();
    */
    function hangup() {
      call.on('disconnecting', function () {
        emitter.publish('call-disconnecting');
      });
      call.disconnect();
    }

   /**
    * @summary
    * Reject current incoming call.
    * @memberOf Phone
    * @instance

    * @fires Phone#call-rejected
    * @fires Phone#call-error

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.reject();
    */
    function reject() {
      call = session.currentCall;

      if (undefined === call || null === call) {
        throw new Error('Call object not defined');
      }
      call.on('call-disconnected', function () {
        emitter.publish('call-rejected');
      });
      call.reject();
    }

   /**
   * @summary
   * Put the current call on hold.
   * @memberOf Phone
   * @instance
   
   * @fires Phone#call-hold
   * @fires Phone#call-error

   * @example
    var phone = ATT.rtc.Phone.getPhone();
    phone.hold();
   */
    function hold() {
      call.hold();
    }

    /**
    * @summary
    * Resume the current call that is on hold.
    * @memberOf Phone
    * @instance

    * @fires Phone#call-resume
    * @fires Phone#call-error

    * @example
    var phone = ATT.rtc.Phone.getPhone();
    phone.resume();
    */
    function resume() {
      call.resume();
    }

    /**
    * @summary
    * Update the E911 current call.
    * @memberOf Phone
    * @instance

    * @fires Phone#call-error

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.updateE911Id({
        e911Id: e911AddressId
      }); 
    */
    function updateE911Id(options) {
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
