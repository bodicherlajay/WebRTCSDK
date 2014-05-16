/*jslint indent:2, browser: true, node: true*/

/** This is the file to initialize all depencecies
  * for the Unit Tests
  */

// every other module needs the ATT var available
(function () {
  'use strict';

  var typeOfWindow = typeof window,
    // get the root of the current environment
    rootEnv = 'undefined' === typeOfWindow ? module.exports : window;

  // create ATT if it doesn't exist
  if (undefined === rootEnv.ATT) {
    rootEnv.ATT = {};
  }
}());