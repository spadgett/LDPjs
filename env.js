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
 * Looks at environment variables for app configuration (base URI, port, LDP
 * context, etc.), falling back to what's in confg.json.
 */

var url = require("url");
var config = require('./config.json');

// the IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
exports.listenHost = (process.env.VCAP_APP_HOST || process.env.OPENSHIFT_NODEJS_IP || config.host);

// the port on the DEA for communication with the application:
exports.listenPort = (process.env.VCAP_APP_PORT || process.env.OPENSHIFT_NODEJS_PORT || config.port);

function addSlash(url) {
	if (url.substr(-1) == '/') {
		return url;
	} else {
		return url + '/';
	}
}

function toURL(urlObj) {
	if ((urlObj.scheme === 'http' && urlObj.port === 80) ||
			(urlObj.scheme === 'https' && urlObj.port === 443)) {
		delete urlObj.port;
	}

	return url.format(urlObj);
}

// scheme, host, port, and base URI
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
if (process.env.LDP_BASE) {
	// LDP_BASE env var set
	exports.ldpBase = addSlash(process.env.LDP_BASE);
	var url = url.parse(exports.ldpBase);
	exports.scheme = url.scheme;
	exports.host = url.host;
	exports.port = url.port;
	exports.context = url.pathname;
	exports.appBase = toURL({
		protocol: exports.scheme,
		host: exports.host,
		port: exports.port
	});
} else {
	// no LDP_BASE set
	exports.scheme = (process.env.VCAP_APP_PORT) ? 'http' :config.scheme;
	if (appInfo.application_uris) {
		exports.host = appInfo.application_uris[0];
	} else {
		exports.host = process.env.HOSTNAME || config.host;
	}

	// public port is the default in a Bluemix environment
	if (!process.env.VCAP_APP_PORT) {
		exports.port = config.port;
	}
	exports.context = addSlash(config.context);

	exports.appBase = toURL({
		protocol: exports.scheme,
		hostname: exports.host,
		port: exports.port
	});

	exports.ldpBase = toURL({
		protocol: exports.scheme,
		hostname: exports.host,
		port: exports.port,
		pathname: exports.context
	});
}

// MongoDB
if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	exports.mongoURL = env.mongolab[0].credentials.uri;
} else {
	if (process.env.OPENSHIFT_MONGODB_DB_URL) {
		exports.mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL;
	} else {
		exports.mongoURL = process.env.MONGO_URL || config.mongoURL;
	}
}
