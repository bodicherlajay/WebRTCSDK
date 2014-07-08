/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT*/

(function () {

  'use strict';

  var environments = ATT.private.config.app.environments,
    currentConfiguration = ATT.private.config.app.current;

  function getConfiguration() {
    return currentConfiguration;
  }

  function configure(options) {

    var foundKey;

    if (undefined === options
        || Object.keys(options).length === 0) {
      currentConfiguration.environment = 'PROD';
      currentConfiguration.useWebSockets = false;
      return;
    }

    if (undefined === options.key) {
      currentConfiguration.environment = 'PROD';
    } else {
      foundKey = environments[options.key];

      if (undefined === foundKey) {
        throw new Error('Environment not recognized');
      }

      currentConfiguration.environment = options.key;
    }

    if (undefined === options.useWebSockets) {
      currentConfiguration.useWebSockets = false;
    } else {
      currentConfiguration.useWebSockets = options.useWebSockets;
    }

    return;
  }

  if (undefined === ATT.rtc) {
    throw new Error('Error exporting ATT.rtc.Phone.');
  }

  ATT.rtc.configure = configure;
  ATT.rtc.getConfiguration = getConfiguration;

}());
