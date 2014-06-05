/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT, WebSocket, Env*/

(function (ATT) {
  'use strict';
  var phoneNumber = {
    alphaLookup: {
      'a':2,
      'b':2,
      'c':2,
      'd':3,
      'e':3,
      'f':3,
      'g':4,
      'h':4,
      'i':4,
      'j':5,
      'k':5,
      'l':5,
      'm':6,
      'n':6,
      'o':6,
      'p':7,
      'q':7,
      'r':7,
      's':7,
      't':8,
      'u':8,
      'v':8,
      'w':9,
      'x':9,
      'y':9,
      'z':9
    },
    stringify: function (text) {
      // strip all non numbers
      var cleaned = phoneNumber.translate(text),
        len = cleaned.length,
        countryCode = (cleaned.charAt(0) === '1'),
        arr = cleaned.split(''),
        diff;

      // if it's long just return it unformatted
      if (len > (countryCode ? 11 : 10)) {
        return cleaned;
      }

      // if it's too short to tell
      if (!countryCode && len < 4) {
        return cleaned;
      }

      // remove country code if we have it
      if (countryCode) {
        arr.splice(0, 1);
      }

      // the rules are different enough when we have
      // country codes so we just split it out
      if (countryCode) {
        if (len > 1) {
          diff = 4 - len;
          diff = (diff > 0) ? diff : 0;
          arr.splice(0, 0, " (");
          // back fill with spaces
          arr.splice(4, 0, (new Array(diff + 1).join(' ') + ") "));

          if (len > 7) {
            arr.splice(8, 0, '-');
          }
        }
      } else {
        if (len > 7) {
          arr.splice(0, 0, "(");
          arr.splice(4, 0, ") ");
          arr.splice(8, 0, "-");
        } else if (len > 3) {
          arr.splice(3, 0, "-");
        }
      }

      // join it back when we're done with the CC if it's there
      return (countryCode ? '1' : '') + arr.join('');
    },
    translate: function(input){
      var digits = '';
      for(var i = 0; i < input.length; i++){
        var ch = input.charAt(i);
        if(isNaN(ch)) {
          if (!(phoneNumber.alphaLookup[ch.toLowerCase()] === undefined)) {
            digits += phoneNumber.alphaLookup[ch.toLowerCase()];
          }
        } else {
          digits += ch;
        }
      };
      return String(digits);
    },
    parse: function (input) {
      return String(input)
        .toUpperCase()
        .replace(/[A-Z]/g, function (l) {
          return (l.charCodeAt(0) - 65) / 3 + 2 - ("SVYZ".indexOf(l) > -1) || 0;
        })
        .replace(/\D/g, '');
    },
    getCallable: function (input, countryAbr) {
      var country = countryAbr || 'us',
        cleaned = phoneNumber.translate(input);
      if (cleaned.length === 10) {
        if (country === 'us') {
          return '1' + cleaned;
        }
      } else {
        if (country === 'us' && cleaned.length === 11 && cleaned.charAt(0) === '1') {
          return cleaned;
        }
        return false;
      }
    }
  };

  ATT.phoneNumber = phoneNumber;
}(ATT));