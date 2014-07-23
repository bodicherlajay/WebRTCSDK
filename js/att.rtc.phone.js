/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT*/

(function () {
  'use strict';

  var logManager = ATT.logManager.getInstance(),
    logger = logManager.addLoggerForModule('Phone');

  /**
    Creates a new Phone.
    @global
    @class Represents a Phone.
    @constructor
  */
  function Phone() {

    var emitter = ATT.private.factories.createEventEmitter(),
      session = new ATT.rtc.Session(),
      errorDictionary = ATT.errorDictionary;

    session.on('call-incoming', function (data) {
      emitter.publish('call-incoming', data);
    });

    session.on('error', function (data) {
      emitter.publish('error', data);
    });

    function publishError(error) {
      emitter.publish('error', {
        error: error
      });
    }

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
          && 'call-held' !== event
          && 'call-resumed' !== event
          && 'address-updated' !== event
          && 'media-established' !== event
          && 'error' !== event) {
        throw new Error('Event ' + event + ' not defined');
      }

      emitter.unsubscribe(event, handler);
      emitter.subscribe(event, handler, this);
    }

  /**
    * @summary Creates a WebRTC Session.
    * @desc Used to establish webRTC session so that the user can place webRTC calls.
    * The service parameter indicates the desired service such as audio or video call
    * Throw errors 2001, 2002, 2004, 2005
    * @memberOf Phone
    * @instance
    * @param {Object} options
    * @param {String} options.token OAuth Access Token.
    * @param {String} options.e911Id E911 Id. Optional parameter for NoTN users. Required for ICMN and VTN users
    * @fires Phone#session-ready
    * @fires Phone#error
    * @example
    *
      var phone = ATT.rtc.Phone.getPhone();
      phone.login({
        token: token,
        e911Id: e911Id
      });
   */
    function login(options) {
      try {
        if (undefined === options) {
          //todo remove throw and publish it using error callback handler
          throw ATT.errorDictionary.getSDKError('2002');
        }
        if (undefined === options.token) {
          //todo remove throw and publish it using error callback handler
          throw ATT.errorDictionary.getSDKError('2001');
        }
        if (undefined !== session && null !== session.getId()) {
          //todo remove throw and publish it using error callback handler
          throw ATT.errorDictionary.getSDKError('2005');
        }

        try {
          logger.logDebug('Phone.login');

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

        } catch (err) {
          throw ATT.errorDictionary.getSDKError('2004');
        }
      } catch (err) {

        logger.logError(err);

        /**
         * Error event.
         * @desc Indicates the SDK has thrown an error
         *
         * @event Phone#error
         * @data {object}
         * @property {Date} timestamp - Event fire time.
         * @error {Object} error - Error object
         */
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
    * @summary Deletes the current RTC Session
    * @desc
    * Logs out the user from RTC session. When invoked webRTC session gets deleted, future event channel polling
    * requests gets stopped
    * publishes error code 3000
    * @memberof Phone
    * @instance
    * @fires Phone#session-disconnected
    * @fires Phone#error
    * @example
    * var phone = ATT.rtc.Phone.getPhone();
    * phone.logout();
    */
    function logout() {
      try {
        logger.logDebug('Phone.logout');

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

      } catch (err) {
        logger.logError(err);
        emitter.publish('error', {
          error: ATT.errorDictionary.getSDKError('3000')
        });
      }
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

      try {

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
        emitter.publish('dialing', {
          to: options.destination,
          mediaType: options.mediaType,
          timestamp: new Date()
        });

        var call = session.createCall({
          peer: options.destination,
          type: ATT.CallTypes.OUTGOING,
          mediaType: options.mediaType,
          localMedia: options.localMedia,
          remoteMedia: options.remoteMedia
        });

        call.on('connecting', function (data) {

          /**
           * Call connecting event.
           * @desc Indicates succesful creation of the call.
           * @event Phone#call-connecting
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('call-connecting', data);
        });
        call.on('canceled', function (data) {
          /**
           * Call canceled event.
           * @desc Succesfully canceled the current call.
           * @event Phone#call-canceled
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('call-canceled', data);
        });
        call.on('rejected', function (data) {
          /**
           * Call rejected event.
           * @desc Successfully rejected an incoming call.
           * @event Phone#call-rejected
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          session.deleteCurrentCall();
          emitter.publish('call-rejected', data);
        });
        call.on('connected', function (data) {
          /**
           * Call connected event.
           * @desc Successfully established a call.
           * @event Phone#call-connected
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('call-connected', data);
        });
        call.on('media-established', function (data) {
          /**
           * Media established event.
           * @desc Triggered when both parties are completed negotiation
           * and engaged in active conversation.
           * @event Phone#media-established
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('media-established', data);
        });
        call.on('held', function (data) {
          /**
           * Call on hold event.
           * @desc Successfully put the current call on hold.
           * @event Phone#call-hold
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('call-held', data);
        });
        call.on('resumed', function (data) {
          /**
           * Call resumed event.
           * @desc Successfully resume a call that was on held.
           * @event Phone#call-resume
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('call-resumed', data);
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
        call.on('error', function (data) {
          /**
           * Call Error event.
           * @desc Indicates an error condition during a call's flow
           *
           * @event Phone#call-error
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           * @property {Object} error
           * @property {Object} error.ErrorCode - ABC
           * @property {Object} error.JSMethod - login
           */
          emitter.publish('error', data);
        });

        call.connect(options);

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
     * @summary
     * Answer an incoming call
     * @desc
     * When call arrives via an incoming call event, call can be answered by using this method:
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
     * @fires Phone#call-held
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

      try {
        if (undefined === options) {
          publishError(errorDictionary.getSDKError(5004));
          return;
        }

        if (undefined === options.localMedia) {
          publishError(errorDictionary.getSDKError(5001));
          return;
        }

        if (undefined === options.remoteMedia) {
          publishError(errorDictionary.getSDKError(5001));
          return;
        }

        var call = session.currentCall;

        if (call === null) {
          publishError(errorDictionary.getSDKError(5000));
          return;
        }

        emitter.publish('answering', {
          from: call.peer,
          mediaType: call.mediaType,
          codec: call.codec,
          timestamp: new Date()
        });

        call.on('connecting', function (data) {
          emitter.publish('call-connecting', data);
        });
        call.on('rejected', function (data) {
          emitter.publish('call-rejected', data);
        });
        call.on('connected', function (data) {
          emitter.publish('call-connected', data);
        });
        call.on('media-established', function (data) {
          emitter.publish('media-established', data);
        });
        call.on('held', function (data) {
          emitter.publish('call-held', data);
        });
        call.on('resumed', function (data) {
          emitter.publish('call-resumed', data);
        });
        call.on('disconnected', function (data) {
          emitter.publish('call-disconnected', data);
          session.deleteCurrentCall();
        });
        call.on('error', function (data) {
          emitter.publish('error', data);
        });

        call.connect(options);

      } catch (err) {
        publishError(errorDictionary.getSDKError(5002));
      }

    }
    /**
    * @summary
    * Mute the current call.
    * throws error code 9000,9001
    * @memberOf Phone
    * @instance

    * @fires Phone#call-muted
    * @fires Phone#error

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.mute();
    */
    function mute() {
      try {
        var call = session.currentCall;

        if (null === call || null === call.id) {
          throw ATT.errorDictionary.getSDKError('9000');
        }

        try {
          logger.logDebug('Phone.mute');

          call.on('muted', function (data) {
            /**
             * Call muted event.
             * @desc Call was successfully muted.
             *
             * @event Phone#call-muted
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-muted', data);
          });

          call.mute();

        } catch (err) {
          throw ATT.errorDictionary.getSDKError('9001');
        }
      } catch (err) {
        logger.logError(err);

        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
    * @summary
    * Unmute the current call.
    * throw error codes 10000, 10001
    * @memberOf Phone
    * @instance

    * @fires Phone#call-unmuted
    * @fires Phone#error

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.unmute();
    */
    function unmute() {
      try {
        var call = session.currentCall;

        if (null === call || null === call.id) {
          throw ATT.errorDictionary.getSDKError('10000');
        }

        try {

          logger.logDebug('Phone.unmute');

          call.on('unmuted', function (data) {
            /**
             * Call unmuted event.
             * @desc Call was successfully unmuted.
             *
             * @event Phone#call-unmuted
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-unmuted', data);
          });

          call.unmute();

        } catch (err) {
          throw ATT.errorDictionary.getSDKError('10001');
        }

      } catch (err) {

        logger.logError(err);

        emitter.publish('error', {
          error: err
        });
      }
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
      var call = session.currentCall;

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
      try {
        var call = session.currentCall;

        call.on('disconnecting', function (data) {
          emitter.publish('call-disconnecting', data);
        });
        call.disconnect();

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
     * @summary
     * Cancel current call.
     * @memberOf Phone
     * @instance

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.cancel();
     */
    function cancel() {
      var call = session.currentCall;
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
      try {
        var call = session.currentCall;

        if (undefined === call || null === call) {
          throw new Error('Call object not defined');
        }
        call.on('disconnected', function (data) {
          emitter.publish('call-disconnected', data);
          session.deleteCurrentCall();
        });
        call.reject();

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

   /**
   * @summary
   * Put the current call on held.
   * @memberOf Phone
   * @instance
   
   * @fires Phone#call-held
   * @fires Phone#call-error

   * @example
    var phone = ATT.rtc.Phone.getPhone();
    phone.hold();
   */
    function hold() {
      try {
        var call = session.currentCall;
        call.hold();
      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
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
      try {
        var call = session.currentCall;

        call.resume();
      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
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
    this.cancel = cancel.bind(this);
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
          logger.logInfo('Creating new Phone instance');
          instance = new ATT.private.Phone();
        }
        return instance;
      }
    };
  }());

}());
