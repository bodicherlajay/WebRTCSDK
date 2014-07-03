/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true, Env:true, cmgmt:true, EventDispatcher:true*/

//Dependency: Env.resourceManager, utils.eventDispatcher (cyclic), utils.sdpParser, cmgmt.CallManager

(function (mainModule) {
  'use strict';

  var logger,
    session,
    sessionId,
    module = {},
    instance,
    createRTCEvent,
    RTCEvent,
    eventRegistry;

  /**
  * Dispatch Event to Registry
  * @param {Object} event The event object
  * @param {Object} callManager Instance of Call Manager
  */
  function dispatchEventToHandler(event) {
    setTimeout(function () {
      var CODEC = [], mediaType = '';

      logger.logDebug('dispatching event: ' + event.state);

      if (event.sdp) {
        // Added a getCodec method to the util to get access the codec
        CODEC =  ATT.sdpFilter.getInstance().getCodecfromSDP(event.sdp);
        mediaType = (CODEC.length === 1) ? 'audio' : 'video';
        session.setMediaType(mediaType);
      }
      logger.logDebug('Codec from the event, ' + CODEC);
      if (eventRegistry[event.state]) {
        logger.logDebug('Processing the registered event ' + event.state);
        if (event.state === mainModule.RTCCallEvents.SESSION_TERMINATED && event.reason) {
          event.error = event.reason;
        }
        if (event.state === mainModule.RTCCallEvents.MODIFICATION_TERMINATED && event.reason !== 'success') {
          event.error = event.reason;
        }
        eventRegistry[event.state](createEvent({
          from: event.from ? event.from.split('@')[0].split(':')[1] : '',
          to: session && session.getCurrentCall() ? session.getCurrentCall().to() : '',
          state: setUIEventState(event),
          codec: CODEC,
          mediaType: mediaType,
          data: event.data,
          error: event.error || ''
        }), {
          sdp: event.sdp || '',
          resource: event.resourceURL || '',
          modId: event.modId || ''
        });
      } else {
        logger.logError('No event handler defined for ' + event.state);
      }
    }, 0);
  }
  /*
  * Subscribes to all Event Channel announcements
  * and triggers UI callbacks
  * @param {Object} event The event object
  */
  function interceptEventChannelCallback(event) {
    if (!event) {
      logger.logError('Not able to consume null event...');
      return;
    }

    logger.logDebug('Consume event from event channel', JSON.stringify(event));

    // set current event on the session
    //session.setEventObject(event);

    if (event.resourceURL) {
      session.getCurrentCall().setId(event.resourceURL.split('/')[6]);
    }

    dispatchEventToHandler(event);
  }

  //Event structure for RTCEvent
  /** Event Object structure for RTC Event
   * @param from Origination party
   * @param to  Destination party
   * @param state Call State
   * @param codec Audio/Video Codec
   * @param error Error Description
   * @type {{from: string, to: string, timeStamp: string, state: string, codec: array, error: string}}
   */
  RTCEvent = {
    from: '',
    to: '',
    timeStamp: '',
    state: '',
    codec: [],
    mediaType: '',
    data: null,
    error: null
  };

  createRTCEvent = function (arg) {
    logger.logDebug('Creating event ' + arg.state);

    if (arg.state.hasOwnProperty(ATT.CallStatus)) {
      throw new Error('State must be of type ATT.CallStatus');
    }

    var evt = Object.create(RTCEvent);
    evt.state = arg.state;
    evt.from = arg.from;
    evt.to = arg.to;
    evt.timestamp = new Date();
    evt.codec = arg.codec;
    evt.mediaType = arg.mediaType;
    evt.data = arg.data;
    evt.error = arg.error ? mainModule.Error.create(arg.error) : null;
    Object.freeze(evt);

    logger.logTrace('Created event object', evt);
    return evt;
  };

  function setLogger(lgr) {
    logger = lgr;
  }

  function init() {
    return {
      createRTCEvent: createRTCEvent,
      setLogger: setLogger
    };
  }

  module.getInstance = function () {
    if (!instance) {
      instance = init();
    }
    return instance;
  };

  mainModule.RTCEvent = module;

}(ATT || {}));