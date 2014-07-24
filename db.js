var db;
var ldp = require('./vocab/ldp.js');			// LDP vocabulary

function graphs() {
	return db.collection('graphs');
}

exports.init = function(callback) {
	var mongoURL;
	if (process.env.VCAP_SERVICES) {
		var env = JSON.parse(process.env.VCAP_SERVICES);
		mongoURL = env['mongodb-2.2'][0].credentials.url;
	} else {
		mongoURL = "mongodb://localhost:27017/ldp";
	}
	require('mongodb').connect(mongoURL, function(err, conn) {
		db = conn;
		callback(err);
    });
}

exports.put = function(uri, containedBy, interactionModel, triples, callback) {
	var doc = {
		name: uri,
		triples: triples
	};

	if (containedBy) {
		doc.containedBy = containedBy;
	}

	if (interactionModel) {
		doc.interactionModel = interactionModel;
	}

	console.log('db.put');
	console.dir(doc);
	graphs().update({ name: uri }, doc, { upsert: true, safe: true }, callback);
};

exports.get = function(uri, callback) {
	console.log('db.get');
	graphs().find({ name: uri }, {}).toArray(function(err, docs) {
		if (docs && docs[0]) {
			console.dir(docs[0]);
			callback(err, docs[0].triples, docs[0].interactionModel);
		} else {
			callback(err);
		}
	});
};

exports.remove = function(uri, callback) {
	graphs().remove({ name: uri }, callback);
};

exports.isContainer = function(uri, callback) {
	graphs().find( { name: uri, interactionModel: ldp.BasicContainer }).count(function(err, count) {
		callback(err, count);
	});
};

exports.getContainment = function(uri, callback) {
	graphs().find( { containedBy: uri }, { name: 1 }).toArray(function(err, docs) {
		var result = [];
		if (docs) {
			docs.forEach(function(doc) {
				result.push(doc.name);
			});
		}

		callback(err, result);
	});
};
