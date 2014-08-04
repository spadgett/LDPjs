module.exports = function(app, db, env) {
	var rdf = require('./vocab/rdf.js');
	var ldp = require('./vocab/ldp.js');

	app.get('/v', function(req, res, next) {
		console.log('GET ' + req.path);

		db.graphs.find({ deleted: { $ne: true }, 'triples.0': { $exists: true } }).toArray(function(err, docs){
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
				var node = {
					name: nodeName(d.name),
					group: 0
				};
				var l = jsonRes.nodes.push(node);
				nodes[node.name] = l-1;
			});

			// Next find all the arcs between resources
			docs.forEach(function(d) {
				var subName = nodeName(d.name);
				if (nodes[subName] === undefined) {
					return;
				}

				// Add in containment triples, which are stored with the resource
				if (d.containedBy) {
					var containerName = nodeName(d.containedBy);
					if (nodes[containerName] !== undefined) {
						jsonRes.links.push({
							value: 1, // Always 1, why?
							source: nodes[containerName],
							target: nodes[subName]
						});
					}
				}

				d.triples.forEach(function(t) {
					var objName = nodeName(t.object);
					if (nodes[objName] !== undefined) {
						jsonRes.links.push({
							value: 1, // Always 1, why?
							source: nodes[subName],
							target: nodes[objName]
						});
					}

					// Assign a group based on rdf:type, but ignore some
					// generic LDP types like ldp:RDFSource
					if (t.predicate === rdf.type &&
							t.object !== ldp.Resource &&
							t.object !== ldp.RDFSource &&
							t.object !== ldp.Container) {
						if (!types[t.object]) {
							types[t.object] = nextGroupIdx++;
						}
						jsonRes.nodes[nodes[subName]].group = types[t.object];
					}
				});
			});
			res.json(jsonRes);
		});

	});

	function nodeName(uri) {
		return uri.replace(env.appBase, '');
	}
};
