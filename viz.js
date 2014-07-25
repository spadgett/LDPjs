module.exports = function(app, db, env) {
	app.get('/v', function(req, res, next) {
		console.log('GET ' + req.path);

		db.graphs.find().toArray(function(err, docs){
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			var hash = {};
			var jsonRes = { nodes: [], links: [] };
			
			// First build the array of all nodes (resources/graphs),
			// keep track of array indexes
			docs.forEach(function(d){
				var node = {};
				node.name = nodeName(d.name);
				node.group = 0;
				var l = jsonRes.nodes.push(node);
				hash[node.name] = l-1;
			});
			
			// Next find all the arcs between resources
			docs.forEach(function(d) {
				if (d.triples) {
					var subName = nodeName(d.name);
					d.triples.forEach(function(t) {
						var objName = nodeName(t.object);
						if (hash[subName] > -1 &&
							hash[subName] < jsonRes.nodes.length && 
							hash[objName] > -1 &&
							hash[objName] < jsonRes.nodes.length) {
							var link = {};
							link.value = 1; // Always 1, why?
							link.source = hash[subName];
							link.target = hash[objName];
							jsonRes.links.push(link);
						}
					});
				}
			});
			res.json(jsonRes);
		});

	});

	function nodeName(uri) {
		return uri.replace(env.appBase, '');
	}
};
