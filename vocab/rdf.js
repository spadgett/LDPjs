function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

var ns = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
define('ns', ns);
define('prefix', 'rdf');

// Resources

// Properties
define('type', ns + 'type');
