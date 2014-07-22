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

			if (isEmpty(graph)) {
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

		var body = getBody(req);

		// Get the graph to see if the resource exists
		store.graph(req.fullURL, function(success, graph) {
			if (!success) {
				res.send(500);
			}

			store.load(body.mediaType, body.content, req.fullURL, function(success) {
				if (success) {
					if (isEmpty(graph)) {
						// PUT to create
						res.location(req.fullURL).send(201);
					} else {
						// PUT to update
						res.send(204);
					}
				} else {
					// FIXME: is 400 always correct?
					res.send(400);
				}
			});
		});
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

	function isEmpty(graph) {
		return !graph.length;
	}

	function getBody(req) {
		if (req.is(media.turtle) || req.is(media.text) || req.is(media.n3)) {
			return {
				content: req.rawBody,
				mediaType: media.turtle
			};
		}

		if (req.is(media.jsonld) || req.is(media.json)) {
			return {
				content: JSON.parse(req.rawBody),
				mediaType: media.jsonld
			};
		}

		return null;
	}
};
