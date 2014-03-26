/**
* WebSocket Class
* @param {String} URL The Web Socket Location
* @param {Function} message_handler The callback
* @param {Number} debug_level The Console Log condition
**/
function WS( url, message_handler, debug_level ) {

    var self = this;
    debug_level = (typeof arg == 'undefined' ? debug_level : 1);

    var queue = [ ];
    var websocket = new WebSocket(url);
    self.websocket = websocket;

    websocket.onopen = function (evt) {
        log('OnOpen');
        while (queue.length > 0){
            msg = queue[0];
            self.send(msg);
            queue.shift();  
        }
    };

    websocket.onclose = function (evt) {
        log('OnClose');
    }

    websocket.onmessage = function (evt) {
        log('OnMessage');
        message_handler(evt);
    }

    websocket.onerror = function (evt) {
        log('OnError');
    }

    function log(msg){
        console.log('WebSocket:' + msg);
    }

    self.close = function(){
        websocket.close();
    }

    self.send = function(msg){
        var CONNECTING = 0;
        var OPEN = 1;
        var CLOSING = 2;
        var CLOSED = 3;

        if (websocket.readyState == OPEN){
            log('sent ' + msg);
            websocket.send(msg);
        } else {
            log('sent queued due to non-open WebSocket');
            queue.push(msg);
        }
    }
}