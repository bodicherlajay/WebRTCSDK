/**
 * Created by Rakesh Malik on 3/2/2014.
 */

require('newrelic');
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var configDB = require('./js/config/database.js');

mongoose.connect(configDB.url);

require('./js/config/passport.js')(passport);

app.configure(function () {
    app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.bodyParser());

    app.set('view engine', 'ejs');

    app.use(express.session({secret: 'ilovescotchscotchyscotchscotch'}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
})

require('./routes.js')(app, passport);

app.listen(port);
console.log('Server listening on port: ' + port);