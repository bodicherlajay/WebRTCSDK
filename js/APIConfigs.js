/**
    WebRTC API REST configuration file.
    All configured methods will be placed in the ATT.WebRTCAPI namespace.
*/
var ATT = ATT || {};

(function (app) {
    'use strict';

    var DEFAULTS = {
        DHSResource: 'http://localhost:9000',
        BFResource: 'http://wdev.code-api-att.com:8080/RTC',
        headers: {'Content-type': 'application/json','Accept' : 'application/json'}
    };

    var APIConfigs = {
        authenticate: {
            method: 'post',
            url: DEFAULTS.DHSResource + '/user/authenticate',
            headers: DEFAULTS.headers
        },
        getAccessToken: {
            method: 'get',
            url: DEFAULTS.DHSResource + '/user/token',
            headers: DEFAULTS.headers
        },
        logout: {
            method: 'delete',
            url: DEFAULTS.DHSResource + '/user/logout',
            headers: DEFAULTS.headers
        },
        getBrowserSession: {
            method: 'get',
            url: DEFAULTS.DHSResource + '/user/session',
            headers: DEFAULTS.headers
        },
        createWebRTCSession: {
            method: 'post',
            url: DEFAULTS.BFResource + '/v1/sessions',
            headers: DEFAULTS.headers
        },
        getEvents: {
            method: 'get',
            url: DEFAULTS.BFResource + '/v1/sessions/{sessionId}/events',
            headers: DEFAULTS.headers
        }
    };

    // place on the ATT.WebRTCAPI namespace.
    app.APIConfigs = APIConfigs;

}(ATT || {}));
