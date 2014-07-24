module.exports = function(app, store) {
	var url = require('url');
	var rdfserver = require('rdfstore/server.js');	// to serialize JSON-LD
	var ldp = require('./vocab/ldp.js');			// LDP vocabulary
	var media = require('./media.js');				// media types

	var rdf = rdf;

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

		// get the graph
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

		// does the resource already exist?
		store.execute(askExists(req.fullURL), function(success, exists) {
			if (!success) {
				res.send(500);
				return;
			}

			if (exists) {
				update(req, res);
			} else {
				create(req, res);
			}
		});
	});

	resource.post(function(req, res, next) {
		console.log('POST ' + req.path);

		// does the container already exist?
		store.execute(askExists(req.fullURL), function(success, exists) {
			if (!success) {
				res.send(500);
				return;
			}

			if (!exists) {
				res.send(404);
				return;
			}

			// is it a container?
			store.execute(askContainer(req.fullURL), function(success, result) {
				if (!success) {
					res.send(500);
					return;
				}

				if (!result) {
					res.send(405);
					return;
				}

				create(req, res, req.fullURL);
			});
		});
	});

	resource.delete(function(req, res, next) {
		console.log('DELETE: ' + req.path);
		store.execute(askExists(req.fullURL), function(success, exists) {
			if (!success) {
				res.send(500);
				return;
			}

			if (!exists) {
				res.send(404);
				return;
			}

			store.clear(req.fullURL, function(success) {
				res.send(success ? 204 : 500);
			});
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
			var jsonld = rdfserver.Server.graphToJSONLD(graph, rdf);
			res.writeHead(200, { 'Content-Type': media.jsonld });
			res.end(new Buffer(JSON.stringify(jsonld)), 'utf-8');
		};
		writer[media.jsonld] = writeJson;
		writer[media.json] = writeJson;

		res.format(writer);
	}

	function askExists(uri) {
		return 'ASK { GRAPH <' + uri + '> { ?s ?p ?o } }';
	}

	function askContainer(uri) {
		// TODO: other container types
		return 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>'
					+ ' ASK { GRAPH <' + uri + '> { <' + uri + '> rdf:type <' + ldp.BasicContainer + '> } }';
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

	function create(req, res, container) {
		var loc;
		if (container) {
			// POST to container, generate a unique ID
			// TODO: look at slug request header
			var slug = 'res' + Date.now();
			// FIXME: query parameters?
			loc =  req.fullURL
		   				+ ((req.fullURL.substr(-1) == '/') ? '' : '/')
					   	+ slug;
			console.log(loc);
		} else {
			// PUT to create
			loc = req.fullURL;
		}

		save({
			req: req,
			loc: loc,
			ok: function() {
				if (container) {
					// insert containment triples
					store.execute(
						'INSERT DATA { GRAPH <' + container + '>'
							+ ' { <' + container + '> <' + ldp.contains + '> <' + loc + '> }'
							+ '	}',
						function(success) {
							if (success) {
								res.location(loc).send(201);
							} else {
								// rollback?
								res.send(500);
							}
						});
				} else {
					res.location(loc).send(201);
				}
			},
			error: function() {
				// FIXME: always 400?
				res.send(400);
			}
		});
	}

	function update(req, res) {
		// clear the triples first to replace the resource
		store.clear(req.fullURL, function(succces) {
			if (!success) {
				res.send(500);
				return;
			}

			save({
				req: req,
				ok: function() {
					res.send(204);
				},
				error: function() {
					// FIXME: rollback?!
					// FIXME: always 400?
					res.send(400);
				}
			});
		});
	}

	function save(kwArgs) {
		var body = getBody(kwArgs.req);
		var loc = kwArgs.loc || kwArgs.req.fullURL;
		/*
		var options = {
			graph: loc,
		   	baseURI: kwArgs.req.fullURL
		};
		*/

		store.load(body.mediaType, body.content, loc, function(success) {
			if (success && kwArgs.ok) {
				kwArgs.ok();	
			}

			if (!success && kwArgs.error) {
			   	kwArgs.error();
			}
		});
	}
};
