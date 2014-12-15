/*
 * Copyright 2014 IBM Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/*
 * db.js stores RDF graphs in MongoDB. Each document representations
 * an RDF graph. Documents have the properties below. The 'triples'
 * property is the RDF. Other properties are metadata.
 *
 * All documents:
 *
 *   name - the URI of the graph
 *   interactionModel - the URI indicating the LDP interaction model of the resource
 *   container - the container for this resource
 *   deleted - boolean indicating if the resource has been deleted (to avoid reusing URIs)
 *   triples - an array of RDF triples in N3.js format
 *
 * Direct containers:
 *
 *   membershipResource - the ldp:membershipResource property
 *   hasMemberRelation - the ldp:hasMemberRelation property
 *   isMemberOfRelation - the ldp:isMemberOfRelation property
 *
 * Membership resources:
 *
 *   membershipResourceFor - the associated direct container (always 1:1)
 *
 * Rather than storing a link to all of its members in the container,
 * we have a property in each resource that points back to its
 * container. On a container GET, we query for a container's resources
 * and mix in containment triples.
 */

var ldp = require('./vocab/ldp.js'); // LDP vocabulary

var db;

function graphs() {
	return db.collection('graphs');
}

// index the graph name for fast lookups and uniqueness
function ensureIndex() {
	graphs().ensureIndex({
		name: 1
	}, {
		unique: true
	}, function(err) {
		if (err) {
			// not fatal, but log the error
			console.log(err.stack);
		}
	});
}

exports.init = function(env, callback) {
	require('mongodb').connect(env.mongoURL, function(err, conn) {
		if (err) {
			callback(err);
			return;
		}

		db = conn;
		exports.graphs = graphs();
		console.log("Connected to MongoDB at: "+env.mongoURL);
		ensureIndex();
		callback();
	});
};

exports.drop = function(callback) {
	graphs().drop(callback);
	ensureIndex();
	exports.graphs = graphs();
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
