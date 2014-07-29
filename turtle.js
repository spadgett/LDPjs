var N3 = require('n3');
var media = require('./media.js');				// media types
var ldp = require('./vocab/ldp.js');			// LDP vocabulary
var rdf = require('./vocab/rdf.js');			// RDF vocabulary

exports.serialize = function(triples, callback) {
	var writer = N3.Writer();
	writer.addTriples(triples);
	writer.end(function(err, content) {
		callback(err, media.turtle, content);
	});
};

exports.parse = function(req, resourceURI, callback) {
	var parser = N3.Parser({
		documentURI: resourceURI
	});
	var triples = [];
	var interactionModel = ldp.RDFSource;
	parser.parse(req.rawBody, function(err, triple) {
		if (err) {
			callback(err);
			return;
		}

		if (triple) {
			// if this triple is <> rdf:type ldp:BasicContainer RDF type,
			// set the interaction model as BasicContainer
			if (triple.subject === resourceURI
				&& triple.predicate === rdf.type
				&& triple.object === ldp.BasicContainer) {
					interactionModel = ldp.BasicContainer;
			}

			triples.push(triple);
			return;
		}

		// when last triple is null, we're done parsing
		callback(null, triples, interactionModel);
	});
}
