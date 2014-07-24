function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

var ns = 'http://www.w3.org/ns/ldp#';
define('ns', ns);
define('prefix', 'ldp');

// Resources
define('Resource', ns + 'Resource');
define('RDFSource', ns + 'RDFSource');
define('BasicContainer', ns + 'BasicContainer');
define('DirectContainer', ns + 'DirectContainer');

// Properties
define('contains', ns + 'contains');
