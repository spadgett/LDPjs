# LDP.js

A simple reference implementation for the [W3C Linked Data
Platform](http://www.w3.org/2012/ldp), leveraging Node.js,
MongoDB, and a few other js libraries.  Catch it running at
[http://ldpjs.mybluemix.net](http://ldpjs.mybluemix.net).

## Capabilities

LDP.js supports LDP basic and direct containers. Indirect
containers and non-RDF source are not implemented.

## Running

First, install [Node.js](http://nodejs.org). Next, install and start
[MongoDB](http://docs.mongodb.org/manual/installation/).

To start the app, run these commands

    $ npm install
    $ node app.js

Finally, point your browser to http://localhost:3000/.

## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
