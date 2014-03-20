/**
    WebRTC API REST configuration file.
    All configured methods will be placed in the ATT.WebRTCAPI namespace.
*/
var ATT = ATT || {};
(function (app) {
    'use strict';

    var APIConfigs = {
        authenticate: {
            method: 'post',
            url: 'http://localhost:8080/user/authenticate', // DHS
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        },
        logout: {
            method: 'delete',
            url: 'http://localhost:8080/user/logout',
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        },
        getBrowserSession: {
            method: 'get',
            url: 'http://localhost:8080/user/session',
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        },
        createWebRTCSession: {
            method: 'post',
            url: 'http://wdev.code-api-att.com:8080/RTC/v1/sessions',   // BF Emulator
            headers: {'Content-type': 'application/json','Accept' : 'application/json'}
        }
    };

    app.APIConfigs = APIConfigs;
}(ATT || {}));
