/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

//Dependency: None

if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  'use strict';

  var module = {};

  module.UserTypes = {
    ICMN: 'MOBILENUMBER',
    VTN: 'VTN',
    NOTN: 'NOTN'
  };

  module.SdkEvents = {
    SDK_READY: 'SDK Ready'
  };

  module.SessionEvents = {
    RTC_SESSION_CREATED: 0,
    RTC_SESSION_DELETED: 1,
    RTC_SESSION_ERROR: 2
  };
  module.CallStatus = {
   /**
* @memberof ATT.rtc.Phone
* @constant {number} 
 */
    READY:      0,
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

  module.RTCCallEvents = {
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


  module.EventsMapping = {
    SESSION_OPEN:             module.CallStatus.ESTABLISHED,
    SESSION_MODIFIED:         module.CallStatus.SESSION_MODIFIED,
    SESSION_TERMINATED:       module.CallStatus.ERROR,
    CALL_CONNECTING:          module.CallStatus.CONNECTING,
    CALL_IN_PROGRESS:         module.CallStatus.INPROGRESS,
    INVITATION_RECEIVED:      module.CallStatus.RINGING,
    MODIFICATION_RECEIVED:    module.CallStatus.MODIFICATION_RECEIVED,
    MODIFICATION_TERMINATED:  module.CallStatus.MODIFICATION_TERMINATED,
    TRANSFER_INITIATED:       module.CallStatus.TRANSFER_INITIATED,
    TRANSFER_TERMINATED:      module.CallStatus.TRANSFER_TERMINATED,
    ADD_FAILED:               module.CallStatus.ADD_FAILED,
    REMOVE_FAILED:            module.CallStatus.REMOVE_FAILED,
    MOVE_TERMINATED:          module.CallStatus.MOVE_TERMINATED,
    MUTED:                    module.CallStatus.MUTED,
    RTC_SESSION_CREATED:      module.CallStatus.READY,
    RTC_SESSION_DELETED:      module.SessionEvents.RTC_SESSION_DELETED,
    RTC_SESSION_ERROR:        module.SessionEvents.RTC_SESSION_ERROR,
    UNMUTED:                  module.CallStatus.UNMUTED,
    UNKNOWN:                  module.CallStatus.ERROR,

  };

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
  mainModule.MediaTypes = Object.freeze(module.MediaTypes);

}(ATT || {}));