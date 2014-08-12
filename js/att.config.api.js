/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150*/
/*global ATT:true*/
/**
* @file WebRTC API REST configuration file.
*/

if (!ATT) {
  var ATT = {};
}

(function () {
  'use strict';

  var configure = function (appConfig) {
    /**
     * Property defaults.
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
         * Delete a user from DHSEndpoint
         * @memberof ATT.APIConfigs
         */
        deleteUser: {
          method: 'delete',
          formatters: {
            url: function (userId) {
              return DEFAULTS.DHSEndpoint + '/users/' + userId;
            }
          },
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
         * Create a e911Id using DHSEndpoint
         * @memberof ATT.APIConfigs
         */
        createE911Id: {
          method: 'post',
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
        * Refresh WebRTC session from RTCEndpoint
        * @memberof ATT.APIConfigs
        */
        refreshWebRTCSession: {
          method: 'put',
          formatters: {
            url: function (sessionId) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + sessionId;
            },
            headers: {
              'Authorization': function (oAuthToken) {
                return 'Bearer ' + oAuthToken;
              }
            }
          },
          headers: DEFAULTS.headers
        },
        /**
        * Refresh WebRTC session with e911Id from RTCEndpoint
        * @memberof ATT.APIConfigs
        */
        refreshWebRTCSessionWithE911Id: {
          method: 'put',
          formatters: {
            url: function (sessionId) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + sessionId;
            },
            headers: {
              'Authorization': function (oAuthToken) {
                return 'Bearer ' + oAuthToken;
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
          method: 'get',
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
          headers: {
            'Content-Type': 'application/json',
            'Accept' : 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
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
        createCall: {
          method: 'POST',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params.sessionId + '/' + params.type;
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
        connectCall: {
          method: 'PUT',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params.sessionId + '/' + params.type + '/' + params.callId;
            },
            headers: {
              'Authorization': function (param) {
                return param;
              },
              'x-conference-action' : function (action) {
                return action;
              },
              'x-calls-action' : function (action) {
                return action;
              }
            }
          },
          headers: DEFAULTS.headers
        },
        createConference: {
          method: 'POST',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/conferences';
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
         * Add Participant to conference via RTCEndpoint
         * @memberof ATT.APIConfigs
         */
        addParticipant: {
          method: 'put',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/conferences/'
                + params[1] + '/participants/' + params[2];
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
         * Add Participant via RTCEndpoint
         * @memberof ATT.APIConfigs
         */
        removeParticipant: {
          method: 'delete',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/conferences/'
                + params[1] + '/participants/' + params[2];
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
        * End Call/Conference via RTCEndpoint
        * @memberof WebRTC.APIConfigs
        */
        endCall: {
          method: 'delete',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/' + params[1] + '/' + params[2];
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
        },
        /**
         * Reject Call via RTCEndpoint
         * @memberof WebRTC.APIConfigs
         */
        rejectCall: {
          method: 'delete',
          formatters: {
            url: function (params) {
              return DEFAULTS.RTCEndpoint + '/sessions/' + params[0] + '/' + params[1] + '/' + params[2];
            },
            headers: {
              'Authorization': function (param) {
                return param;
              }
            }
          },
          headers: ATT.utils.extend({
            'x-delete-reason': 'reject'
          }, DEFAULTS.headers)
        },
        /**
         * Cancel Call via RTCEndpoint
         * @memberof WebRTC.APIConfigs
         */
        cancelCall: {
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
            'x-delete-reason': 'cancel'
          }, DEFAULTS.headers)
        }
      };
    return APIConfigs;
  };

  function getConfiguration() {
    var currentConfig = ATT.private.config.app.getConfiguration();
    return configure(currentConfig);
  }

  // place on ATT.
  if (undefined === ATT.private.config.api) {
    throw new Error('Error exporting ATT.private.config.api.getConfiguration');
  }

  ATT.private.config.api.getConfiguration = getConfiguration;
  ATT.private.config.api.configure = configure;

}(ATT || {}));