/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/).

var express = require('express');
var env = require('./env.js');

console.log("configuration:");
console.dir(env);

// setup middleware
var app = express();
app.use(express.static(__dirname + '/public'));

// fill in full request URL
app.use(function(req, res, next) {
	req.fullURL = env.appBase + req.originalUrl;
	next();
});

// fill in req.rawBody
app.use(function(req, res, next) {
	req.rawBody = '';
	req.setEncoding('utf8');

	req.on('data', function(chunk) {
		req.rawBody += chunk;
	});

	req.on('end', function() {
		next();
	});
});

// initialize database and set up LDP services and viz when ready
var db = require('./db.js');
db.init(env, function(err) {
	if (err) {
		console.log(err);
	} else {
		require('./service.js')(app, db, env);
		require('./viz.js')(app, db, env);
	}
});

// error handling
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});

// Start server
app.listen(env.listenPort, env.listenHost);
console.log('App started on port ' + env.listenPort);
