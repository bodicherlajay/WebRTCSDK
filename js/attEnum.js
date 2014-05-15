/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/

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