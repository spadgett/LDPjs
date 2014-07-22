module.exports = function(app, store) {
	var rdfserver = require('rdfstore/server.js');	// to serialize JSON-LD
	var ldp = require('./vocab/ldp.js');			// LDP vocabulary
	var media = require('./media.js');				// media types

	// route any requests matching /r/*
	var resource = app.route('/r/*');
	resource.all(function(req, res, next) {
		// all responses should have Link: <ldp:Resource> rel=type
		res.links({
			type: ldp.Resource
		});
		next();
	});

	resource.get(function(req, res, next) {
		console.log('GET ' + req.path);

		// Get the graph
		store.graph(req.fullURL, function(success, graph) {
			if (!success) {
				res.send(500);
				return;
			}

			if (!graph.length) {
				res.send(404);
				return;
			}

			// add ldp:RDFSource in addition to ldp:Resource
			res.links({
				type: ldp.RDFSource
			});

			write(res, graph);
		});
	});

	resource.put(function(req, res, next) {
		console.log('PUT ' + req.path);
		// TODO: Return 201 when PUT creates a resource
		if (req.is(media.turtle) || req.is(media.text) || req.is(media.n3)) {
			store.load(media.turtle, req.rawBody, req.fullURL, function(success) {
				res.send(success ? 204 : 400);
			});
		} else if (req.is(media.jsonld) || req.is(media.json)) {
			var json = JSON.parse(req.rawBody);
			store.load(media.jsonld, json, req.fullURL, function(success) {
				res.send(success ? 204 : 400);
			});
		} else {
			res.status(415);
		}
	});

	resource.post(function(req, res, next) {
		res.send('POST ' + req.path);
	});

	resource.delete(function(req, res, next) {
		console.log('DELETE: ' + req.path);
		store.clear(req.fullURL, function(success) {
			res.send(success ? 204 : 400);
		});
	});

	function write(res, graph) {
		var writer = {};

		// Turtle
		var writeTurtle = function() {
			var text = graph.toNT();
			res.writeHead(200, { 'Content-Type': media.turtle });
			res.end(new Buffer(text), 'utf-8');
		};
		writer[media.turtle] = writeTurtle;
		writer[media.text] = writeTurtle;
		writer[media.n3] = writeTurtle;

		// JSON-LD
		var writeJson = function() {
			var jsonld = rdfserver.Server.graphToJSONLD(graph, store.rdf);
			res.writeHead(200, { 'Content-Type': media.jsonld });
			res.end(new Buffer(JSON.stringify(jsonld)), 'utf-8');
		};
		writer[media.jsonld] = writeJson;
		writer[media.json] = writeJson;

		res.format(writer);
	}
};
