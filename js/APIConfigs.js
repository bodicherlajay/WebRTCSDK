/**
    WebRTC API REST configuration file.
    All configured methods will be placed in the ATT.WebRTCAPI namespace.
*/
var ATT = ATT || {};
(function (app) {
    'use strict';

    var dhsResource = 'http://localhost:9000',
        bfResource = 'http://wdev.code-api-att.com:8080/RTC';

    var APIConfigs = {
        authenticate: {
            method: 'post',
            url: dhsResource + '/user/authenticate',
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        },
        logout: {
            method: 'delete',
            url: dhsResource + '/user/logout',
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        },
        getBrowserSession: {
            method: 'get',
            url: dhsResource + '/user/session',
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        },
        createWebRTCSession: {
            method: 'post',
            url: bfResource + '/v1/sessions',
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        },
        getEvents: {
            method: 'get',
            url: bfResource + '/v1/sessions/{sessionId}/events',
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        }
    };

    app.APIConfigs = APIConfigs;
}(ATT || {}));
