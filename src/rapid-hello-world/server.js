var http = require('http');
var express = require('express');

var expressApp = express(); 
expressApp.configure(function(){
	console.log('Serving files from: ' + __dirname);
	expressApp.use(express.static(__dirname));
});
expressApp.listen(7070, function(){
	console.log('Server is up and running...')
});

expressApp.get('/hello', function(req, res){
	res.json({message: 'hello there!!!'});
});

