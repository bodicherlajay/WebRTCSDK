/**
 * Created by Rakesh Malik on 3/3/14.
 */

var port = process.env.PORT || 2013
var static = require('node-static');
var http = require('http');
var https = require('https');
var file = new (static.Server)();
var app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(port);

var io = require('socket.io').listen(app);

function login() {
    var uname = prompt('Enter your user name: ');
    var pw = prompt('Enter your password: ');

    socket.send('login', {
        uname: uname,
        pw: pw
    })
}