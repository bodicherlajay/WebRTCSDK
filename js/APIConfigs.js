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
    DHSEndpoint: ATT.appConfig.DHSEndpoint,
    /**
    * Black Flag Resource url.
    * @memberof WebRTCAPI.DEFAULTS
    */
    BFEndpoint: ATT.appConfig.BFEndpoint,
    /**
    * Default headers.
    * @memberof WebRTCAPI.DEFAULTS
    */
    headers: {
      'Content-Type': 'application/json',
      'Accept' : 'application/json'
    }
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
        formatters: {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params + '/calls';
          }
        },
        headers: DEFAULTS.headers
      },
      // For unit testing of getOperation method.
      testCall: {
        method: 'post',
        formatters: {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params + '/calls';
          },
          headers: {
            Authorization: function (param) {
              return 'Bearer ' + param;
            },
            Accept: function (param) {
              return 'TestHeader ' + param;
            }
          }
        },
        headers: DEFAULTS.headers
      },

      /**
      * End Call via BFEndpoint
      * @memberof WebRTC.APIConfigs
      */
      endCall: {
        method: 'delete',
        formatters: {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params[0] + '/calls/' + params[1];
          }
        },
        headers: ATT.utils.extend({
          'x-delete-reason': 'terminate'
        }, DEFAULTS.headers)
      }
    };

  // place on ATT.
  app.APIConfigs = APIConfigs;

  // Set the API namespace name.
  app.apiNamespaceName = 'rtc.Phone';

}(ATT || {}));