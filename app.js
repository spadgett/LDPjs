/*jshint node:true*/

// ldp.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');
//var rdfstore = require('rdfstore');

// setup middleware
var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views

// setup rdfstore/mongo
/* var storage='mongodb';
var store;

if (storage === 'mongodb') {
   store = new rdfstore.Store({persistent:true, 
                    engine:'mongodb', 
                    name:'ldpjs', 
                    overwrite:false,    
                    mongoDomain:'localhost', 
                    mongoPort:27017 
                   }, function(ldpjsDB){
                   	   store = ldpjsDB;
                   });
} else {
   store = rdfstore.create();
} */

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});

app.route('/resources/*')
.all(function(req, res, next) {
	res.links({
		type: 'http://www.w3.org/ns/ldp#Resource'
	});
	next();
})
.get(function(req, res, next) {
	res.send('GET ' + req.path);
})
.put(function(req, res, next) {
	res.send('PUT ' + req.path);
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

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
// TODO: Get service credentials and communicate with bluemix services.

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);
// Start server
app.listen(port, host);
console.log('App started on port ' + port);

