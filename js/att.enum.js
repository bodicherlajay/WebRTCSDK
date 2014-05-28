/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//Dependency: None

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';

  var module = {}, SessionEvents, RTCCallEvents, EventsMapping = {};

  module.UserTypes = {
    ICMN: 'MOBILENUMBER',
    VTN: 'VTN',
    NOTN: 'NOTN'
  };

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
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    SESSION_READY:      0,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    CONNECTING:    1,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    RINGING:    2,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    INPROGRESS: 3,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    HOLD:       4,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    TRANSITION: 5,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    WAITING: 6,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    ENDED: 7,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    RESUMED: 8,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    MUTED: 9,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    UNMUTED: 10,
        /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    ESTABLISHED: 11,

    SESSION_DELETED: 12,

    SESSION_ERROR: 13,
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    ERROR: 99
       /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
  };

  RTCCallEvents = {
    SESSION_OPEN:             'session-open',
    SESSION_MODIFIED:         'session-modified',
    SESSION_TERMINATED:       'session-terminated',
    CALL_CONNECTING:          'call-connecting',
    CALL_IN_PROGRESS:         'call-in-progress',
    INVITATION_RECEIVED:      'invitation-received',
    MODIFICATION_RECEIVED:    'mod-received',
    MODIFICATION_TERMINATED:  'mod-terminated',
    TRANSFER_INITIATED:       'transfer-initiated',
    TRANSFER_TERMINATED:      'transfer-terminated',
    ADD_FAILED:               'add-failed',
    REMOVE_FAILED:            'remove-failed',
    MOVE_TERMINATED:          'Move Terminated',
    MUTED:                    'call-muted',
    UNMUTED:                  'call-unmuted',
    UNKNOWN:                  'Unknown'
  };


  EventsMapping[RTCCallEvents.SESSION_OPEN] =            module.CallStatus.ESTABLISHED;
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
  EventsMapping[RTCCallEvents.MUTED] =                      module.CallStatus.MUTED;
  EventsMapping[SessionEvents.RTC_SESSION_CREATED] =        module.CallStatus.SESSION_READY;
  EventsMapping[SessionEvents.RTC_SESSION_DELETED] =        module.CallStatus.SESSION_DELETED;
  EventsMapping[SessionEvents.RTC_SESSION_ERROR] =          module.CallStatus.SESSION_ERROR;
  EventsMapping[RTCCallEvents.UNMUTED] =                    module.CallStatus.UNMUTED;
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
  mainModule.SdkEvents = Object.freeze(module.SdkEvents);
  mainModule.SessionEvents = Object.freeze(module.SessionEvents);
  mainModule.CallStatus = Object.freeze(module.CallStatus);
  mainModule.RTCCallEvents = Object.freeze(module.RTCCallEvents);
  mainModule.EventsMapping = Object.freeze(module.EventsMapping);
  mainModule.MediaTypes = Object.freeze(module.MediaTypes);

}(ATT || {}));