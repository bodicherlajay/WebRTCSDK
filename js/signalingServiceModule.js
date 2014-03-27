/**
 * Created by Alex on 3/24/2014.
 */

var ATT = ATT || {};

(function (app) {
    "use strict";
    
    app.SignalingService = {
        
        send: function (config) {
            
            var data = {
                call: {
                    calledParty: 'tel:+' + config.calledParty,
                    sdp: config.sdp
                }
            };
            
            ATT.WebRTC.startCall({
                urlParams: [ATT.WebRTC.Session.Id], // pass this to the urlFormatter
                headers: {
                    Authorization: 'Bearer ' + ATT.WebRTC.Session.accessToken,
                    'Content-type': 'application/json',
                    'Accept' : 'application/json'
                },
                data: data,
                success: function (obj) {
                    
                    var location = obj.getResponseHeader('Location'),
                        xState = obj.getResponseHeader('x-state'),
                        headers = {
                            location: location,
                            xState: xState
                        };
                    
                    // call success callback passed to send.
                    if (typeof config.success === 'function') {
                        config.success.call(null, headers);
                    }
                    
                    // new ATT.EventChannel.Event({})?
//                    var event = {
//                        type: '',
//                        data: ''
//                    };
//                    
//                    ATT.EventChannel.publish(ATT.WebRTC.Session.Id, event);
                },
                error: function () {
                    if (typeof config.error === 'function') {
                        config.error.call(null);
                    }
                }
            });
        }
    };
}(ATT || {}));