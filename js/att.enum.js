/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//Dependency: None

(function (mainModule) {
  'use strict';

  var module = {}, SessionEvents, RTCCallEvents, EventsMapping = {};

  module.UserTypes = {
    ICMN: 'MOBILENUMBER',
    VTN: 'VTN',
    NOTN: 'NOTN'
  };

  module.CallTypes = {
    OUTGOING: 'Outgoing',
    INCOMING: 'Incoming'
  };

  module.CallStates = {
    INITIAL: 'Call Setting up',
    ONGOING: 'Call Ongoing',
    MUTED:   'Call Muted',
    MOVED: 'Call Moved',
    HELD: 'Call Held',
    RESUMED: 'Call Resumed',
    TRANSFERED: 'Call Transferred',
    ENDED: 'Call Ended'
  };

  // TODO: should get rid of this
  module.SdkEvents = {
    SDK_READY: 'SdkReady',
    USER_MEDIA_INITIALIZED: 'UserMediaInitialized',
    REMOTE_STREAM_ADDED: 'RemoteStreamAdded'
  };

  SessionEvents = {
    RTC_SESSION_CREATED: "session-created",
    RTC_SESSION_DELETED: "session-deleted",
    RTC_SESSION_ERROR: "session-error"
  };

  module.CallStatus = {
   /**
* @constant {number}
 */
    SESSION_READY:      0,
       /**
* @constant {number}
 */
    CONNECTING:    1,
       /**
* @constant {number}
 */
    RINGING:    2,
       /**
* @constant {number}
 */
    INPROGRESS: 3,
       /**
* @constant {number}
 */
    HOLD:       4,
       /**
* @constant {number}
 */
    TRANSITION: 5,
       /**
* @constant {number}
 */
    WAITING: 6,
       /**
* @constant {number}
 */
    ENDED: 7,
       /**
* @constant {number}
 */
    RESUMED: 8,
    /**
* @constant {number}
 */
    ESTABLISHED: 9,

    /**
* @constant {number}
 */
    SESSION_DELETED: 10,

    /**
* @constant {number}
 */
    SESSION_ERROR: 11,

 /**
     * @constant {number} Used to indicate the originating party is calling.
     **/
    CALLING: 14,

       /**
* @constant {number}
 */
    ERROR: 99
       /**
* @constant {number}
 */
  };

  RTCCallEvents = {
    SESSION_OPEN:             'session-open',
    SESSION_MODIFIED:         'session-modified',
    SESSION_TERMINATED:       'session-terminated',
    CALL_CONNECTING:          'call-connecting',
    CALL_RINGING:             'call-ringing',
    CALL_IN_PROGRESS:         'call-in-progress',
    INVITATION_RECEIVED:      'invitation-received',
    MODIFICATION_RECEIVED:    'mod-received',
    MODIFICATION_TERMINATED:  'mod-terminated',
    TRANSFER_INITIATED:       'transfer-initiated',
    TRANSFER_TERMINATED:      'transfer-terminated',
    ADD_FAILED:               'add-failed',
    REMOVE_FAILED:            'remove-failed',
    MOVE_TERMINATED:          'Move Terminated',
    UNKNOWN:                  'Unknown'
  };


  EventsMapping[RTCCallEvents.SESSION_OPEN] =               module.CallStatus.ESTABLISHED;
  EventsMapping[RTCCallEvents.SESSION_MODIFIED] =           module.CallStatus.SESSION_MODIFIED;
  EventsMapping[RTCCallEvents.SESSION_TERMINATED] =         module.CallStatus.ERROR;
  EventsMapping[RTCCallEvents.CALL_CONNECTING] =            module.CallStatus.CONNECTING;
  EventsMapping[RTCCallEvents.CALL_IN_PROGRESS] =           module.CallStatus.INPROGRESS;
  EventsMapping[RTCCallEvents.INVITATION_RECEIVED] =        module.CallStatus.RINGING;
  EventsMapping[RTCCallEvents.MODIFICATION_RECEIVED] =      module.CallStatus.MODIFICATION_RECEIVED;
  EventsMapping[RTCCallEvents.MODIFICATION_TERMINATED] =    module.CallStatus.MODIFICATION_TERMINATED;
  EventsMapping[RTCCallEvents.TRANSFER_INITIATED] =         module.CallStatus.TRANSFER_INITIATED;
  EventsMapping[RTCCallEvents.TRANSFER_TERMINATED] =        module.CallStatus.TRANSFER_TERMINATED;
  EventsMapping[RTCCallEvents.ADD_FAILED] =                 module.CallStatus.ADD_FAILED;
  EventsMapping[RTCCallEvents.REMOVE_FAILED] =              module.CallStatus.REMOVE_FAILED;
  EventsMapping[RTCCallEvents.MOVE_TERMINATED] =            module.CallStatus.MOVE_TERMINATED;
  EventsMapping[SessionEvents.RTC_SESSION_CREATED] =        module.CallStatus.SESSION_READY;
  EventsMapping[SessionEvents.RTC_SESSION_DELETED] =        module.CallStatus.SESSION_DELETED;
  EventsMapping[SessionEvents.RTC_SESSION_ERROR] =          module.CallStatus.SESSION_ERROR;
  EventsMapping[RTCCallEvents.UNKNOWN] =                    module.CallStatus.ERROR;



  module.RTCCallEvents = RTCCallEvents;
  module.SessionEvents = SessionEvents;
  module.EventsMapping = EventsMapping;

  module.MediaTypes = {
    AUDIO_VIDEO:      'audiovideo',
    MEDIA_CONFERENCE: 'media-conference',
    MEDIACONFERENCE:  'mediaconference'
  };

  mainModule.UserTypes = Object.freeze(module.UserTypes);
  mainModule.CallTypes = Object.freeze(module.CallTypes);
  mainModule.CallStates = Object.freeze(module.CallStates);
  mainModule.SdkEvents = Object.freeze(module.SdkEvents);
  mainModule.SessionEvents = Object.freeze(module.SessionEvents);
  mainModule.CallStatus = Object.freeze(module.CallStatus);
  mainModule.RTCCallEvents = Object.freeze(module.RTCCallEvents);
  mainModule.EventsMapping = Object.freeze(module.EventsMapping);
  mainModule.MediaTypes = Object.freeze(module.MediaTypes);

}(ATT || {}));