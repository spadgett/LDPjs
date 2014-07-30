var N3 = require('n3');
var jsonld = require('jsonld');
var media = require('./media.js');				// media types
var ldp = require('./vocab/ldp.js');			// LDP vocabulary
var rdf = require('./vocab/rdf.js');			// RDF vocabulary
var context = require('./context.json');		// our JSON-LD context

exports.parse = function (req, resourceURI, callback) {
	var json = JSON.parse(req.rawBody);
	jsonld.toRDF(json, { base: resourceURI }, function(err, dataset) {
		if (err) {
			callback(err);
			return;
		}

		// transform the dataset to the N3.js triples format we use in our database
		// both libraries use a different internal format unfortunately
		var result = [];
		for(var graphName in dataset) {
			var triples = dataset[graphName];
			// FIXME: what about graph names?
			triples.forEach(function (triple) {
				var next = {};
				next.subject = triple.subject.value;
				next.predicate = triple.predicate.value;
				if (triple.object.type === 'IRI' || triple.object.type === 'blank node') {
					next.object = triple.object.value;
				} else {
					var literal = '"' + triple.object.value + '"';
					if (triple.object.language) {
						literal += '@' + triple.object.language;
					} else if (triple.object.datatype && triple.object.datatype !== 'http://www.w3.org/2001/XMLSchema#string') {
						literal += '^^<' + triple.object.datatype + '>';
					}
					next.object = literal;
				}

				result.push(next);
			});
		}

		callback(null, result);
	});
};

function jsonldResource(subject) {
	return { '@id': subject };
}

function jsonldObject(object) {
	if (N3.Util.isUri(object) || N3.Util.isBlank(object)) {
		return jsonldResource(object);
	}

	var result = {};
	var value = N3.Util.getLiteralValue(object);
	result['@value'] = value;
	var type = N3.Util.getLiteralType(object);
	if (type && type !== 'http://www.w3.org/2001/XMLSchema#string') {
		result['@type'] = type;
	}
	var language = N3.Util.getLiteralLanguage(object);
	if (language) {
		result['@language'] = language;
	}

	return result;
}

exports.serialize = function(triples, callback) {
	var resources = [];
	var map = {};

	triples.forEach(function(triple) {
		var sub = map[triple.subject];
		if (!sub) {
			sub = jsonldResource(triple.subject);
			map[triple.subject] = sub;
			resources.push(sub);
		}

		var object;
		if ((N3.Util.isUri(triple.object) || N3.Util.isBlank(triple.object)) && !map[triple.object]) {
			object = jsonldResource(triple.object);
		}

		if (triple.predicate === rdf.type) {
			jsonld.addValue(sub, '@type', triple.object, { propertyIsArray: true });
			return;
		}

		object = jsonldObject(triple.object);
		jsonld.addValue(sub, triple.predicate, object, { propertyIsArray: true });
	});

	jsonld.compact(resources, context, function(err, json) {
		if (err) {
			callback(err);
		}

		var content = JSON.stringify(json, undefined, 4);
		callback(null, media.jsonld, content);
	});
};
