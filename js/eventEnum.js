/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/


if (!ATT) {
  var ATT = {};
}

(function (mainModule) {
  "use strict";
  var module = {};

  module.CallStatus = {
    READY:      0,
    CALLING:    1,
    RINGING:    2,
    INPROGRESS: 3,
    HOLD:       4,
    TRANSITION: 5,
    WAITING:    6,
    ENDED:      'ENDED',
    ERROR:      8
  };

  module.RTCEvents = {
    SESSION_OPEN:             "session-open",
    SESSION_MODIFIED:         "session-modified",
    SESSION_TERMINATED:       "session-terminated",
    INVITATION_RECEIVED:      "invitation-received",
    MODIFICATION_RECEIVED:    "mod-received",
    MODIFICATION_TERMINATED:  "mod-terminated",
    TRANSFER_INITIATED:       "transfer-initiated",
    TRANSFER_TERMINATED:      "transfer-terminated",
    ADD_FAILED:               "add-failed",
    REMOVE_FAILED:            "remove-failed",
    MOVE_TERMINATED:          "Move Terminated",
    UNKNOWN:                  "Unknown"
  };

  module.MediaTypes = {
    AUDIO_VIDEO:      "audiovideo",
    MEDIA_CONFERENCE: "media-conference",
    MEDIACONFERENCE:  "mediaconference"
  };
  mainModule.CallStatus = Object.freeze(module.CallStatus);
  mainModule.RTCEvents = Object.freeze(module.RTCEvents);

}(ATT || {}));
