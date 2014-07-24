/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/).

var express = require('express');
var url = require('url');

// setup middleware
var app = express();
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views

// fill in full request URL
app.use(function(req, res, next) {
	req.fullURL = req.protocol + '://' + req.get('host') + req.originalUrl;
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
db.init(function(err) {
	if (err) {
		console.log(err);
	} else {
		require('./service.js')(app, db);
		require('./viz.js')(app, db);
	}
});

// error handling
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});

// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);

// Start server
app.listen(port, host);
console.log('App started on port ' + port);

