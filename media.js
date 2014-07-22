function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define('turtle', 'text/turtle');
define('text', 'text/plain');
define('n3', 'text/n3');
define('jsonld', 'application/ld+json');
define('json', 'application/json');
