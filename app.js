/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');
var rdfstore = require('rdfstore');
var rdfserver = require('rdfstore/server.js');
var url = require('url');

// setup middleware
var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views

// setup rdfstore/mongo
var storage='mongodb';
var store;

if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	var mongo = env['mongodb-2.2'][0].credentials;
} else {
	var mongo = {
		  "hostname" : "localhost",
		  "host" : "127.0.0.1",
		  "port" : 27017
	};
}

if (storage === 'mongodb') {
	new rdfstore.Store({
		persistent: true,
		engine: 'mongodb',
		name: mongo.db || 'ldpjs',
		overwrite: false,
		mongoDomain:
			(mongo.username && mongo.password)
				? mongo.username + ":" + mongo.password + "@" + mongo.hostname
				: mongo.hostname,
		mongoPort: mongo.port
   }, function(ldpjsDB){
	   store = ldpjsDB;
	   registerNamespaces();
   });
} else {
   store = rdfstore.create();
   registerNamespaces();
}

function registerNamespaces() {
	store.registerDefaultProfileNamespaces();
	store.registerDefaultNamespace('http://www.w3.org/ns/ldp#', 'ldp');
}

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

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});

app.route('/r/*')
.all(function(req, res, next) {
	res.links({
		type: 'http://www.w3.org/ns/ldp#Resource'
	});
	next();
})
.get(function(req, res, next) {
	console.log('GET ' + req.path);
	store.graph(req.fullURL, function(success, graph) {
		res.format({
			'text/turtle': function() {
				var text = graph.toNT();
				res.writeHead(200, { 'Content-Type': 'text/turtle' });
				res.end(new Buffer(text), 'utf-8');
			},
			'application/ld+json': function() {
				var jsonld = rdfserver.Server.graphToJSONLD(graph, store.rdf);
				res.writeHead(200, { "Content-Type":"application/ld+json" });
				res.end(new Buffer(JSON.stringify(jsonld)), 'utf-8');
			}
		});
	});
})
.put(function(req, res, next) {
	console.log('PUT ' + req.path);
	if (req.is('text/turtle')) {
		store.load('text/turtle', req.rawBody, req.fullURL, function(success) {
			res.send(success ? 204 : 400);
		});
	} else if (req.is('application/ld+json')) {
		var jsonld = JSON.parse(req.rawBody);
		store.load('application/ld+json', jsonld, req.fullURL, function(success) {
			res.send(success ? 204 : 400);
		});
	} else {
		res.status(415);
	}
})
.post(function(req, res, next) {
	res.send('POST ' + req.path);
})
.delete(function(req, res, next) {
	var uri = url.resolve(app.get('base'), req.url);
	console.log('DELETE: ' + uri);
	store.clear(uri, function(success) {
		res.send(success ? 204 : 400);
	});
});

// render index page
app.get('/', function(req, res){
	res.render('index');
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

