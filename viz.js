module.exports = function(app, db, env) {
	var rdf = require('./vocab/rdf.js');
	
	app.get('/v', function(req, res, next) {
		console.log('GET ' + req.path);

		db.graphs.find().toArray(function(err, docs){
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			var nodes = {};
			var types = {"none":0};
			var nextGroupIdx = 1;
			var jsonRes = { nodes: [], links: [] };
			
			// First build the array of all nodes (resources/graphs),
			// keep track of array indexes
			docs.forEach(function(d){
				var node = {};
				node.name = nodeName(d.name);
				node.group = 0;
				var l = jsonRes.nodes.push(node);
				nodes[node.name] = l-1;
			});
			
			// Next find all the arcs between resources
			docs.forEach(function(d) {
				if (d.triples) {
					var subName = nodeName(d.name);
					d.triples.forEach(function(t) {
						var objName = nodeName(t.object);
						if (nodes[subName] > -1 &&
							nodes[subName] < jsonRes.nodes.length && 
							nodes[objName] > -1 &&
							nodes[objName] < jsonRes.nodes.length) {
							var link = {};
							link.value = 1; // Always 1, why?
							link.source = nodes[subName];
							link.target = nodes[objName];
							jsonRes.links.push(link);
						}
						if (t.predicate == rdf.type) {
							var g = types[t.object];
							if (g == undefined) {
								types[t.object] = nextGroupIdx++;
							}
							jsonRes.nodes[nodes[subName]].group = g;
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
