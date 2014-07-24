module.exports = function(app, db) {
	var url = require('url');
	var ldp = require('./vocab/ldp.js');			// LDP vocabulary
	var media = require('./media.js');				// media types
	var N3 = require('n3');

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
		db.get(req.fullURL, function(err, triples, interactionModel) {
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			if (!triples) {
				res.send(404);
				return;
			}

			res.links({
				type: ldp.RDFSource
			});

			if (interactionModel === ldp.BasicContainer) {
				res.links({
					type: ldp.BasicContainer
				});

				// add in ldp:contains triples
				db.getContainment(req.fullURL, function(err, containment) {
					if (err) {
						console.log(err.stack);
						res.send(500);
						return;
					}

					containment.forEach(function(resource) {
						triples.push({
							subject: req.fullURL,
							predicate: ldp.contains,
							object: resource
						});
					});

					writeTurtle(res, triples);
				});	
			} else {
				writeTurtle(res, triples);
			}
		});
	});

	resource.put(function(req, res, next) {
		console.log('PUT ' + req.path);
		if (!req.is('text/turtle')) {
			res.send(415);
			return;
		}

		parse(req, function(err, triples, interactionModel) {
			if (err) {
				res.send(400);
				return;
			}

			db.put(req.fullURL, null, interactionModel, triples, function(err) {
				if (err) {
					console.log(err.stack);
					res.send(500);
					return;
				}
			
				res.send(204);	
			});
		});
	});

	resource.post(function(req, res, next) {
		console.log('POST ' + req.path);
		if (!req.is('text/turtle')) {
			res.send(415);
			return;
		}

		db.isContainer(req.fullURL, function(err, result) {
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			console.log('isContainer: ' + result);
			
			if (!result) {
				res.send(409);
				return;
			}

			parse(req, function(err, triples, interactionModel) {
				if (err) {
					res.send(400);
					return;
				}
			   
				var loc = req.fullURL
							   + ((req.fullURL.substr(-1) == '/') ? '' : '/')
							   + 'res' + Date.now();
				db.put(loc, req.fullURL, interactionModel, triples, function(err) {
					if (err) {
						console.log(err.stack);
						res.send(500);
						return;
					}
				
					res.location(loc).send(201);	
				});
			});
		});
	});

	resource.delete(function(req, res, next) {
		console.log('DELETE: ' + req.path);
		res.send(501);
	});

	function parse(req, callback) {
		var parser = N3.Parser();
		var triples = [];
		var interactionModel = ldp.RDFSource;
		parser.parse(req.rawBody, function(err, triple) {
			if (err) {
				callback(err);
				return;
			}
		   
			if (triple) {
				if (triple.subject === ''
					&& triple.predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
					&& triple.object === ldp.BasicContainer) {
						interactionModel = ldp.BasicContainer;
				}

				triples.push(triple);
				return;
			}

			callback(null, triples, interactionModel);
		});
	}

	function writeTurtle(res, triples) {
		var writer = new N3.Writer();
		writer.addTriples(triples);
		writer.end(function(err, result) {
			if (err) {
				res.send(500);
			} else {
				res.writeHead(200, { 'Content-Type': media.turtle });
				res.end(new Buffer(result), 'utf-8');
			}
		});
	}
};
