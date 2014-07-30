module.exports = function(app, db, env) {
	var ldp = require('./vocab/ldp.js');			// LDP vocabulary
	var rdf = require('./vocab/rdf.js');			// RDF vocabulary
	var media = require('./media.js');				// media types
	var turtle = require('./turtle.js');
	var jsonld = require('./jsonld.js');
	var crypto = require('crypto');					// for MD5 (ETags)

	// create root container if it doesn't exist
	db.get(env.ldpBase, function(err, document) {
		if (err) {
			console.log(err.stack);
			return;
		}

		if (!document) {
			createRootContainer();
		}
	});

	// route any requests matching /r/*
	var resource = app.route(env.context + '*');
	resource.all(function(req, res, next) {
		// all responses should have Link: <ldp:Resource> rel=type
		res.links({
			type: ldp.Resource,
			describedby: env.appBase + '/constraints.html'
		});
		next();
	});

	function get(req, res, includeBody) {
		res.set('Vary', 'Accept');
		db.get(req.fullURL, function(err, document) {
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			if (!document) {
				res.send(404);
				return;
			}

			if (document.deleted) {
				res.send(410);
				return;
			}

			var format;
			if (req.accepts(media.turtle)) {
				format = turtle.serialize;
			} else if (req.accepts(media.jsonld) || req.accepts(media.json)) {
				format = jsonld.serialize;
			} else {
				res.send(406);
				return;
			}

			addHeaders(res, document);
			insertCalculatedTriples(document, function(err) {
				if (err) {
					console.log(err.stack);
					res.send(500);
					return;
				}

				format(document.triples, function(err, contentType, content) {
					if (err) {
						res.send(500);
					} else {
						var eTag = getETag(content);
						if (req.get('If-None-Match') === eTag) {
							res.send(304);
							return;
						}

						res.writeHead(200, { 'ETag': eTag, 'Content-Type': contentType });
						if (includeBody) {
							res.end(new Buffer(content), 'utf-8');
						} else {
							res.end();
						}
					}
				});
			});
		});
	}

	resource.get(function(req, res, next) {
		console.log('GET ' + req.path);
		get(req, res, true);
	});

	resource.head(function(req, res, next) {
		console.log('HEAD ' + req.path);
		get(req, res, false);
	});

	resource.put(function(req, res, next) {
		console.log('PUT ' + req.path);
		var parse, format;
		if (req.is(media.turtle)) {
			parse = turtle.parse;
			format = turtle.serialize;
		} else if (req.is(media.jsonld) || req.is(media.json)) {
			parse = jsonld.parse;
			format = jsonld.serialize;
		} else {
			res.send(415);
			return;
		}

		parse(req, req.fullURL, function(err, newTriples) {
			if (err) {
				res.send(400);
				return;
			}

			// get the resource to check if it exists and check its ETag
			db.get(req.fullURL, function(err, document) {
				if (err) {
					console.log(err.stack);
					res.send(500);
				}

				if (document) {
					if (document.deleted) {
						res.send(410);
						return;
					}

					// update
					var ifMatch = req.get('If-Match');
					if (!ifMatch) {
						res.send(428);
						return;
					}

					// add containment triples if necessary to calculate the correct ETag
					// for containers
					insertCalculatedTriples(document, function(err) {
						if (err) {
							console.log(err.stack);
							res.send(500);
							return;
						}

						// calculate the ETag from the matching representation
						format(document.triples, function(err, contentType, content) {
							if (err) {
								console.log(err.stack);
								res.send(500);
								return;
							}

							var eTag = getETag(content);
							if (ifMatch !== eTag) {
								res.send(412);
								return;
							}

							if (modifiesContainment(document, newTriples)) {
								res.send(409);
								return;
							}

							// remove any containment triples from the request body if this is a container
							// then update the document with the new triples
							// we store containment with the resources themselves, not in the container document
							document.triples = newTriples;

							// determine if there are changes to the interaction model
							updateInteractionModel(document);

							// check the membership triple pattern if this is a direct container
							if (!isMembershipPatternValid(document)) {
								res.send(409);
								return;
							}

							// remove any calculated triples from the new content so we don't store them
							removeCalculatedTriples(document, function(err) {
								if (err) {
									console.log(err.stack);
									res.send(500);
									return;
								}

								db.put(document, function(err) {
									if (err) {
										console.log(err.stack);
										res.send(500);
										return;
									}

									res.send(204);
								});
							});
						});
					});
				} else {
					// create
					var document = {
						name: req.fullURL,
						triples: newTriples
					};
					updateInteractionModel(document);

					// check if the client requested a specific interaction model through a Link header
					// if so, override what we found from the RDF content
					if (hasResourceLink(req)) {
						document.interactionModel = ldp.RDFSource;
					}

					// check the membership triple pattern if this is a direct container
					if (!isMembershipPatternValid(document)) {
						res.send(409);
						return;
					}

					db.put(document, function(err) {
						if (err) {
							console.log(err.stack);
							res.send(500);
							return;
						}

						res.send(201);
					});
				}
			});
		});
	});

	resource.post(function(req, res, next) {
		console.log('POST ' + req.path);
		db.isContainer(req.fullURL, function(err, result) {
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			if (!result) {
				res.send(409);
				return;
			}

			var parse;
			if (req.is(media.turtle)) {
				parse = turtle.parse;
			} else if (req.is(media.jsonld) || req.is(media.json)) {
				parse = jsonld.parse;
			} else {
				res.send(415);
				return;
			}

			assignURI(req.fullURL, req.get('Slug'), function(err, loc) {
				if (err) {
					console.log(err.stack);
					res.send(500);
					return;
				}

				parse(req, loc, function(err, triples) {
					if (err) {
						// allow the URI to be used again
						db.releaseURI(loc);
						res.send(400);
						return;
					}

					var document = {
						name: loc,
						containedBy: req.fullURL,
						triples: triples
					};

					updateInteractionModel(document);
					addHeaders(res, document);

					// check if the client requested a specific interaction model through a Link header
					// if so, override what we found from the RDF content
					if (hasResourceLink(req)) {
						document.interactionModel = ldp.RDFSource;
					}

					// check the membership triple pattern if this is a direct container
					if (!isMembershipPatternValid(document)) {
						db.releaseURI(loc);
						res.send(409);
						return;
					}

					// create the resource
					db.put(document, function(err) {
						if (err) {
							console.log(err.stack);
							db.releaseURI(loc);
							res.send(500);
							return;
						}

						res.location(loc).send(201);
					});
				});
			});
		});
	});

	resource.delete(function(req, res, next) {
		console.log('DELETE: ' + req.path);
		db.remove(req.fullURL, function(err, result) {
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			res.send(result ? 204 : 404);
		});
	});

	resource.options(function(req, res, next) {
		db.get(req.fullURL, function(err, document) {
			if (err) {
				console.log(err.stack);
				res.send(500);
				return;
			}

			if (!document) {
				res.send(404);
				return;
			}

			if (document.deleted) {
				res.send(410);
				return;
			}

			addHeaders(res, document);
			res.send(200);
		});
	});

	function createRootContainer() {
		var triples = [{
			subject: env.ldpBase,
			predicate: rdf.type,
			object: ldp.Resource
		}, {
			subject: env.ldpBase,
			predicate: rdf.type,
			object: ldp.RDFSource
		}, {
			subject: env.ldpBase,
			predicate: rdf.type,
			object: ldp.Container
		}, {
			subject: env.ldpBase,
			predicate: rdf.type,
			object: ldp.BasicContainer
		}, {
			subject: env.ldpBase,
			predicate: 'http://purl.org/dc/terms/title',
			object: '"LDP.js root container"'
		}];

		db.put({
			name: env.ldpBase,
			interactionModel: ldp.BasicContainer,
			triples: triples
		}, function(err) {
			if (err) {
				console.log(err.stack);
			}
		});
	}

	function getETag(content) {
		return 'W/"' + crypto.createHash('md5').update(content).digest('hex') + '"';
	}

	function addHeaders(res, document) {
		var allow = 'GET,HEAD,PUT,DELETE,OPTIONS';
		if (isContainer(document)) {
			res.links({ type: document.interactionModel });
			allow += ',POST';
			res.set('Accept-Post', media.turtle + ',' + media.jsonld + ',' + media.json);
		} else {
			res.links({ type: ldp.RDFSource });
		}

		res.set('Allow', allow);
	}

	function isContainer(document) {
		return document.interactionModel === ldp.BasicContainer || document.interactionModel === ldp.DirectContainer;
	}

	// look at the triples to determine the type of container if this is a
	// container and, if a direct container, its membership pattern
	function updateInteractionModel(document) {
		var interactionModel = ldp.RDFSource;
		document.triples.forEach(function(triple) {
			var s = triple.subject, p = triple.predicate, o = triple.object;
			if (s !== document.name) {
				return;
			}

			// determine the interaction model from the RDF type
			// direct takes precedence if the resource has both direct and basic RDF types
			if (p === rdf.type && interactionModel !== ldp.DirectContainer && (o === ldp.BasicContainer || o === ldp.DirectContainer)) {
				interactionModel = o;
				return;
			}

			if (p === ldp.membershipResource) {
				document.membershipResource = o;
				return;
			}

			if (p === ldp.hasMemberRelation) {
				document.hasMemberRelation = o;
			}

			if (p === ldp.isMemberOfRelation) {
				document.isMemberOfRelation = o;
			}
		});

		// don't override an existing interaction model
		if (!document.interactionModel) {
			document.interactionModel = interactionModel;
		}
	}

	// determine if this is a membership resource
	// if it is, insert the membership triples
	function insertMembership(document, callback) {
		db.getContainersUsingMembershipResource(document.name, function(err, containers) {
			if (err) {
				callback(err);
				return;
			}

			if (!containers || !containers.length) {
				callback();
			}

			var inserted = 0;
			for (var i = 0; i < containers.length; i++) {
				(function(container) {
					db.getContainment(container.name, function(err, containment) {
						if (err) {
							callback(err);
							return;
						}

						if (containment) {
							containment.forEach(function(resource) {
								document.triples.push({
									subject: document.name,
									predicate: container.hasMemberRelation,
									object: resource
								});
							});
						}

						if (++inserted === containers.length) {
							callback();
						}
					});
				})(containers[i]);
			}
		});
	}

	// insert any dynamically calculated triples
	function insertCalculatedTriples(document, callback) {
		// insert membership if this is a membership resource
		insertMembership(document, function(err) {
			if (err) {
				callback(err);
				return;
			}

			// next insert any dynamic triples if this is a container
			if (!isContainer(document)) {
				callback();
				return;
			}

			db.getContainment(document.name, function(err, containment) {
				if (err) {
					callback(err);
				}

				if (containment) {
					containment.forEach(function(resource) {
						document.triples.push({
							subject: document.name,
							predicate: ldp.contains,
							object: resource
						});

						if (document.interactionModel === ldp.DirectContainer && document.membershipResource && document.hasMemberRelation) {
							document.triples.push({
								subject: document.membershipResource,
								predicate: document.hasMemberRelation,
								object: resource
							});
						}
					});
				}

				if (document.memberResource) {
					db.get(document.memberResource, function(err, memberResource) {
						if (err) {
							callback(err);
						}

						if (memberResource && memberResource.triples) {
							// add in all member resource triples
							document.triples.push.apply(document.triples, memberResource.triples);
						}

						callback();
					});
				} else {
					callback();
				}
			});
		});	
	}

	function addPath(uri, path) {
		uri = uri.split("?")[0].split("#")[0];
		if (uri.substr(-1) !== '/') {
			uri += '/';
		}

		// remove special characters from the string (e.g., '/', '..', '?')
		var lastSegment = path.replace(/[^\w\s\-_]/gi, '');
		return uri + encodeURIComponent(lastSegment);
	}

	function uniqueURI(container, callback) {
		var candidate = addPath(container, 'res' + Date.now());
		db.reserveURI(candidate, function(err) {
			callback(err, candidate);
		});
	}

	function assignURI(container, slug, callback) {
		if (slug) {
			var candidate = addPath(container, slug);
			db.reserveURI(candidate, function(err) {
				if (err) {
					uniqueURI(container, callback);
				} else {
					callback(null, candidate);
				}
			});
		} else {
			uniqueURI(container, callback);
		}
	}

	function modifiesContainment(originalDocument, newTriples) {
		if (!isContainer(originalDocument)) {
			return false;
		}

		var originalTotal = 0, newTotal = 0, originalContainment = {};
		originalDocument.triples.forEach(function(triple) {
			if (triple.subject === originalDocument.name && triple.predicate === ldp.contains) {
				originalContainment[triple.object] = 1;
				originalTotal++;
			}
		});

		for (var i = 0; i < newTriples.length; i++) {
			var triple = newTriples[i];
			if (triple.subject === originalDocument.name && triple.predicate === ldp.contains) {
				if (!originalContainment[triple.object]) {
					return true;
				}
				newTotal++;
			}
		}

		return originalTotal !== newTotal;
	}

	function removeCalculatedTriples(document, callback) {
		// remove any membership triples if this is a member resource
		db.getContainersUsingMembershipResource(document.name, function(err, containers) {
			if (err) {
				callback(err);
			}

			if (containers) {
				containers.forEach(function(container) {
					document.triples = document.triples.filter(function(triple) {
						return triple.subject !== document.name || 
							triple.predicate !== container.hasMemberRelation;
					});
				});
			}

			// next remove any containment triples if this is a container
			if (isContainer(document)) {
				document.triples = document.triples.filter(function(triple) {
					var s = triple.subject, p = triple.predicate;
					if (s === document.name && p === ldp.contains) {
						return false;
					}

					if (document.interactionModel === ldp.DirectContainer && s === document.membershipResource) {
						if (document.membershipResource !== document.name) {
							return false;
						} else if (p === document.hasMemberRelation) {
							return false;
						}
					}

					return true;
				});
			}

			callback();
		});
	}

	function hasResourceLink(req) {
		var link = req.get('Link');
		// look for links like
		//   <http://www.w3.org/ns/ldp#Resource>; rel="type"
		// these are also valid
		//   <http://www.w3.org/ns/ldp#Resource>;rel=type
		//   <http://www.w3.org/ns/ldp#Resource>; rel="type http://example.net/relation/other"
		return link &&
			/<\s*http:\/\/www\.w3\.org\/ns\/ldp#Resource\s*\>\s*;\s*rel\s*=\s*(("\s*([^"]+\s+)*type(\s+[^"]+)*\s*")|\s*type\s*)/
				.test(link);
	}

	// check the consistency of the membership triple pattern if this is a direct container
	function isMembershipPatternValid(document) {
		if (document.interactionModel !== ldp.DirectContainer) {
			// not a direct container, nothing to do
			return true;
		}

		// must have a membership resouce
		if (!document.membershipResource) {
			return false;
		}

		// must have hasMemberRelation or isMemberOfRelation, but can't have both
		if (document.hasMemberRelation) {
			return !document.isMemberOfRelation;
		}
		if (document.isMemberOfRelation) {
			return !document.hasMemberRelation;
		}

		// no membership triple pattern
		return false;
	}
};
