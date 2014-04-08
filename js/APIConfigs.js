/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/
/**
*  WebRTC API REST configuration file.
*  All configured methods will be placed in the ATT.WebRTCAPI namespace.
*  @namespace WebRTCAPI
*/

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  /**
   * Property defaults.
   * @namespace WebRTCAPI.DEFAULTS
   * @type {object}
   */
  var DEFAULTS = {
   /**
    * Developer Hosted Server Resource url.
    * @memberof WebRTCAPI.DEFAULTS
    */
    DHSEndpoint: ATT.appConfig.DHSEndpoint, //'http://localhost:9000',
    /**
    * Black Flag Resource url.
    * @memberof WebRTCAPI.DEFAULTS
    */
    BFEndpoint: ATT.appConfig.BFEndpoint, //'http://wdev.code-api-att.com:8080/RTC/v1',
    /**
    * Default headers.
    * @memberof WebRTCAPI.DEFAULTS
    */
    headers: {'Content-Type': 'application/json',
              'Accept' : 'application/json'}
  },
    /**
     *  Property defaults.
     * @namespace WebRTCAPI.APIConfigs
     * @type {object}
     */
    APIConfigs = {
      /**
      * Authentication to DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      authenticate: {
        method: 'post',
        url: DEFAULTS.DHSEndpoint + '/user/authenticate',
        headers: DEFAULTS.headers
      },
      /**
      * Get access token from DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      getAccessToken: {
        method: 'get',
        url: DEFAULTS.DHSEndpoint + '/user/token',
        headers: DEFAULTS.headers
      },
      /**
      * Logout from DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      logout: {
        method: 'delete',
        url: DEFAULTS.DHSEndpoint + '/user/logout',
        headers: DEFAULTS.headers
      },
      /**
      * Get browser session from DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      getBrowserSession: {
        method: 'get',
        url: DEFAULTS.DHSEndpoint + '/user/session',
        headers: DEFAULTS.headers
      },
      /**
      * Create WebRTC session from BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      createWebRTCSession: {
        method: 'post',
        url: DEFAULTS.BFEndpoint + '/sessions',
        headers: DEFAULTS.headers
      },
      /**
      * Get WebRTC events from BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      getEvents: { },
      /**
      * Start Call via BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      startCall: {
        method: 'post',
        urlFormatter: function (urlParams) {
          return DEFAULTS.BFEndpoint + '/sessions/' + urlParams + '/calls';
        },
        headers: DEFAULTS.headers
      },
      /**
      * End Call via BFEndpoint
      * @memberof WebRTC.APIConfigs
      */
      endCall: {
        method: 'delete',
        urlFormatter: function (urlParams) {
          return DEFAULTS.BFEndpoint + '/sessions/' + urlParams[0] + '/calls/' + urlParams[1];
        },
        headers: DEFAULTS.headers
      }
    };

  // place on ATT.
  app.APIConfigs = APIConfigs;

  // Set the API namespace name.
  app.apiNamespaceName = 'rtc.Phone';

}(ATT || {}));
