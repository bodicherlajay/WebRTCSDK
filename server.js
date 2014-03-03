/**
 * Created by Rakesh Malik on 2/25/14.
 */

var port = process.env.PORT || 2013
var static = require('node-static');
var http = require('http');
var https = require('https');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(port);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket){

    // convenience function to log server messages on the client
    function log(){
        var array = [">>> Message from client: "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }

    socket.on('login', function () {
        socket.emit('success', {token: 'token'});
    });

    socket.on('message', function (message) {
        log('Got message:', message);
        // for a real app, would be room only (not broadcast)
        socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function (room) {
        var numClients = io.sockets.clients(room).length;

        log('Room ' + room + ' has ' + numClients + ' client(s)');
        log('Request to create or join room ' + room);

        if (numClients === 0){
            socket.join(room);
            console.log("Room: " + room + " created.");
            socket.emit('created', room);
        } else if (numClients === 1) {
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            console.log("Client joined room.");
            socket.emit('joined', {joined: room});
        } else { // max two clients
            socket.emit('full', room);
        }
        socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
        socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

    });

});
