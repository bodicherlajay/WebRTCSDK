/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/
/**
* Application configuration file.  This must be loaded first.
*
*/

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  app.appConfig = {

    BFEndpoint:   'http://wdev.code-api-att.com:8080/RTC/v1',

    DHSEndpoint:  'http://localhost:9000'

  };

}(ATT || {}));