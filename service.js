module.exports = function(app, store) {
	var rdfserver = require('rdfstore/server.js');
	var ldp = require('./vocab/ldp.js');

	var resource = app.route('/r/*')
	resource.all(function(req, res, next) {
		res.links({
			type: ldp.Resource
		});
		next();
	});

	resource.get(function(req, res, next) {
		console.log('GET ' + req.path);
		store.graph(req.fullURL, function(success, graph) {
			if (!success) {
				res.send(500);
				return;
			}

			res.links({
				type: ldp.RDFSource
			});

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
	});

	resource.put(function(req, res, next) {
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
};
