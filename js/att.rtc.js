/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150 */
/*global ATT*/

(function () {

  'use strict';

  var environments = ATT.private.config.app.environments,
    currentConfiguration = ATT.private.config.app.current,
    dhsURLs = ATT.private.config.app.dhsURLs,
    eventChannelConfig = ATT.private.config.app.eventChannelConfig;

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

    if (undefined === options.environment) {
      currentConfiguration.environment = 'PROD';
    } else {
      foundKey = environments[options.environment];

      if (undefined === foundKey) {
        throw new Error('Environment not recognized');
      }

      currentConfiguration.environment = options.environment;
    }

    if (undefined === options.useWebSockets) {
      currentConfiguration.useWebSockets = false;
      currentConfiguration.eventChannelConfig = eventChannelConfig.LongPolling;
    } else {
      currentConfiguration.useWebSockets = options.useWebSockets;
      currentConfiguration.eventChannelConfig = eventChannelConfig.WebSockets;
    }

    currentConfiguration.RTCEndpoint = environments[options.environment];

    if (undefined === options.DHSEndpoint) {
      currentConfiguration.DHSEndpoint = dhsURLs.HTTPS;
    } else {
      currentConfiguration.DHSEndpoint = dhsURLs[options.DHSEndpoint];
    }

    if (undefined === options.keepAlive) {
      currentConfiguration.keepAlive = 0;
    } else {
      currentConfiguration.keepAlive = options.keepAlive;
    }

    ATT.private.config.api.configure(currentConfiguration);

    return;
  }

  if (undefined === ATT.rtc) {
    throw new Error('Error exporting ATT.rtc.Phone.');
  }

  ATT.rtc.configure = configure;
  ATT.rtc.getConfiguration = getConfiguration;

  // if no one calls ATT.rtc.configure, it should still
  // configure the APIConfigs
  ATT.rtc.configure({
    environment: 'PROD',
    useWebSocket: false
  });

}());
