/*
 * Copyright 2014 IBM Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Initializes MongoDB and starts the app. The main application logic is in
 * service.js.
 */

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
