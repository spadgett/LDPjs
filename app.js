/*jshint node:true*/

// ldp.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');
var rdfstore = require('rdfstore');
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
		name: 'ldpjs',
		overwrite: false,
		mongoDomain:
			(mongo.username && monog.password)
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
	var uri = url.resolve(app.get('base'), req.url);
	console.log('GET: ' + uri);
	store.graph(uri, function(success, graph) {
		res.format({
			'text/turtle': function() {
				res.type('text/turtle').send(graph.toNT());
			}
		});
	});
})
.put(function(req, res, next) {
	var uri = url.resolve(app.get('base'), req.url);
	console.log('PUT: ' + uri);
	console.log(req.rawBody);
	if (req.is('text/turtle')) {
		store.load('text/turtle', req.rawBody, uri, function() {
			res.send('got it, thanks');
		});
	} else {
		res.status(415, 'why not turtle?');
	}
})

.post(function(req, res, next) {
	res.send('POST ' + req.path);
})
.delete(function(req, res, next) {
	res.send('DELETE ' + req.path);
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

// The base URL.
// FIXME: https?
var base = url.format({
	protocol: 'http',
	hostname: host,
	port: port,
});

// The root LDP container.
var rootContainer = url.resolve(base, '/r/');
console.log('Using root container: ' + rootContainer);

// Remember the URLs as app properties.
app.set('base', base);
app.set('rootContainer', rootContainer);


// Start server
app.listen(port, host);
console.log('App started on port ' + port);

