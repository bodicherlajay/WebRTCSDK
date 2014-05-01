/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/
/**
*  WebRTC API REST configuration file.
*  All configured methods will be placed in the ATT.ATT namespace.
*  @namespace ATT
*/

if (!ATT) {
  var ATT = {};
}

(function (app) {
  'use strict';

  var configure = function () {
    /**
     * Property defaults.
     * @namespace ATT.DEFAULTS
     * @type {object}
     */
    var DEFAULTS = {
     /**
      * Developer Hosted Server Resource url.
      * @memberof ATT.DEFAULTS
      */
      DHSEndpoint: ATT.appConfig.DHSEndpoint,
      /**
      * Black Flag Resource url.
      * @memberof ATT.DEFAULTS
      */
      BFEndpoint: ATT.appConfig.BFEndpoint,
      /**
      * Default headers.
      * @memberof ATT.DEFAULTS
      */
      headers: {
        'Content-Type': 'application/json',
        'Accept' : 'application/json'
      }
    },
      /**
       *  Property defaults.
       * @namespace ATT.APIConfigs
       * @type {object}
       */
      APIConfigs = {
        /**
        * Get browser session from DHSEndpoint
        * @memberof ATT.APIConfigs
        */
        checkDhsSession: {
          method: 'get',
          url: DEFAULTS.DHSEndpoint + '/user/session',
          headers: DEFAULTS.headers
        },
        /**
        * Authentication to DHSEndpoint
        * @memberof ATT.APIConfigs
        */
        oAuthAuthorize: {
          method: 'post',
          url: DEFAULTS.DHSEndpoint + '/oauth/authorize',
          headers: DEFAULTS.headers
        },
        /**
        * Get access token from DHSEndpoint
        * @memberof ATT.APIConfigs
        */
        oAuthToken: {
          method: 'post',
          url: DEFAULTS.DHSEndpoint + '/oauth/token',
          headers: DEFAULTS.headers
        },
        /**
        * Authentication to DHSEndpoint
        * @memberof ATT.APIConfigs
        */
        authenticateUser: {
          method: 'post',
          url: DEFAULTS.DHSEndpoint + '/user/session',
          headers: DEFAULTS.headers
        },
        /**
        * Logout from DHSEndpoint
        * @memberof ATT.APIConfigs
        */
        logoutUser: {
          method: 'delete',
          url: DEFAULTS.DHSEndpoint + '/user/session',
          headers: DEFAULTS.headers
        },
        /**
        * Create new user from DHSEndpoint
        * @memberof ATT.APIConfigs
        */
        registerUser: {
          method: 'post',
          url: DEFAULTS.DHSEndpoint + '/users',
          headers: DEFAULTS.headers
        },
        /**
         * Get e911Id from DHSEndpoint
         * @memberof ATT.APIConfigs
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
         * @memberof ATT.APIConfigs
         */
        createE911Id: {
          method: 'post',
          url: DEFAULTS.DHSEndpoint + '/e911',
          headers: DEFAULTS.headers
        },
        /**
         * Update a e911Id using DHSEndpoint
         * @memberof ATT.APIConfigs
         */
        updateE911Id: {
          method: 'put',
          url: DEFAULTS.DHSEndpoint + '/e911',
          headers: DEFAULTS.headers
        },
        /**
        * Create WebRTC session from BFEndpoint
        * @memberof ATT.APIConfigs
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
        * @memberof ATT.APIConfigs
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
        * @memberof ATT.APIConfigs
        */
        getEvents: {
          method: 'get',
          formatters: {
            url: function (params) {
              return DEFAULTS.BFEndpoint + '/sessions/' + params.sessionId + params.endpoint;
            },
            headers: {
              'Authorization': function (param) {
                return param;
              }
            }
          },
          timeout: 30000,
          headers: DEFAULTS.headers
        },
        /**
        * Start Call via BFEndpoint
        * @memberof ATT.APIConfigs
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
        * @memberof ATT.APIConfigs
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
         * @memberof ATT.APIConfigs
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
        * @memberof ATT.APIConfigs
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
    return APIConfigs;
  },

    configueAPIs = function () {
      app.APIConfigs = configure();
    };

  // place on ATT.
  app.configueAPIs = configueAPIs;

}(ATT || {}));