var url = require("url");
var config = require('./config.json');

// the IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
exports.listenHost = (process.env.VCAP_APP_HOST || config.host);

// the port on the DEA for communication with the application:
exports.listenPort = (process.env.VCAP_APP_PORT || config.port);

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
	exports.mongoURL = env['mongodb-2.2'][0].credentials.url;
} else {
	exports.mongoURL = process.env.MONGO_URL || config.mongoURL;
}
