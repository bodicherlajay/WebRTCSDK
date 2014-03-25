/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, white: true, maxlen: 150*/

/**
 Event Emitter implements Mediator pattern publishes local SDP offers to SignallingChannel - triggered by PeerConnectionService
 Publishes remote SDP answer... to PeerConnectionService - triggered by EventChannel
 Acts as single publishing point for UI callbacks

 Give a call object it will give you callback handle for this call object
 Maintains topic style of pub/sub
 **/
var ATT = ATT || {};

(function(mainModule){
    "use strict";
    var module = {};
    var _topics = {};
    var self = this;
    
    module.subscribe = function(topic,callback){
        if( ! _topics.hasOwnProperty( topic ) ) {
            _topics[ topic ] = [];
        }
        _topics[ topic ].push( callback );
        return true;
    };

    module.unsubscribe = function(topic,callback){
        if( ! _topics.hasOwnProperty( topic ) ) {
            return false;
        }

        for( var i = 0, len = _topics[ topic ].length; i < len; i++ ) {
            if( _topics[ topic ][ i ] === callback ) {
                _topics[ topic ].splice( i, 1 );
                return true;
            }
        }
        return false;
    };

    module.publish = function(){
        var args = Array.prototype.slice.call( arguments );
        var topic = args.shift();

        if( ! _topics.hasOwnProperty( topic ) ) {
            return false;
        }

        for( var i = 0, len = _topics[ topic ].length; i < len; i++ ) {
            _topics[ topic ][ i ].apply( undefined, args );
        }
        return true;
    };
    //Name of the module
    mainModule.event = module;

})(ATT || {});