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

  var configure = function (appConfig) {
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
      DHSEndpoint: appConfig.DHSEndpoint,
      /**
      * RTC Resource url.
      * @memberof ATT.DEFAULTS
      */
      RTCEndpoint: appConfig.RTCEndpoint,
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
        * Create new user from DHSEndpoint
        * @memberof ATT.APIConfigs
        */
        registerUser: {
          method: 'post',
          url: DEFAULTS.DHSEndpoint + '/users',
          headers: DEFAULTS.headers
        },
        /**
        * Get a list of VTNs from DHSEndpoint
        * @memberof ATT.APIConfigs
        */
        getVTNList: {
          method: 'get',
          url: DEFAULTS.DHSEndpoint + '/setup/vtnlist',
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
         * Get e911Id from DHSEndpoint
         * @memberof ATT.APIConfigs
         */
        getE911Id: {
          method: 'get',
          formatters : {
            url: function (e911Id) {
              return DEFAULTS.DHSEndpoint + '/e911/' + e911Id;
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
        * Create WebRTC session from RTCEndpoint
        * @memberof ATT.APIConfigs
        */
        createWebRTCSession: {
          method: 'post',
          url: DEFAULTS.RTCEndpoint + '/sessions',
          formatters: {
            headers: {
              'Authorization': function (oAuthToken) {
                return 'Bearer ' + oAuthToken;
              },
              'x-e911Id': function (e911id) {
                return e911id;
              },
              'x-Arg': function (xArg) {
                return xArg;
              }
            }
          },
          headers: DEFAULTS.headers
        },
        /**
        * Delete WebRTC session from RTCEndpoint
        * @memberof ATT.APIConfigs
        */
        deleteWebRTCSession: {
          method: 'delete',
          formatters : {
            url: function (sessionId) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + sessionId;
            },
            headers: {
              'Authorization': function (oAuthToken) {
                return 'Bearer ' + oAuthToken;
              },
              'x-e911Id': function (e911id) {
                return e911id;
              }
            }
          },
          headers: DEFAULTS.headers
        },
        /**
        * Get WebRTC events from RTCEndpoint
        * @memberof ATT.APIConfigs
        */
        getEvents: {
          method: ATT.appConfig.EventChannelConfig.method,
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params.sessionId + params.endpoint;
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
        * Start Call via RTCEndpoint
        * @memberof ATT.APIConfigs
        */
        startCall: {
          method: 'post',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params + '/calls';
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
        * Answer Call via RTCEndpoint
        * @memberof ATT.APIConfigs
        */
        answerCall: {
          method: 'put',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/calls/' + params[1];
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
         * Modify Call via RTCEndpoint
         * Used for hold, resume
         * @memberof ATT.APIConfigs
         */
        modifyCall: {
          method: 'put',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/calls/' + params[1];
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
        * Accept Modifications via RTCEndpoint
        * @memberof ATT.APIConfigs
        */
        acceptModifications: {
          method: 'put',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/calls/' + params[1];
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
        * End Call via RTCEndpoint
        * @memberof WebRTC.APIConfigs
        */
        endCall: {
          method: 'delete',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/calls/' + params[1];
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

    configueAPIs = function (appConfig) {
      app.APIConfigs = configure(appConfig);
    };

  // place on ATT.
  app.configueAPIs = configueAPIs;

}(ATT || {}));