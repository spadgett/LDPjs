var N3 = require('n3');
var url = require('url');
var path = require('path');
var media = require('./media.js');				// media types
var ldp = require('./vocab/ldp.js');			// LDP vocabulary
var rdf = require('./vocab/rdf.js');			// RDF vocabulary

// normalize paths (remove '.' and '..')
function normalize(urlStr) {
	var urlObj = url.parse(urlStr);
	urlObj.pathname = path.normalize(urlObj.pathname);
	return urlObj.format();
}

exports.serialize = function(triples, callback) {
	var writer = N3.Writer();
	writer.addTriples(triples);
	writer.end(function(err, content) {
		callback(err, media.turtle, content);
	});
};

exports.parse = function(req, resourceURI, callback) {
	var parser = N3.Parser({ documentURI: resourceURI }), triples = [];
	parser.parse(req.rawBody, function(err, triple) {
		if (err) {
			callback(err);
		} else if (triple) {
			triple.subject = normalize(triple.subject);
			if (N3.Util.isUri(triple.object)) {
				triple.object = normalize(triple.object);
			}
			triples.push(triple);
		} else {
			// when last triple is null, we're done parsing
			callback(null, triples);
		}
	});
}
