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
      * Get browser session from DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      checkDhsSession: {
        method: 'get',
        url: DEFAULTS.DHSEndpoint + '/user/session',
        headers: DEFAULTS.headers
      },
      /**
      * Authentication to DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      authenticateUser: {
        method: 'post',
        url: DEFAULTS.DHSEndpoint + '/user/session',
        headers: DEFAULTS.headers
      },
      /**
      * Get access token from DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      getAccessToken: {
        method: 'put',
        url: DEFAULTS.DHSEndpoint + '/user/session',
        headers: DEFAULTS.headers
      },
      /**
      * Logout from DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      logoutUser: {
        method: 'delete',
        url: DEFAULTS.DHSEndpoint + '/user/session',
        headers: DEFAULTS.headers
      },
      /**
      * Create new user from DHSEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      registerUser: {
        method: 'post',
        url: DEFAULTS.DHSEndpoint + '/users',
        headers: DEFAULTS.headers
      },
      /**
       * Get e911Id from DHSEndpoint
       * @memberof WebRTCAPI.APIConfigs
       */
      getE911Id: {
        method: 'get',
        formatters : {
          url: function (params) {
            return DEFAULTS.DHSEndpoint + '/e911/' + params;
          }
        },
        headers: DEFAULTS.headers
      },
      /**
       * Create a e911Id using DHSEndpoint
       * @memberof WebRTCAPI.APIConfigs
       */
      createE911Id: {
        method: 'post',
        url: DEFAULTS.DHSEndpoint + '/e911',
        headers: DEFAULTS.headers
      },
      /**
       * Update a e911Id using DHSEndpoint
       * @memberof WebRTCAPI.APIConfigs
       */
      updateE911Id: {
        method: 'put',
        url: DEFAULTS.DHSEndpoint + '/e911',
        headers: DEFAULTS.headers
      },
      /**
      * Create WebRTC session from BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      createWebRTCSession: {
        method: 'post',
        url: DEFAULTS.BFEndpoint + '/sessions',
        formatters: {
          headers: {
            'Authorization': function (param) {
              return 'Bearer ' + param;
            },
            'x-e911Id': function (param) {
              return param;
            }
          }
        },
        headers: DEFAULTS.headers
      },
      /**
      * Delete WebRTC session from BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      deleteWebRTCSession: {
        method: 'delete',
        formatters : {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params;
          },
          headers: {
            'Authorization': function (param) {
              return 'Bearer ' + param;
            },
            'x-e911Id': function (param) {
              return param;
            }
          }
        },
        headers: DEFAULTS.headers
      },
      /**
      * Get WebRTC events from BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      getEvents: {
        method: 'get',
        formatters: {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params.sessionId + '/' + params.endpoint;
          },
          headers: {
            'Authorization': function (param) {
              return 'Authorization: Bearer ' + param;
            }
          },
          timeout: 30000
        },
        headers: DEFAULTS.headers
      },
      /**
      * Start Call via BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      startCall: {
        method: 'post',
        formatters: {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params + '/calls';
          },
          headers: {
            'Authorization': function (param) {
              return param;
            }
          }
        },
        headers: DEFAULTS.headers
      },

      /**
      * Answer Call via BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      answerCall: {
        method: 'put',
        formatters: {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params[0] + '/calls/' + params[1];
          },
          headers: {
            'Authorization': function (param) {
              return param;
            }
          }
        },
        headers: ATT.utils.extend({
          'x-calls-action' : 'call-answer'
        }, DEFAULTS.headers)
      },
      /**
       * Modify Call via BFEndpoint
       * Used for hold, resume
       * @memberof WebRTCAPI.APIConfigs
       */
      modifyCall: {
        method: 'put',
        formatters: {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params[0] + '/calls/' + params[1];
          },
          headers: {
            'Authorization': function (param) {
              return param;
            },
            'x-calls-action': function (param) {
              return param;
            }
          }
        },
        headers: DEFAULTS.headers
      },
      /**
      * Accept Modifications via BFEndpoint
      * @memberof WebRTCAPI.APIConfigs
      */
      acceptModifications: {
        method: 'put',
        formatters: {
          url: function (params) {
            return DEFAULTS.BFEndpoint + '/sessions/' + params[0] + '/calls/' + params[1];
          },
          headers: {
            'Authorization': function (param) {
              return param;
            },
            'x-modId': function (param) {
              return param;
            }
          }
        },
        headers: ATT.utils.extend({
          'x-calls-action' : 'accept-call-mod'
        }, DEFAULTS.headers)
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
          },
          headers: {
            'Authorization': function (param) {
              return param;
            }
          }
        },
        headers: ATT.utils.extend({
          'x-delete-reason': 'terminate'
        }, DEFAULTS.headers)
      }
    };

  // place on ATT.
  app.APIConfigs = APIConfigs;

}(ATT || {}));