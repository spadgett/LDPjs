var ldp = require('./vocab/ldp.js'); // LDP vocabulary

var db;

function graphs() {
	return db.collection('graphs');
}

exports.init = function(env, callback) {
	require('mongodb').connect(env.mongoURL, function(err, conn) {
		db = conn;
		exports.graphs = graphs();
		console.log("Connected to MongoDB at: "+env.mongoURL);
		// index the graph name for fast lookups
		exports.graphs.ensureIndex({
			name: 1
		}, {
			unique: true
		}, function(err) {
			if (err) {
				// not fatal, but log the error
				console.log(err.stack);
			}
		});
		callback(err);
	});
};

exports.reserveURI = function(uri, callback) {
	// simply create a document with only a URI. we will just update it later on put
	// if it fails, we reject the uri
	graphs().insert({
		name: uri
	}, function(err, result) {
		callback(err);
	});
};

exports.releaseURI = function(uri) {
	graphs().remove({
		name: uri
	}, function(err) {
		if (err) {
			console.log(err.stack);
		}
	});
};

exports.put = function(doc, callback) {
	console.log('db.put');
	console.dir(doc);
	graphs().update({
		name: doc.name
	}, doc, {
		upsert: true,
		safe: true
	}, callback);
};

exports.get = function(uri, callback) {
	console.log('db.get');
	graphs().find({
		name: uri
	}, {
		limit: 1
	}).toArray(function(err, docs) {
		if (docs && docs[0]) {
			console.dir(docs[0]);
			callback(err, docs[0]);
		} else {
			callback(err);
		}
	});
};

exports.remove = function(uri, callback) {
	graphs().update({
		name: uri,
	}, {
		$set: {
			deleted: true,
			containedBy: null,
			triples: []
		}
	}, {
		safe: true
	}, callback);
};

exports.findContainer = function(uri, callback) {
	graphs().find({
		name: uri,
		$or: [{
			interactionModel: ldp.BasicContainer
		}, {
			interactionModel: ldp.DirectContainer
		}],
		deleted: {
			$ne: true
		}
	}, {
		name: 1,
		interactionModel: 1,
		membershipResource: 1,
		hasMemberRelation: 1,
		isMemberOfRelation: 1	
	}, {
		limit: 1
	}).toArray(function(err, docs) {
		callback(err, (docs && docs.length) ? docs[0] : null);
	});
};

exports.getContainment = function(uri, callback) {
	graphs().find({
		containedBy: uri,
		deleted: {
			$ne: true
		}
	}, {
		name: 1
	}).toArray(function(err, docs) {
		var result = [];
		if (docs) {
			docs.forEach(function(doc) {
				result.push(doc.name);
			});
		}

		callback(err, result);
	});
};

exports.createMembershipResource = function(document, callback) {
	graphs().update({
		name: document.membershipResource
	}, {
		$push: {
			membershipResourceFor: {
				container: document.name,
				hasMemberRelation: document.hasMemberRelation
			}
		}
	}, {
		upsert: true,
		safe: true
	}, callback);
};
