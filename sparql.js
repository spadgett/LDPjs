module.exports = function(app, store) {
	var rdfserver = require('rdfstore/server.js');
	var ldp = require('./vocab/ldp.js');
	
	var resource = app.route('/s');

	resource.post(function(req, res, next) {
		console.log('POST ' + req.path);
		console.dir(req.rawBody);
		store.execute(req.rawBody, function(success, results) {
			if (!success) {
				res.send(500);
				return;
			}
			res.json(results);
		});
	});
};