var db;

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
		containedBy: containedBy,
		interactionModel: interactionModel,
		triples: triples
	};

	console.log('db.put');
	console.dir(doc);
	var collection = db.collection('graphs');
	collection.update({ name: uri }, doc, { upsert: true, safe: true }, callback);
};

exports.get = function(uri, callback) {
	console.log('db.get');
	var collection = db.collection('graphs');
	collection.find({ name: uri }, { limit: 1 }).toArray(function(err, docs) {
		if (docs && docs[0]) {
			console.dir(docs[0]);
			callback(err, docs[0].triples);
		} else {
			callback(err);
		}
	});
};
