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
    DHSResource: 'http://localhost:9000',
    /**
    * Black Flag Resource url.
    * @memberof WebRTCAPI.DEFAULTS
    */
    BFResource: 'http://wdev.code-api-att.com:8080/RTC/v1',
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
      * Authentication to DHSResource
      * @memberof WebRTCAPI.APIConfigs
      */
      authenticate: {
        method: 'post',
        url: DEFAULTS.DHSResource + '/user/authenticate',
        headers: DEFAULTS.headers
      },
      /**
      * Get access token from DHSResource
      * @memberof WebRTCAPI.APIConfigs
      */
      getAccessToken: {
        method: 'get',
        url: DEFAULTS.DHSResource + '/user/token',
        headers: DEFAULTS.headers
      },
      /**
      * Logout from DHSResource
      * @memberof WebRTCAPI.APIConfigs
      */
      logout: {
        method: 'delete',
        url: DEFAULTS.DHSResource + '/user/logout',
        headers: DEFAULTS.headers
      },
      /**
      * Get browser session from DHSResource
      * @memberof WebRTCAPI.APIConfigs
      */
      getBrowserSession: {
        method: 'get',
        url: DEFAULTS.DHSResource + '/user/session',
        headers: DEFAULTS.headers
      },
      /**
      * Create WebRTC session from BFResource
      * @memberof WebRTCAPI.APIConfigs
      */
      createWebRTCSession: {
        method: 'post',
        url: DEFAULTS.BFResource + '/sessions',
        headers: DEFAULTS.headers
      },
      /**
      * Get WebRTC events from BFResource
      * @memberof WebRTCAPI.APIConfigs
      */
      getEvents: { },
      /**
      * Start Call via BFResource
      * @memberof WebRTCAPI.APIConfigs
      */
      startCall: {
        method: 'post',
        urlFormatter: function (urlParams) {
          return DEFAULTS.BFResource + '/sessions/' + urlParams + '/calls';
        },
        headers: DEFAULTS.headers
      },
      /**
      * End Call via BFResource
      * @memberof WebRTC.APIConfigs
      */
      endCall: {
        method: 'delete',
        urlFormatter: function (urlParams) {
          return DEFAULTS.BFResource + '/sessions/' + urlParams[0] + '/calls/' + urlParams[1];
        },
        headers: DEFAULTS.headers
      }
    };

  // place on ATT.
  app.APIConfigs = APIConfigs;

  // Set the API namespace name.
  app.apiNamespaceName = 'rtc.Phone';

}(ATT || {}));
