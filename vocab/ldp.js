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
define('Container', ns + 'Container');
define('BasicContainer', ns + 'BasicContainer');
define('DirectContainer', ns + 'DirectContainer');

// Properties
define('contains', ns + 'contains');
define('membershipResource', ns + 'membershipResource');
define('hasMemberRelation', ns + 'hasMemberRelation');
define('isMemberOfRelation', ns + 'isMemberOfRelation');

// Preferences
define('PreferContainment', ns + 'PreferContainment');
define('PreferMembership', ns + 'PreferMembership');
define('PreferMinimalContainer', ns + 'PreferMinimalContainer');
define('PreferEmptyContainer', ns + 'PreferEmptyContainer');
