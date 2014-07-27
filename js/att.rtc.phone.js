/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT*/

(function () {
  'use strict';

  var logManager = ATT.logManager.getInstance();

  /**
    Creates a new Phone.
    @global
    @class Represents a Phone.
    @constructor
  */
  function Phone() {

    var emitter = ATT.private.factories.createEventEmitter(),
      session = new ATT.rtc.Session(),
      errorDictionary = ATT.errorDictionary,
      logger = logManager.addLoggerForModule('Phone');

    logger.logInfo('Creating new instance of Phone');

    session.on('call-incoming', function (data) {
      /**
       * Call incoming event.
       * @desc Indicates a call is being received.
       *
       * @event Phone#call-incoming
       * @type {object}
       * @property {String} from - The ID of the caller.
       * @property {String} mediaType - The type of call being received.
       * @property {String} codec - The codec used by the incoming call.
       * @property {Date} timestamp - Event fire time.
       */
      emitter.publish('call-incoming', data);
    });
	session.on('call-disconnected', function (data) {
      /**
       * Call disconnected event.
       * @desc Indicates a call has been disconnected
       *
       * @event Phone#call-disconnected
       * @type {object}
       * @property {String} from - The ID of the caller.
       * @property {String} mediaType - The type of call.
       * @property {String} codec - The codec of the call
       * @property {Date} timestamp - Event fire time.
       */
      emitter.publish('call-disconnected', data);
      session.deleteCurrentCall();
    });

    session.on('conference-invite', function (data) {
      /**
       * Conference Invite event.
       * @desc Indicates a conference invite is received.
       *
       * @event Phone#conference-invite
       * @type {object}
       * @property {String} from - The ID of the caller.
       * @property {String} mediaType - The type of call being received.
       * @property {String} codec - The codec used by the incoming call.
       * @property {Date} timestamp - Event fire time.
       */
      emitter.publish('conference-invite', data);
    });

    session.on('error', function (data) {
      emitter.publish('error', data);
    });

    function getError(errorNumber) {
      return errorDictionary.getSDKError(errorNumber);
    }

    function publishError(errorNumber, data) {
      var error = getError(errorNumber),
        errorInfo = {};

      if (undefined === error) {
        errorInfo.error = 'TODO: Error not in dictionary';
      } else {
        errorInfo.error = error;
      }

      if (undefined !== data) {
        errorInfo.data = data;
      }

      logger.logError(errorInfo);
      emitter.publish('error', errorInfo);
    }

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
          && 'conference-invite' !== event
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
    *
    *  **Error Code**
    *
    *    - 2001 - Missing input parameter
    *    - 2002 - Mandatory fields can not be empty
    *    - 2004 - Internal error occurred
    *    - 2005 - User already logged in
    *
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
         * @property {object} data
         * @property {Date} data.timestamp Event fire time.
         * @property {Object} error
         * @property {String} error.JSObject
         * @property {String} error.JSMethod
         * @property {String} error.ErrorCode
         * @property {String} error.ErrorMessage
         * @property {String} error.PosibleCauses
         * @property {String} error.PossibleResolution
         * @property {String} error.APIError
         * @property {String} error.ResourceMethod
         * @property {String} error.HttpStatusCode
         * @property {String} error.MessageId
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
    *
    * **Error Codes**
    *
    *   - 3000 - Internal error occurred
    *
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

        if (null === session || null === session.getId()) {
          throw ATT.errorDictionary.getSDKError('3001');
        }

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
          throw ATT.errorDictionary.getSDKError('3000');
        }
      } catch (err) {
        logger.logError(err);

        emitter.publish('error', {
          error: err
        });
      }
    }

  /**
   * @summary Make a call
   * @desc
   *
   * **Error codes**
   *
   *  - 4002 - Invalid Media Type
   *  - 4003 - Internal error occurred
   *  - 4004 - User is not logged in
   *
   * @param {Object} options
   * @memberOf Phone
   * @instance
   * @param {String} options.destination The Phone Number or User Id of the called party.
   * @param {HTMLVideoElement} options.localMedia
   * @param {HTMLVideoElement} options.remoteMedia
   * @param {String} options.mediaType `audio` or `video`
   
   * @fires Phone#dialing
   * @fires Phone#call-connecting
   * @fires Phone#call-canceled
   * @fires Phone#call-rejected
   * @fires Phone#call-connected
   * @fires Phone#media-established
   * @fires Phone#call-held
   * @fires Phone#call-resumed
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

        if (null === session.getId()) {
          throw ATT.errorDictionary.getSDKError('4004');
        }
        if (undefined === options) {
          throw ATT.errorDictionary.getSDKError('4009');
        }

        if (undefined === options.localMedia) {
          throw ATT.errorDictionary.getSDKError('4006');
        }

        if (undefined === options.remoteMedia) {
          throw ATT.errorDictionary.getSDKError('4007');
        }

        if (undefined === options.destination) {
          throw ATT.errorDictionary.getSDKError('4008');
        }

        if (undefined !== options.mediaType) {
          if ('audio' !== options.mediaType
              && 'video' !== options.mediaType) {
            throw ATT.errorDictionary.getSDKError('4002');
          }
        }

        try {

          logger.logDebug('Phone.dial');

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
            breed: 'call',
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
          call.on('rejected', function (data) {
            /**
             * Call rejected event.
             * @desc Successfully rejected an incoming call.
             * @event Phone#call-rejected
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-rejected', data);
            session.deleteCurrentCall();
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
             * @event Phone#call-held
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-held', data);
          });
          call.on('resumed', function (data) {
            /**
             * Call resumed event.
             * @desc Successfully resume a call that was on held.
             * @event Phone#call-resumed
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
             */
            emitter.publish('error', data);
          });

          call.connect(options);

        } catch (err) {
          throw ATT.errorDictionary.getSDKError('4003');
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
     * Answer an incoming call
     * @desc
     * Once a {@link Phone#event:call-incoming} event is fired, you can use this method to
     * answer the incoming call.
     *
     * **Error Codes**
     *
     *   - 5000 - Answer failed: No incoming call
     *   - 5001 - Invalid media type 
     *   - 5002 - Internal error occurred
     *   - 5003 - User is not logged in
     *   - 5004 - Mandatory fields can not be empty
     *
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
     * @fires Phone#call-resumed
     * @fires Phone#call-disconnected
     * @fires Phone#error

     * @example
        var phone = ATT.rtc.Phone.getPhone();
        phone.answer({
          localMedia: document.getElementById('localVideo'),
          remoteMedia: document.getElementById('remoteVideo')
        });
     */
    function answer(options) {

      var call;
      logger.logInfo('Answering ... ');

      try {
        if (undefined === options) {
          publishError(5004);
          return;
        }

        if (undefined === options.localMedia) {
          publishError(5001);
          return;
        }

        if (undefined === options.remoteMedia) {
          publishError(5001);
          return;
        }

        if (session.getId() === null) {
          publishError(5003);
          return;
        }
        call = session.currentCall;

        if (call === null) {
          publishError(5000);
          return;
        }

        emitter.publish('answering', {
          from: call.peer(),
          mediaType: call.mediaType(),
          codec: call.codec(),
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
          publishError(5002, data);
        });

        call.connect(options);

      } catch (err) {
        publishError(5002);
      }

    }

    function joinConference() {

    }

    /**
    * @summary
    * Mute the current call.
    * @desc
    *
    * **Error Codes**
    *
    *   - 9000 - Mute failed- Call is not in progress
    *   - 9001 - Internal error occurred
    *
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
    * @desc
    *
    * **Error Codes**
    *
    *   - 10000 - Unmute failed- No media stream
    *   - 10001 - Internal error occurred
    *
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

      return call ? call.mediaType() : null;
    }

    /**
     * @summary Hangup existing call
     * @desc
     *
     * **Error codes**
     *
     *   - 6000 - Call is not in progress
     *   - 6001 - Internal error occurred
     *
     * @memberOf Phone
     * @instance

     * @fires Phone#call-disconnecting

     * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.hangup();
    */
    function hangup() {
      var call;

      try {

        call = session.currentCall;

        if (null === call || null === call.id()) {
          throw ATT.errorDictionary.getSDKError('6000');
        }

        try {
          call.on('disconnecting', function (data) {
            emitter.publish('call-disconnecting', data);
          });
          call.disconnect();
        } catch (err) {
          throw ATT.errorDictionary.getSDKError('6001');
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
     * Cancel current call.
     * @desc
     *
     *  **Error Code**
     *
     *    - 11000 -Cancel failed-Call has not been initiated
     *    - 11001 - Internal error occurred
     *
     * @memberOf Phone
     * @instance
     * @example
     * var phone = ATT.rtc.Phone.getPhone();
     * phone.cancel();
     */
    function cancel() {
      var call = session.currentCall;

      try {
        if (null === call) {
          throw ATT.errorDictionary.getSDKError('11000');
        }
        try {

          call.disconnect();
        } catch (err) {
          throw ATT.errorDictionary.getSDKError('11001');
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
    * Reject current incoming call.
    * @desc
    *
    *  ** Error Codes **
    *
    *  - 12000 - Reject failed-Call has not been initiated
    *  - 12001 - Internal error occurred
    *
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

        if (null === call || null === call.id()) {
          publishError('12000')
          return;
        }
        try {
          call.on('disconnected', function (data) {
            emitter.publish('call-disconnected', data);
            session.deleteCurrentCall();
          });
          call.reject();
        } catch (err) {
          throw ATT.errorDictionary.getSDKError('12001');
        }

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
     * @summary Put the current call on hold
     * @desc
     *
     * **Error codes**
     *
     *   - 7000 - Hold failed - Call is not in progress
     *   - 7001 - Internal error occurred
     *
     * @memberOf Phone
     * @instance

     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.hold();
     */
    function hold() {
      var call;

      try {
        call = session.currentCall;

        if (null === call || null === call.id()) {
          throw ATT.errorDictionary.getSDKError('7000');
        }

        try {
          call.hold();
        } catch (err) {
          throw ATT.errorDictionary.getSDKError('7001');
        }
      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
     * @summary
     * Resume the current call
     * @desc
     *
     * **Error Codes**
     *
     *   - 8000 - Resume failed - Call is not in progress
     *   - 8001 - Call is not on hold
     *   - 8002 - Internal error occurred
     *
     * @memberOf Phone
     * @instance


     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.resume();
     */
    function resume() {
      var call;

      try {
        call = session.currentCall;

        if (null === call || null === call.id()) {
          throw ATT.errorDictionary.getSDKError('8000');
        }

        if ('hold' !== call.getState()) {
          throw ATT.errorDictionary.getSDKError('8001');
        }

        try {
          call.resume();
        } catch (err) {
          throw ATT.errorDictionary.getSDKError('8002');
        }
      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
     * @summary
     * Update e911Id
     * @desc
     * **Error Codes**
     *   - 17000 - e911 parameter is missing
     *   - 17001 - Internal error occurred
     *   - 17002 - User is not logged in
     * @memberOf Phone
     * @instance

     * @fires Phone#address-updated

     * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.updateE911Id({
        e911Id: e911AddressId
      });
    */
    function updateE911Id(options) {

      try {
        if (undefined === options) {
          throw ATT.errorDictionary.getSDKError('17000');
        }

        if (undefined === session || null === session.getId()) {
          throw ATT.errorDictionary.getSDKError('17002');
        }

        if (undefined === options.e911Id || null === options.e911Id) {
          throw ATT.errorDictionary.getSDKError('17000');
        }

        try {
          session.on('address-updated', function () {
            emitter.publish('address-updated');
          });

          session.updateE911Id(options);
        } catch (err) {
          throw ATT.errorDictionary.getSDKError('17001');
        }

      } catch (err) {
        emitter.publish('error', {
          error: err
        });
      }
    }

    function dialConference(options) {

      if (undefined === options
          || 0 === Object.keys(options).length) {
        publishError('18000');
        return;
      }
      if (undefined === options.localMedia) {
        publishError('18001');
        return;
      }
      if (undefined === options.remoteMedia) {
        publishError('18002');
        return;
      }
      if ((undefined === options.mediaType)
          || ('audio' !== options.mediaType
              && 'video' !== options.mediaType)) {
        publishError('18003');
        return;
      }

      options.breed = 'conference';
      session.createCall(options);
    }

    this.on = on.bind(this);
    this.getSession = getSession.bind(this);
    this.login = login.bind(this);
    this.logout = logout.bind(this);
    this.dial = dial.bind(this);
    this.answer = answer.bind(this);
    this.joinConference = joinConference;
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

    //Confernce Methods
    this.dialConference = dialConference.bind(this);
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
    var instance,
      logger = logManager.addLoggerForModule('rtc');

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
