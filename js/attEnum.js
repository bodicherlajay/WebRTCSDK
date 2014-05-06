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
    READY:      0,
    CALLING:    1,
    RINGING:    2,
    INPROGRESS: 3,
    HOLD:       4,
    TRANSITION: 5,
    WAITING: 6,
    ENDED: 7,
    RESUMED: 8,
    MUTED: 9,
    UNMUTED: 10,
    ERROR: 99
  };

  module.RTCCallEvents = {
    SESSION_OPEN:             'session-open',
    SESSION_MODIFIED:         'session-modified',
    SESSION_TERMINATED:       'session-terminated',
    INVITATION_SENT:          'invitation-sent', // this is not an event really
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