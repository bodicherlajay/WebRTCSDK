/**
  *  WebRTC API REST configuration file.
  *  All configured methods will be placed in the ATT.WebRTCAPI namespace.
  *  @namespace WebRTCAPI
  */
var ATT = ATT || {};

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
        BFResource: 'http://wdev.code-api-att.com:8080/RTC',
    /**
     * Default headers.
     * @memberof WebRTCAPI.DEFAULTS
     */
        headers: {'Content-type': 'application/json','Accept' : 'application/json'}
    };

  /**
   *  Property defaults.
   * @namespace WebRTCAPI.APIConfigs
   * @type {object}
   */
    var APIConfigs = {
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
            url: DEFAULTS.BFResource + '/v1/sessions',
            headers: DEFAULTS.headers
        },
    /**
     * Get WebRTC events from BFResource
     * @memberof WebRTCAPI.APIConfigs
     */
        getEvents: {
            method: 'get',
            url: DEFAULTS.BFResource + '/v1/sessions/{sessionId}/events',
            headers: DEFAULTS.headers
        }
    };

    // place on the ATT.WebRTCAPI namespace.
    app.APIConfigs = APIConfigs;

}(ATT || {}));
