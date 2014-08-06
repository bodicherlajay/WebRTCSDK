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
      userMediaSvc = ATT.UserMediaService,
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

	  session.on('call-disconnected', function (data) {
      /**
       * Call disconnected event.
       * @desc Indicates a call has been disconnected
       *
       * @event Phone#call-disconnected
       * @type {object}
       * @property {String} from - The ID of the caller.
       * @property {String} mediaType - The type of call.
       * @property {String} codec - The codec of the call.
       * @property {Date} timestamp - Event fire time.
       */
      emitter.publish('call-disconnected', data);
      session.deleteCurrentCall();
    });

    session.on('conference-disconnected', function (data) {
      /**
       * Conference disconnected event.
       * @desc Indicates a conference has been disconnected
       *
       * @event Phone#conference:disconnected
       * @type {object}
       * @property {String} from - The ID of the conference.
       * @property {String} mediaType - The type of conference.
       * @property {String} codec - The codec of the conference
       * @property {Date} timestamp - Event fire time.
       */
      emitter.publish('conference:disconnected', data);
      session.deleteCurrentCall();
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
          && 'call-connecting' !== event
          && 'call-connected' !== event
          && 'call-disconnecting' !== event
          && 'call-disconnected' !== event
          && 'call-muted' !== event
          && 'call-unmuted' !== event
          && 'call-held' !== event
          && 'call-resumed' !== event
          && 'call-canceled' !== event
          && 'call-rejected' !== event
          && 'address-updated' !== event
          && 'media-established' !== event
          && 'conference-invite' !== event
          && 'conference-joining' !== event
          && 'conference:inviting' !== event
          && 'conference:invite-rejected' !== event
          && 'conference-connecting' !== event
          && 'conference:response-pending' !== event
          && 'conference:invite-accepted' !== event
          && 'conference:disconnecting' !== event
          && 'conference:disconnected' !== event
          && 'conference-connected' !== event

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
         * @property {String} error.PossibleCauses
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
   * @desc Add description here
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
   * @fires Phone#call-rejected
   * @fires Phone#call-connected
   * @fires Phone#media-established
   * @fires Phone#call-held
   * @fires Phone#call-resumed
   * @fires Phone#call-disconnected
   * @fires Phone#error

   * @example
    // Start video call with an ICMN User
    var phone = ATT.rtc.Phone.getPhone();
    phone.dial({
      destination: '11231231234',
      mediaType: 'video',
      localMedia: document.getElementById('localVideo'),
      remoteMedia: document.getElementById('remoteVideo'),
      holdCurrentCall
    };
    @example
    // Start audio call with a NoTN/VTN User
    var phone = ATT.rtc.Phone.getPhone();
    phone.dial({  
      destination: 'john@domain.com',
      mediaType: 'audio',
      localMedia: document.getElementById('localVideo'),
      remoteMedia: document.getElementById('remoteVideo'),
      holdCurrentCall
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

        if (null !== session.backgroundCall) {
            if (options.holdCurrentCall === true) {
                throw ATT.errorDictionary.getSDKError('4010');
            }
        }

        if (null !== session.currentCall) {
            if (options.holdCurrentCall === true) {
                session.currentCall.hold();
            } else {
                session.currentCall.hangup();
            }
            session.backgroundCall = session.currentCall;
            session.currentCall = null;
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
            session.switchCall();

            if (session.currentCall !== null) {
                session.currentCall.resume();
            }
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
            session.switchCall();

            if (session.currentCall !== null) {
                session.currentCall.resume();
            }
          });
          call.on('error', function (data) {
            /**
             * Call Error event.
             * @desc Indicates an error condition during a call's flow
             *
             * @event Phone#error
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
          session.switchCall();

          if (session.currentCall !== null) {
              session.currentCall.resume();
          }
        });
        call.on('error', function (data) {
          publishError(5002, data);
        });

        call.connect(options);

      } catch (err) {
        publishError(5002);
      }

    }

    /**
     * @summary
     * Join a conference by accepting an incoming invite.
     * @desc Add description here
     *
     * **Error Codes**
     *
     *   - 20000 - Internal error occurred
     *   - 20001 - User is not logged in
     *   - 20002 - No conference invite
     *   - 20003 - getUserMedia failed
     *
     * @memberOf Phone
     * @instance

     * @fires Phone#conference-joining
     * @fires Phone#conference-connecting
     * @fires Phone#conference-connected
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.joinConference();
     */
    function joinConference(options) {

      try {

        if (null === session || null === session.getId()) {
          throw ATT.errorDictionary.getSDKError('20001');
        }
        if (null === session.currentCall) {
          throw ATT.errorDictionary.getSDKError('20002');
        }

        try {
          logger.logDebug('Phone.joinConference');

          var conference = session.currentCall;

          /**
           * Conference joining event.
           * @desc Trying to accept and conference invitation and join the conference.
           * @event Phone#conference-joining
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference-joining', {
            from: conference.peer(),
            mediaType: conference.mediaType(),
            codec: conference.codec(),
            timestamp: new Date()
          });

          conference.on('error', function (data) {
            /**
             * Conference error event
             * @desc An error occurred during conferencing
             * @event Phone#error
             * @type {object}
             * @property {Date} timestamp - Event fire time
             * @property {Object} data - Available error detail
             */
            emitter.publish('error', data);
          });

          conference.on('connecting', function (data) {
            /**
             * Conference connecting event.
             * @desc Trying to connecting to a conference after accepting the invite.
             * @event Phone#conference-connecting
             * @type {object}
             * @property {Date} timestamp - Event fire time
             */
            emitter.publish('conference-connecting', data);
          });

          conference.on('connected', function (data) {
            /**
             * Conference connected event.
             * @desc Successfully joined the conference after accepting the invite.
             * @event Phone#conference-connected
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('conference-connected', data);
          });

          userMediaSvc.getUserMedia({
            localMedia: options.localMedia,
            remoteMedia: options.remoteMedia,
            mediaType: options.mediaType,
            onUserMedia: function (media) {
              try {
                logger.logInfo('Successfully got user media');

                conference.addStream(media.localStream);
                conference.connect();
              } catch (err) {
                logger.logError(err);

                /**
                 * Call Error event.
                 * @desc Indicates an error condition during a call's flow
                 *
                 * @event Phone#error
                 * @type {object}
                 * @property {Object} error - error detail
                 */
                emitter.publish('error', {
                  error: ATT.errorDictionary.getSDKError('20000')
                });
              }
            },
            onMediaEstablished: function () {
              logger.logInfo('onMediaEstablished');

              emitter.publish('media-established', {
                timestamp: new Date(),
                mediaType: conference.mediaType(),
                codec: conference.codec(),
                from: conference.peer()
              });
            },
            onUserMediaError: function (error) {
              logger.logError('getUserMedia Failed ');
              publishError('20002', error);
            }
          });

        } catch (err) {
          logger.logError(err);

          throw ATT.errorDictionary.getSDKError('20000');
        }

      } catch (err) {
        logger.logError(err);

        /**
         * Call Error event.
         * @desc Indicates an error condition during a call's flow
         *
         * @event Phone#error
         * @type {object}
         * @property {Object} error - error detail
         */
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
    * @summary
    * Mute the current call.
    * @desc Add description here
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
    * @desc Add description here
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
     * @desc Add description here
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
     * @desc Add description here
     *
     *  **Error Code**
     *
     *    - 11000 -Cancel failed - Call has not been initiated
     *    - 11001 - Internal error occurred
     *
     * @memberOf Phone
     * @instance
     *
     * @fires Phone#call-canceled
     * @fires Phone#error
     *
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
          if (null === call.id()) {
            emitter.publish('call-canceled', {
              to: call.peer(),
              mediaType: call.mediaType(),
              timestamp: new Date()
            });
            session.deleteCurrentCall();
            session.switchCall();

            if (session.currentCall !== null) {
                session.currentCall.resume();
            }
        }
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
    * @desc Add description here
    *
    *  ** Error Codes **
    *
    *  - 12000 - Reject failed-Call has not been initiated
    *  - 12001 - Internal error occurred
    *
    * @memberOf Phone
    * @instance

    * @fires Phone#call-disconnected
    * @fires Phone#error

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
            session.switchCall();

            if (session.currentCall !== null) {
                session.currentCall.resume();
            }
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
     * @summary
     * Reject current incoming conference invite.
     * @desc
     *
     *  ** Error Codes **
     *
     *  - 22000 - Internal error occurred
     *  - 22001 - User is not logged in
     *  - 22002 - No conference invite
     *
     * @memberOf Phone
     * @instance

     * @fires Phone#conference-disconnected
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.reject();
     */
    function rejectConference() {

      try {

        if (null === session || null === session.getId()) {
          throw ATT.errorDictionary.getSDKError('22001');
        }
        if (null === session.currentCall) {
          throw ATT.errorDictionary.getSDKError('22002');
        }

        try {
          logger.logDebug('Phone.rejectConference');

          var conference = session.currentCall;

          conference.reject();

        } catch (err) {
          logger.logError(err);

          throw ATT.errorDictionary.getSDKError('22000');
        }

      } catch (err) {
        logger.logError(err);

        /**
         * Call Error event.
         * @desc Indicates an error condition during a call's flow
         *
         * @event Phone#error
         * @type {object}
         * @property {Object} error - error detail
         */
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
     * @summary Put the current call on hold
     * @desc Add description here
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
     * @desc Add description here
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

        if ('held' !== call.getState()) {
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
     * @desc Add description here
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
    /**
     * @summary
     * start  a conference with a valid parameters.
     * @desc start conference and create conference object
     *
     * **Error Codes**
     *
     *   - 18000 - Parameters missing
     *   - 18001 - Invalid localmedia passed
     *   - 18002 - Invalid remotemedia passed
     *   - 18003 - Invalid mediatype passed
     *   - 18004 - Failed to get usermedia
     *   - 18005 - Internal error occurred
     *   - 18006 - Cannot make second conference when first in progress
     *   - 18007 - Please login before you make a conference
     *
     * @memberOf Phone
     * @instance
     * @param {Object} options
     * @param {HTMLElement} options.localMedia
     * @param {HTMLElement} options.remoteMedia
     * @param {HTMLElement} options.mediaType

     * @fires Phone#conference-connected
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.startConference({
     mediaType: 'video',
     localMedia: document.getElementById('localVideo'),
     remoteMedia: document.getElementById('remoteVideo'),
    });
     */
    function startConference(options) {

      logger.logInfo('startConference');

      var conference;

      try {
        if (undefined === options
            || 0 === Object.keys(options).length) {
          logger.logError(' parameters not found');
          publishError('18000');
          return;
        }
        if (undefined === session || null === session.getId()) {
          logger.logError('no session to start  conference');
          publishError('18007');
          return;
        }
        if (session.currentCall !== null && session.currentCall.breed() === 'conference') {
          logger.logError('Please End your current Conference');
          publishError('18006');
          return;
        }

        if (undefined === options.localMedia) {
          logger.logError('localmedia not passed');
          publishError('18001');
          return;
        }
        if (undefined === options.remoteMedia) {
          logger.logError('remotemedia not passed');
          publishError('18002');
          return;
        }
        if ((undefined === options.mediaType)
            || ('audio' !== options.mediaType
            && 'video' !== options.mediaType)) {
          logger.logError('mediatype not passed');
          publishError('18003');
          return;
        }

        options.breed = 'conference';
        options.type = ATT.CallTypes.OUTGOING;
        conference = session.createCall(options);

        conference.on('error', function (data) {
          logger.logInfo('published error to user om start conference');
          emitter.publish('error', data);
        });

        conference.on('connected', function (data) {
          logger.logInfo('connected conference event published to UI');
          /**
           * conference connecetd event.
           * @desc A conference has been created.
           *
           * @event Phone#conference-connected
           * @type {object}
           * @property {Date} timestamp - Event fire time
           * @property {Object} data - data
           */
          emitter.publish('conference-connected', data);
        });

        conference.on('stream-added', function (data) {
          userMediaSvc.showStream({
            stream: data.stream,
            localOrRemote: 'remote'
          });
        });

        userMediaSvc.getUserMedia({
          mediaType: options.mediaType,
          localMedia: options.localMedia,
          remoteMedia: options.remoteMedia,
          onUserMedia: function (userMedia) {
            logger.logInfo('onUserMedia');
            conference.addStream(userMedia.localStream);
            conference.connect();
          },
          onMediaEstablished: function (data) {
            logger.logInfo('onMediaEstablished');
            emitter.publish('media-established', data);
          },
          onUserMediaError: function (error) {
            logger.logError('getUserMedia Failed ');
            publishError('18004', error);
          }
        });
      } catch (err) {

        logger.logError('error while start conference , check logs');
        publishError('18005', err);
      }

    }

    /**
     * @summary
     * Add participant
     * @desc
     * Add a participant to a conference
     *
     * @param {String} participant
     *
     * **Error Codes**
     *
     *   - 19000 - Participant parameter missing
     *   - 19001 - Internal error occurred
     * @memberOf Phone
     * @instance

     * @fires Phone#participant-pending
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.addParticipant('4250000001');
     */
    function addParticipant(invitee) {

      try {
        try {
          logger.logDebug('Phone.addParticipant');

          if (undefined === participant) {
            publishError(19000);
            return;
          }

          this.addParticipants([participant]);
        } catch (err) {
          publishError('19001');
          return;
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
     * Add participants
     * @desc
     * Add a list of participants to a conference
     *
     * **Error Codes**
     *
     *   - 24000 - Participants parameter missing
     *   - 24001 - Participants is null or empty
     *   - 24002 - User is not logged in
     *   - 24003 - Conference not initiated
     *   - 24004 - Internal error occurred
     *
     * @param {Array} participants List of participant-ids
     *
     * @memberOf Phone
     * @instance

     * @fires Phone#participant-pending
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.addParticipants(['4250000001','4250000002']);
     */
    function addParticipants(participants) {
      var conference,
        counter;

      try {
        logger.logDebug('Phone.addParticipants');

        if (undefined === participants) {
          logger.logError('Parameter missing');
          publishError('24000');
          return;
        }

        if (typeof participants !== 'object'
            || null === participants
            || Object.keys(participants).length === 0) {
          publishError('24001');
          return;
        }

        if (null === session.getId()) {
          publishError('24002');
          return;
        }

        conference = session.currentCall;
        if (null === conference || 'conference' !== conference.breed()) {
          logger.logError('Conference not initiated ');
          publishError('24003');
          return;
        }

        conference.on('response-pending', function (data) {
          /**
           * Response pending event.
           * @desc An invitation has been sent.
           *
           * @event Phone#conference:response-pending
           * @type {object}
           * @property {Date} timestamp - Event fire time
           * @property {Object} Invitations - Invitations list
           */
          emitter.publish('conference:response-pending', data);
        });

        conference.on('invite-accepted', function (data) {
          /**
           * Invite accepted event.
           * @desc An invitation has been successfully accepted.
           *
           * @event Phone#conference:invite-accepted
           * @type {object}
           * @property {Date} timestamp - Event fire time
           */
          emitter.publish('conference:invite-accepted', data);
        });

        conference.on('rejected', function (data) {
          /**
           * Invite rejected event.
           * @desc An invitation has been rejected.
           *
           * @event Phone#conference:invite-rejected
           * @type {object}
           * @property {Date} timestamp - Event fire time
           */
          emitter.publish('conference:invite-rejected', data);
        });

        emitter.publish('conference:inviting', {
          invitee: invitee,
          timestamp: new Date()
        });

        try {
          for (counter = 0; counter < participants.length; counter += 1) {
            conference.addParticipant(participants[counter]);
          }
        } catch (err) {
          publishError('24004');
          return;
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
     * End Conference
     * @desc
     * End an ongoing conference
     *
     * **Error Codes**
     *
     *   - 23001 - User is not logged in
     *   - 23002 - Conference not initiated
     *   - 23000 - Internal error occurred
     * @memberOf Phone
     * @instance

     * @fires Phone#conference-disconnecting

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.endConference();
     */
    function endConference() {
      logger.logDebug('Phone.endConference');

      var conference;

      try {
        if (null === session.getId()) {
          publishError(23001);
          return;
        }

        conference = session.currentCall;

        if (null === conference || 'conference' !== conference.breed()) {
          publishError(23002);
          return;
        }

        conference.on('disconnecting', function (data) {
          /**
           * Conference disconnecting event.
           * @desc The conference is being disconnected
           *
           * @event Phone#conference:disconnecting
           * @type {object}
           * @property {Date} timestamp - Event fire time
           */
          emitter.publish('conference:disconnecting', data);
        });

        try {
          conference.disconnectConference();
        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError(23000);
        }
      } catch(err) {
        logger.logError(err);
        emitter.publish('error', {
          error: err
        });
      }
    }

    /**
     * @summary
     * Get participants
     * @desc
     * Get the list of participants of a conference
     *
     * **Error Codes**
     *
     *   - 21000 - Conference not initiated
     *   - 21001 - Internal error occurred
     *   - 21002 - User not Logged in
     *
     * @memberOf Phone
     * @instance

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.getParticipants();
     */

    function getParticipants() {
      logger.logDebug('Phone.getParticipant');

      var conference,
        participants,
        active,
        key;

      try {

        if (null === session.getId()) {
          publishError(21002);
          return;
        }
        conference = session.currentCall;

        if (null === conference
            || 'conference' !== conference.breed()) {
          publishError(21000);
          return;
        }
        try {
          participants = conference.participants();
          active = {};

          for (key in participants) {
            if (participants.hasOwnProperty(key)) {
              if ('active' === participants[key].status) {
                active[key] = participants[key];
              }
            }
          }

          return active;
        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError(21001);
        }
      } catch (err) {
        logger.logError(err);
        emitter.publish('error', {
          error: err
        });
      }
    }

    // ===================
    // Call interface
    // ===================
    this.on = on;
    this.getSession = getSession;
    this.login = login;
    this.logout = logout;
    this.dial = dial;
    this.answer = answer;
    this.mute = mute;
    this.unmute = unmute;
    this.getMediaType = getMediaType;
    this.hangup = hangup;
    this.hold = hold;
    this.resume = resume;
    this.cancel = cancel;
    this.reject = reject;
    this.updateE911Id = updateE911Id;
    this.cleanPhoneNumber = ATT.phoneNumber.cleanPhoneNumber;
    this.formatNumber = ATT.phoneNumber.formatNumber;

    // ===================
    // Conference interface
    // ===================
    this.startConference = startConference;
    this.endConference = endConference;
    this.joinConference = joinConference;
    this.rejectConference = rejectConference;
    this.addParticipant = addParticipant;
    this.addParticipants = addParticipants;
    this.getParticipants = getParticipants;
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
