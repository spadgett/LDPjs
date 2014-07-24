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
		db.get(req.fullURL, function(err, triples) {
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			if (!triples) {
				res.send(404);
				return;
			}

			writeTurtle(res, triples);
		});
	});

	resource.put(function(req, res, next) {
		console.log('PUT ' + req.path);
		var parser = N3.Parser();
		var triples = [];
		parser.parse(req.rawBody, function(err, triple) {
			if (err) {
				res.send(400);
				return;
			}
		   
			if (triple) {
				triples.push(triple);
				return;
			}

			db.put(req.fullURL, null, null, triples, function(err) {
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
		res.send(501);
	});

	resource.delete(function(req, res, next) {
		console.log('DELETE: ' + req.path);
		res.send(501);
	});

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
