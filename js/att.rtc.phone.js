/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT*/

(function () {
  'use strict';

  ATT.private.pcv = 2;

  var logManager = ATT.logManager.getInstance();

  /**
   Creates a new Phone.
   @global
   @class Represents a Phone.
   @constructor

   @fires Phone#call-incoming
   @fires Phone#conference:invitation-received
   @fires Phone#error

   */
  function Phone() {

    var emitter = ATT.private.factories.createEventEmitter(),
      session = new ATT.rtc.Session(),
      errorDictionary = ATT.errorDictionary,
      userMediaSvc = ATT.UserMediaService,
      logger = logManager.addLoggerForModule('Phone'),
      that = this;

    logger.logInfo('Creating new instance of Phone');

    session.on('call-incoming', function (data) {
      logger.logInfo('call incoming event  by phone layer');
      /**
       * Call incoming event.
       * @desc This event fires when a call is incoming.
       *
       * @event Phone#call-incoming
       * @type {object}
       * @property {String} from - The ID of the caller.
       * @property {String} mediaType - The type of call being received.
       * @property {String} codec - The codec used by the incoming call.
       * @property {Date} timestamp - Event fire time.
       */
      emitter.publish('call-incoming', data);

      if (session.pendingCall) {
        session.pendingCall.on('canceled', function (data) {
          emitter.publish('call-canceled', data);
          session.deletePendingCall();
        });

        session.pendingCall.on('disconnected', function (data) {
          emitter.publish('call-disconnected', data);
          session.deletePendingCall();
        });
      }
    });

    session.on('conference-invite', function (data) {
      logger.logInfo('conference:invitation-received event  by phone layer');
      /**
       * Conference Invite event.
       * @desc Participant receives this event after a conference invitation is sent to him/her.
       *
       * @event Phone#conference:invitation-received
       * @type {object}
       * @property {String} from - The ID of the caller.
       * @property {String} mediaType - The type of call being received.
       * @property {String} codec - The codec used by the incoming call.
       * @property {Date} timestamp - Event fire time.
       */
      emitter.publish('conference:invitation-received', data);
    });

    session.on('error', function (data) {
      logger.logError("Error in Session");
      logger.logTrace(data);
      emitter.publish('error', data);
    });

    function mediaEstablished(data) {
      logger.logInfo('media established event by phone layer');
      /**
       * Media established event.
       * @desc This event fires after when audio/video media has started
       * @event Phone#media-established
       * @type {object}
       * @property {Date} timestamp - Event fire time.
       */
      emitter.publish('media-established', data);
    }

    function onCallDisconnected(call, data) {
      var calls,
        keys;

      logger.logInfo('call disconnected event by phone layer');
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
      call.off('media-established', mediaEstablished);
      emitter.publish('call-disconnected', data);
      session.deleteCurrentCall();

      calls = session.getCalls();

      keys = Object.keys(calls);
      if (keys.length > 0) {
        session.currentCall = calls[keys[0]];
        that.resume();
        return;
      }

    }

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
        errorInfo.data = JSON.stringify(data);
      }

      logger.logError(JSON.stringify(errorInfo));
      emitter.publish('error', errorInfo);
    }

    function cleanPhoneNumber(number) {
      try {
        return ATT.phoneNumber.cleanPhoneNumber(number);
      } catch (err) {
        logger.logError(err);
        emitter.publish('error', {
          error: err
        });
      }
    }

    function formatNumber(number) {

      try {
        return ATT.phoneNumber.formatNumber(number);

      } catch (err) {
        logger.logError(err);
        emitter.publish('error', {
          error: err
        });
      }
    }

    function connectWithMediaStream(options, call, errorCallback) {

      call.on('stream-added', function (data) {
        userMediaSvc.showStream({
          stream: data.stream,
          localOrRemote: 'remote'
        });
      });

      userMediaSvc.getUserMedia({
        mediaType: options.mediaType,
        localMedia: options.localMedia,
        remoteMedia: options.remoteMedia,
        onUserMedia: function (media) {
          try {
            logger.logDebug('getUserMedia: onUserMedia');
            call.addStream(media.localStream);
            call.connect();
          } catch (error) {
            logger.logError(error);
            if (undefined !== errorCallback
                && 'function' === typeof errorCallback) {
              errorCallback(error);
            }
          }
        },
        onMediaEstablished: function () {
          logger.logDebug('getUserMedia: onMediaEstablished');
          emitter.publish('media-established', {
            id: call.id,
            from: call.peer(),
            timestamp: new Date(),
            mediaType: call.mediaType(),
            codec: call.codec()
          });
        },
        onUserMediaError: function (error) {
          logger.logDebug('getUserMedia: onUserMediaError');
          publishError('13005', error);
          return;
        }
      });
    }

    function getSession() {
      return session;
    }

    function setSession(newSession) {
      session = newSession;
    }
    /**
    * @summary
    * Subscribe to events on a Phone object.
    * @memberOf Phone
    * @instance

    * @example
      var phone = ATT.rtc.Phone.getPhone();
      phone.on('session:ready', function (data) {
        // ... do something
      });
     */
    function on(event, handler) {

      if ('session:ready' !== event
          && 'session:disconnected' !== event
          && 'notification' !== event
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
          && 'conference:invitation-received' !== event
          && 'conference:joining' !== event
          && 'conference:invitation-sending' !== event
          && 'conference:invitation-rejected' !== event
          && 'conference:connecting' !== event
          && 'conference:invitation-sent' !== event
          && 'conference:invitation-accepted' !== event
          && 'conference:participant-removed' !== event
          && 'conference:held' !== event
          && 'conference:resumed' !== event
          && 'conference:disconnecting' !== event
          && 'conference:ended' !== event
          && 'conference:connected' !== event
          && 'warning' !== event
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
     * @fires Phone#session:ready
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
          throw ATT.errorDictionary.getSDKError('2002');
        }
        if (undefined === options.token) {
          throw ATT.errorDictionary.getSDKError('2001');
        }
        if (undefined !== session && null !== session.getId()) {
          throw ATT.errorDictionary.getSDKError('2005');
        }

        try {
          logger.logDebug('Phone.login');

          if (undefined === session) {
            session = new ATT.rtc.Session();
          }

          session.connect(options);


          session.on('ready', function (data) {
            /**
             * Session Ready event.
             * @desc This event fires when the SDK is initialized and ready to make, receive calls
             *
             * @event Phone#session:ready
             * @type {object}
             * @property {String} sessionId - The ID of the session.
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('session:ready', data);
          });

        } catch (err) {
          logger.logError(err);
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
     * @fires Phone#session:disconnected
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
             * @desc This event fires when the session was successfully disconnected.
             *
             * @event Phone#session:disconnected
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('session:disconnected', data);
          });

          session.disconnect();

          setSession(undefined);

        } catch (err) {
          logger.logError(err);
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
     *  - 4000 - Invalid phone number
     *  - 4001 - Invalid SIP URI
     *  - 4002 - Invalid Media Type
     *  - 4003 - Internal error occurred
     *  - 4004 - User is not logged in
     *  - 4005 - onUserMediaError occured
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
     * @fires Phone#notification
     * @fires Phone#error

     * @example
     // Start video call with an ICMN User
     var phone = ATT.rtc.Phone.getPhone();
     phone.dial({
      destination: '11231231234',
      mediaType: 'video',
      localMedia: document.getElementById('localVideo'),
      remoteMedia: document.getElementById('remoteVideo')
     });

     @example
     // Start audio call with a NoTN/VTN User
     var phone = ATT.rtc.Phone.getPhone();
     phone.dial({
      destination: 'john@domain.com',
       mediaType: 'audio',
       localMedia: document.getElementById('localVideo'),
       remoteMedia: document.getElementById('remoteVideo')
     });
     */
    function dial(options) {

      var call;

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

        if (options.destination.indexOf('@') === -1) {
          options.destination = cleanPhoneNumber(options.destination);
          if (false === options.destination) {
            throw ATT.errorDictionary.getSDKError('4000');
          }
        } else if (options.destination.split('@').length > 2) {
          throw ATT.errorDictionary.getSDKError('4001');
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

          call = session.createCall({
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
             * @desc This event fires when a call is connecting
             * @event Phone#call-connecting
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-connecting', data);
          });

          call.on('rejected', function (data) {
            /**
             * Call rejected event.
             * @desc Host side: This event fires when a call is rejected
             * @event Phone#call-rejected
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-rejected', data);
            session.deletePendingCall();
          });

          call.on('connected', function (data) {
            /**
             * Call connected event.
             * @desc This event fires when a call is connected
             * @event Phone#call-connected
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-connected', data);
          });
          call.on('media-established', mediaEstablished);

          call.on('held', function (data) {
            logger.logInfo('call held event by phone layer');
            /**
             * Call on hold event.
             * @desc This event fires when a call has been put on hold
             * @event Phone#call-held
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-held', data);
          });

          call.on('resumed', function (data) {
            logger.logInfo('call resumed by phone layer');
            /**
             * Call resumed event.
             * @desc This event fires when a call has been resumed
             * @event Phone#call-resumed
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-resumed', data);
          });

          call.on('disconnected', function (data) {
            onCallDisconnected(call, data);
          });

          call.on('notification', function (data) {
            logger.logInfo('notification event by phone layer');
            /**
             * Notification event.
             * @desc This event fires when the call ends for a reason
             * @event Phone#notification
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('notification', data);
            session.deleteCurrentCall();
          });

          call.on('error', function (data) {
            emitter.publish('error', data);
          });

          if (2 === ATT.private.pcv) {
            connectWithMediaStream(options, call, function (error) {
              emitter.publish('error', {
                error: ATT.errorDictionary.getSDKError('4003'),
                data: error
              });
            });
            return;
          }

          call.connect(options);

        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError('4003');
        }

      } catch (err) {
        console.log(err.TypeError);
        logger.logError(err);

        emitter.publish('error', {
          error: err
        });
      }
    }

    function addCall(options) {

      var call;

      function dialSecondCall() {
        call.off('held', dialSecondCall);
        session.addCall(call);
        dial(options);
      }

      try {
        if (undefined === options) {
          throw ATT.errorDictionary.getSDKError(27001);
        }
        if (undefined === options.localMedia) {
          throw ATT.errorDictionary.getSDKError(27002);
        }
        if (undefined === options.remoteMedia) {
          throw ATT.errorDictionary.getSDKError(27003);
        }
        if (undefined === options.destination) {
          throw ATT.errorDictionary.getSDKError(27004);
        }
        if (options.destination.indexOf('@') === -1) {
          options.destination = cleanPhoneNumber(options.destination);
          if (false === options.destination) {
            throw ATT.errorDictionary.getSDKError(27005);
          }
        } else if (options.destination.split('@').length > 2) {
          throw ATT.errorDictionary.getSDKError(27006);
        }
        if (undefined !== options.mediaType) {
          if ('audio' !== options.mediaType
              && 'video' !== options.mediaType) {
            throw ATT.errorDictionary.getSDKError(27007);
          }
        }
        if (null === session.getId()) {
          throw ATT.errorDictionary.getSDKError(27008);
        }
        if (null === session.currentCall) {
          throw ATT.errorDictionary.getSDKError(27009);
        }

        try {
          call = session.currentCall;

          call.on('held', dialSecondCall);

          call.hold();
        } catch (err) {
          logger.logError(err);

          throw ATT.errorDictionary.getSDKError(27000);
        }
      } catch (err) {
        logger.logError(err);

        emitter.publish('error', {
          error: err
        });
      }
    }

    function answerCall(call, options) {
      /**
       * Answering event.
       * @desc Fired immediately after the `answer` method is invoked.
       *
       * @event Phone#answering
       * @type {object}
       * @property {Date} timestamp - Event fire time
       * @property {Object} data - data
       */
      emitter.publish('answering', {
        from: call.peer(),
        mediaType: call.mediaType(),
        codec: call.codec(),
        timestamp: new Date()
      });

      call.on('connecting', function (data) {
        emitter.publish('call-connecting', data);
      });
      call.on('connected', function (data) {
        emitter.publish('call-connected', data);
      });
      call.on('media-established', mediaEstablished);
      call.on('held', function (data) {
        emitter.publish('call-held', data);
      });
      call.on('resumed', function (data) {
        emitter.publish('call-resumed', data);
      });
      call.on('disconnected', function (data) {
        onCallDisconnected(call, data);
      });
      call.on('notification', function (data) {
        emitter.publish('notification', data);
        session.deleteCurrentCall();
      });
      call.on('error', function (data) {
        publishError(5002, data);
      });

      if (2 === ATT.private.pcv) {
        connectWithMediaStream(options, call);
        return;
      }

      call.connect(options);
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

     * @fires Phone#answering
     * @fires Phone#call-connecting
     * @fires Phone#call-rejected
     * @fires Phone#call-connected
     * @fires Phone#media-established
     * @fires Phone#call-held
     * @fires Phone#call-resumed
     * @fires Phone#call-disconnected
     * @fires Phone#notification
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.answer({
          localMedia: document.getElementById('localVideo'),
          remoteMedia: document.getElementById('remoteVideo')
        });
     */
    function answer(options) {

      var event,
        call,
        currentCall;

      function answerSecondCall() {
        event = options.action === 'end' ? 'disconnected' : 'held';
        currentCall.off(event, answerSecondCall);

        answerCall(call, options);
      }

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
        call = session.pendingCall;

        if (call === null) {
          publishError(5000);
          return;
        }

        if (undefined !== options.action) {
          if ('hold' !== options.action && 'end' !== options.action) {
            publishError(5005);
            return;
          }
        }
        logger.logInfo('Answering ... ');

        currentCall = session.currentCall;

        if (null !== currentCall) {
          if ('hold' === options.action) {
            currentCall.on('held', answerSecondCall);
            currentCall.hold();
          }
          if ('end' === options.action) {
            currentCall.on('disconnected', answerSecondCall);
            currentCall.disconnect();
          }
          return;
        }

        answerCall(call, options);

      } catch (err) {
        publishError('5002', err);
        return;
      }

    }

    /**
     * @summary
     * Start a conference.
     * @desc
     *
     * **Error Codes**
     *
     *   - 18000 - Parameters missing
     *   - 18001 - Invalid `localMedia` passed
     *   - 18002 - Invalid `remoteMedia` passed
     *   - 18003 - Invalid `mediaType` passed
     *   - 18004 - Failed to get the local user media
     *   - 18005 - Internal error occurred
     *   - 18006 - Cannot make second conference when first in progress
     *   - 18007 - Please login before you make a conference
     *
     * @memberOf Phone
     * @instance
     * @param {Object} options
     * @param {HTMLVideoElement} options.localMedia The host's video element
     * @param {HTMLVideoElement} options.remoteMedia The conference participant's video element
     * @param {String} options.mediaType `video|audio`

     * @fires Phone#conference:connecting
     * @fires Phone#conference:connected
     * @fires Phone#media-established
     * @fires Phone#conference:held
     * @fires Phone#conference:resumed
     * @fires Phone#conference:ended
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.startConference({
       mediaType: 'video',
       localMedia: document.getElementById('localVideo'),
       remoteMedia: document.getElementById('remoteVideo')
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
          logger.logError(data);
          emitter.publish('error', data);
        });

        conference.on('connected', function (data) {
          logger.logInfo('connected conference event published to UI');
          /**
           * conference connected event.
           * @desc A conference has been connected.
           *
           * @event Phone#conference:connected
           * @type {object}
           * @property {Date} timestamp - Event fire time
           * @property {Object} data - data
           */
          emitter.publish('conference:connected', data);
        });

        conference.on('resumed', function (data) {
          logger.logInfo('conference resumed by phone layer');
          /**
           * Conference resumed event.
           * @desc This event fires when a conference has been resumed
           * @event Phone#conference:resumed
           * @type {object}
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference:resumed', data);
        });

        conference.on('held', function (data) {
          logger.logInfo('held conference event published to UI');
          /**
           * conference held event.
           * @desc A conference has been put on hold.
           *
           * @event Phone#conference:held
           * @type {object}
           * @property {Date} timestamp - Event fire time
           * @type {object}
           * @property {String} from - The ID of the caller.
           * @property {String} mediaType - The media type of the conference (audio or video).
           * @property {String} codec - The codec used by the conference.
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference:held', data);
        });

        conference.on('disconnected', function (data) {
          logger.logInfo('conference ended  event by phone layer');
          /**
           * Conference ended event.
           * @desc Indicates a conference has been ended
           *
           * @event Phone#conference:ended
           * @type {object}
           * @property {String} from - The ID of the conference.
           * @property {String} mediaType - The type of conference.
           * @property {String} codec - The codec of the conference
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference:ended', data);
          session.deleteCurrentCall();
        });

        connectWithMediaStream(options, conference);
      } catch (err) {
        publishError('18005', err);
        return;
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
     *   - 20003 - `getUserMedia` failed
     *
     * @memberof Phone
     * @instance
     * @param {Object} options
     * @param {HTMLElement} options.localVideo
     * @param {HTMLElement} options.remoteVideo
     *
     * @fires Phone#conference:joining
     * @fires Phone#conference:connecting
     * @fires Phone#conference:connected
     * @fires Phone#conference:held
     * @fires Phone#conference:resumed
     * @fires Phone#conference:ended
     * @fires Phone#media-established
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.joinConference({
          localMedia: document.getElementById('localVideo'),
          remoteMedia: document.getElementById('remoteVideo')
        });
     */
    function joinConference(options) {

      try {

        if (null === session || null === session.getId()) {
          throw ATT.errorDictionary.getSDKError('20001');
        }
        if (null === session.pendingCall) {
          throw ATT.errorDictionary.getSDKError('20002');
        }

        try {
          logger.logDebug('Phone.joinConference');

          var conference = session.pendingCall;

          /**
           * Conference joining event.
           * @desc Participant side: This event fires immediately after invoking `joinConference`
           * @event Phone#conference:joining
           * @type {object}
           * @property {String} from - The ID of the caller.
           * @property {String} mediaType - The type of conference being received.
           * @property {String} codec - The codec used by the conference
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference:joining', {
            from: conference.peer(),
            mediaType: conference.mediaType(),
            codec: conference.codec(),
            timestamp: new Date()
          });

          conference.on('error', function (data) {
            emitter.publish('error', data);
          });

          conference.on('connecting', function (data) {
            /**
             * Conference connecting event.
             * @desc This event fires when network is trying to connect to a conference.
             * @event Phone#conference:connecting
             * @type {object}
             * @property {String} from - The ID of the caller.
             * @property {String} mediaType - The media type of the conference (audio or video).
             * @property {String} codec - The codec used by the conference.
             * @property {Date} timestamp - Event fire time.
             */
            logger.logInfo('conference connecting event by phone layer');
            emitter.publish('conference:connecting', data);
          });

          conference.on('connected', function (data) {
            logger.logInfo('conference connected event by phone layer');
            emitter.publish('conference:connected', data);
          });

          conference.on('held', function (data) {
            logger.logInfo('conference held event by phone layer');
            emitter.publish('conference:held', data);
          });

          conference.on('resumed', function (data) {
            logger.logInfo('conference resumed event by phone layer');
            emitter.publish('conference:resumed', data);
          });

          conference.on('disconnected', function (data) {
            logger.logInfo('conference ended event by phone layer');
            emitter.publish('conference:ended', data);
            session.deleteCurrentCall();
          });

          conference.on('notification', function (data) {
            logger.logInfo('Notification event by phone layer');
            emitter.publish('notification', data);
            session.deleteCurrentCall();
          });

          connectWithMediaStream(options, conference, function (error) {
            emitter.publish('error', {
              error: ATT.errorDictionary.getSDKError('20000'),
              data: error
            });
          });

        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError('20000');
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
             * @desc This event fires when the media is successfully muted.
             *
             * @event Phone#call-muted
             * @type {object}
             * @property {String} from - The ID of the caller.
             * @property {String} mediaType - The media type.
             * @property {String} codec - The codec used by the call.
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-muted', data);
          });

          if ('muted' !== call.getState()) {
            call.mute();
          } else {
            emitter.publish('warning', {message : 'Already muted'});
          }

        } catch (err) {
          logger.logError(err);
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
             * @desc This event fires when the media is successfully un-muted.
             *
             * @event Phone#call-unmuted
             * @type {object}
             * @property {String} from - The ID of the caller.
             * @property {String} mediaType - The media type of the call (audio or video).
             * @property {String} codec - The codec used by the call.
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-unmuted', data);
          });
          if ('unmuted' !== call.getState()) {
            call.unmute();
          } else {
            emitter.publish('warning', {message : 'Already unmuted'});
          }


        } catch (err) {
          logger.logError(err);
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
     * @summary
     * Returns true if there is a call in progress
     * @memberOf Phone
     * @instance

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.isCallInProgress()
     */
    function isCallInProgress() {
      var call = session.currentCall;

      return (call !== null);
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
     * @fires Phone#call-disconnected

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
            /**
             * Call disconnecting event.
             * @desc Fired immediately after invoking the `hangup` method.
             *
             * @event Phone#call-disconnecting
             * @type {object}
             * @property {Date} timestamp - Event fire time
             * @property {Object} data - data
             */
            emitter.publish('call-disconnecting', data);
          });
          call.disconnect();
        } catch (err) {
          logger.logError(err);
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
      var call = session.pendingCall;

      try {
        if (null === call) {
          throw ATT.errorDictionary.getSDKError('11000');
        }
        try {
          call.on('canceled', function (data) {
            /**
             * Call canceled event.
             * @desc Successfully canceled an outgoing call.
             * @event Phone#call-canceled
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('call-canceled', data);
            session.deleteCurrentCall();
          });

          call.disconnect();
        } catch (err) {
          logger.logError(err);
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
        var call = session.pendingCall;

        if (null === call || null === call.id()) {
          throw ATT.errorDictionary.getSDKError('12000');
        }

        try {

          call.on('rejected', function (data) {
            emitter.publish('call-rejected', data);
            session.deletePendingCall();
          });

          call.reject();
        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError('12001');
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

     * @fires Phone#conference:ended
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
        if (null === session.pendingCall) {
          throw ATT.errorDictionary.getSDKError('22002');
        }

        try {
          logger.logDebug('Phone.rejectConference');

          var conference = session.pendingCall;

          conference.reject();

        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError('22000');
        }

      } catch (err) {
        logger.logError(err);
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

     * @fires Phone#call-held
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
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError('7001');
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


     * @fires Phone#call-resumed
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
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError('8002');
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
     * Move the current call
     * @desc Use this method to move the existing call to other devices
     *
     * **Error Codes**
     *
     *   - 28000 - User is not logged in
     *   - 28001 - Call is not in progress
     *   - 28002 - Internal error occurred
     *
     * @memberOf Phone
     * @instance

     * @fires Phone#

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.move();
     */
    function move() {

      var call;

      try {

        if (null === session || null === session.getId()) {
          throw ATT.errorDictionary.getSDKError('28000');
        }

        call = session.currentCall;

        if (null === call || null === call.id()) {
          throw  ATT.errorDictionary.getSDKError('28001');
        }

        try {
          logger.logDebug('Phone.move');

          // pass `true` for move operation in RTC Manager
          call.hold(true);

        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError('28002');
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
     * Update e911Id
     * @desc Add description here
     * **Error Codes**
     *   - 17000 - e911 parameter is missing
     *   - 17001 - Internal error occurred
     *   - 17002 - User is not logged in
     * @memberOf Phone
     * @instance

     * @fires Phone#address-updated
     * @fires Phone#error

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
            /**
             * Address updated event
             * @desc Indicates the E911 address has been updated successfully.
             *
             * @event Phone#address-updated
             * @type {object}
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('address-updated');
          });

          session.updateE911Id(options);
        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError('17001');
        }

      } catch (err) {
        logger.logError(err);

        emitter.publish('error', {
          error: err
        });
      }
    }

    /* TODO: Removing because this is not part of the public API
     * @summary
     * Add participant
     * @desc
     * Add a participant to a conference
     *
     * **Error Codes**
     *
     *   - 19000 - Participant parameter missing
     *   - 19001 - Internal error occurred
     * @param {String} participant
     *
     * @memberOf Phone
     * @instance
     *
     * @fires Phone#conference:invitation-sending
     * @fires Phone#conference:invitation-sent
     * @fires Phone#conference:invitation-accepted
     * @fires Phone#conference:invitation-rejected
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.addParticipant('4250000001');
     */
    function addParticipant(invitee) {

      try {
        logger.logDebug('Phone.addParticipant');

        if (undefined === invitee) {
          publishError('19000');
          return;
        }
        try {
          this.addParticipants([invitee]);
        } catch (err) {
          publishError('19001', err);
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
     *   - 24005 - Cannot invite existing participant
     *   - 24006 - Invalid phone number
     *   - 24007 - Invalid SIP URI
     *
     * @param {Array} participants List of participant-ids
     *
     * @memberOf Phone
     * @instance

     * @fires Phone#conference:invitation-sending
     * @fires Phone#conference:invitation-sent
     * @fires Phone#conference:invitation-accepted
     * @fires Phone#conference:invitation-rejected
     * @fires Phone#notification
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.addParticipants(['4250000001','4250000002']);
     */
    function addParticipants(participants) {
      var conference,
        counter,
        invitee,
        participant,
        currentParticipants;

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

        currentParticipants = conference.participants();

        conference.on('response-pending', function (data) {
          /**
           * Invitation Sent event
           * @desc Host side: this event fires when an invitation has been successfully sent.
           *
           * @event Phone#conference:invitation-sent
           * @type {object}
           * @property {String} to - The ID of the callee.
           * @property {Object} invitations - The invitations list.
           * @property {Object} participants - The participants list.
           * @property {String} mediaType - The media type of the call (audio or video).
           * @property {String} codec - The codec used by the conference.
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference:invitation-sent', data);
        });

        conference.on('invite-accepted', function (data) {
          /**
           * Invitation accepted event
           * @desc Host side: this event fires when an invitation has been accepted
           *
           * @event Phone#conference:invitation-accepted
           * @type {object}
           * @property {String} to - The ID of the callee.
           * @property {Object} participants - The participants list.
           * @property {String} mediaType - The media type of the call (audio or video).
           * @property {String} codec - The codec used by the conference.
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference:invitation-accepted', data);
        });

        conference.on('rejected', function (data) {
          /**
           * Invitation rejected event
           * @desc Host side: this event fires when an invitation has been rejected
           *
           * @event Phone#conference:invitation-rejected
           * @type {object}
           * @property {String} to - The ID of the callee.
           * @property {Object} participants - The participants list.
           * @property {Object} invitations - The invitations list.
           * @property {String} mediaType - The media type of the conference (audio or video).
           * @property {String} codec - The codec used by the conference.
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference:invitation-rejected', data);
        });

        conference.on('notification', function (data) {
          emitter.publish('notification', data);
        });

        for (counter = 0; counter < participants.length; counter += 1) {
          invitee = participants[counter];
          if (invitee.indexOf('@') === -1) {
            invitee = cleanPhoneNumber(invitee);
            if (false === invitee) {
              publishError('24006');
              return;
            }
          } else if (invitee.split('@').length > 2) {
            publishError('24007');
            return;
          }
          participants[counter] = invitee;
        }

        try {
          for (counter = 0; counter < participants.length; counter += 1) {
            invitee = participants[counter];

            if (0 === Object.keys(currentParticipants).length) {
              /**
               * Invitation sending event
               * @desc Host side: this event fires when an invitation is in the process of sending.
               *
               * @event Phone#conference:invitation-sending
               * @type {object}
               * @property {Object} invitee - The invitee.
               * @property {Date} timestamp - Event fire time.
               */
              emitter.publish('conference:invitation-sending', {
                invitee: invitee,
                timestamp: new Date()
              });
              conference.addParticipant(invitee);
            } else {
              for (participant in currentParticipants) {
                if (invitee !== participant) {
                  emitter.publish('conference:invitation-sending', {
                    invitee: invitee,
                    timestamp: new Date()
                  });
                  conference.addParticipant(invitee);
                } else if (invitee === participant) {
                  publishError('24005', {
                    invitee: invitee,
                    timestamp: new Date()
                  });
                }
              }
            }
          }
        } catch (err) {
          publishError('24004', err);
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

     * @fires Phone#conference:disconnecting
     * @fires Phone#conference:ended
     * @fires Phone#error

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
           * Conference disconnecting event
           * @desc This event fires when a conference is in the process of disconnecting.
           *
           * @event Phone#conference:disconnecting
           * @type {object}
           * @property {String} to - The ID of the callee.
           * @property {Object} participants - The participants list.
           * @property {Object} invitations - The invitations list.
           * @property {String} mediaType - The media type of the conference (audio or video).
           * @property {String} codec - The codec used by the conference.
           * @property {Date} timestamp - Event fire time.
           */
          emitter.publish('conference:disconnecting', data);
        });

        try {
          conference.disconnectConference();
        } catch (err) {
          publishError('23000', err);
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
        participants;

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
          return participants;
        } catch (err) {
          publishError('21001', err);
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
     * Remove participant
     * @desc
     * Remove a participant from an ongoing conference
     *
     * **Error Codes**
     *
     *   - 25000 - User is not logged in
     *   - 25001 - Conference not initiated
     *   - 25002 - Participant parameter missing
     *   - 25003 - Internal error occurred
     *
     * @memberOf Phone
     * @instance
     *
     * @fires Phone#conference:participant-removed
     * @fires Phone#error

     * @example
     var phone = ATT.rtc.Phone.getPhone();
     phone.removeParticipant('johnny');
     */

    function removeParticipant(participant) {

      var conference;

      try {

        logger.logDebug('Phone.removeParticipant');

        if (null === session.getId()) {
          throw ATT.errorDictionary.getSDKError(25000);
        }

        conference = session.currentCall;

        if (null === conference
            || 'conference' !== conference.breed()) {
          throw ATT.errorDictionary.getSDKError(25001);
        }

        if (undefined === participant) {
          throw ATT.errorDictionary.getSDKError(25002);
        }

        try {
          conference.on('participant-removed', function (data) {
            /**
             * Participant removed
             * @desc Host side: this event fires when a host has successfully removed a participant.
             *
             * @event Phone#conference:participant-removed
             * @type {object}
             * @property {Object} participants - The participants list.
             * @property {Object} invitations - The invitations list.
             * @property {String} mediaType - The media type of the conference (audio or video).
             * @property {String} codec - The codec used by the conference.
             * @property {Date} timestamp - Event fire time.
             */
            emitter.publish('conference:participant-removed', data);
          });

          conference.removeParticipant(participant);
        } catch (err) {
          logger.logError(err);
          throw ATT.errorDictionary.getSDKError(25003);
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
    this.setSession = setSession;
    this.login = login;
    this.logout = logout;
    this.dial = dial;
    this.addCall = addCall;
    this.answer = answer;
    this.mute = mute;
    this.unmute = unmute;
    this.getMediaType = getMediaType;
    this.isCallInProgress = isCallInProgress;
    this.hangup = hangup;
    this.hold = hold;
    this.resume = resume;
    this.move = move;
    this.cancel = cancel;
    this.reject = reject;
    this.updateE911Id = updateE911Id;
    this.cleanPhoneNumber = cleanPhoneNumber;
    this.formatNumber = formatNumber;

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
    this.removeParticipant = removeParticipant;
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
