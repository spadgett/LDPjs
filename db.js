var rdfstore = require('rdfstore');

exports.init = function(callback) {
	// setup rdfstore/mongo
	var storage='mongodb';

	function registerNamespaces(store) {
		store.registerDefaultProfileNamespaces();
		store.registerDefaultNamespace('http://www.w3.org/ns/ldp#', 'ldp');
	}

	if (process.env.VCAP_SERVICES) {
		var env = JSON.parse(process.env.VCAP_SERVICES);
		var mongo = env['mongodb-2.2'][0].credentials;
	} else {
		var mongo = {
			  "hostname" : "localhost",
			  "host" : "127.0.0.1",
			  "port" : 27017
		};
	}

	if (storage === 'mongodb') {
		new rdfstore.Store({
			persistent: true,
			engine: 'mongodb',
			name: mongo.db || 'ldpjs',
			overwrite: false,
			mongoDomain:
				(mongo.username && mongo.password)
					? mongo.username + ":" + mongo.password + "@" + mongo.hostname
					: mongo.hostname,
			mongoPort: mongo.port
	   }, function(store){
		   registerNamespaces(store);
		   callback(store);
	   });
	} else {
	   var store = rdfstore.create();
	   registerNamespaces(store);
	   callback(store);
	}
};
