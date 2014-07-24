module.exports = function(app, db) {
	var resource = app.route('/v');

	resource.get(function(req, res, next) {
		console.log('GET ' + req.path);		
		res.json(stubData);
	});
	
	var stubData = { 
		  "links" : [ 
		      { 
		        "source" : 2 ,
		        "target" : 18 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 8 ,
		        "target" : 30 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 24 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 9 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 21 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 17 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 23 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 3 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 5 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 7 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 0 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 27 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 15 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 4 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 6 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 1 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 19 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 26 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 10 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 24 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 9 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 21 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 17 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 23 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 3 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 5 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 7 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 0 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 27 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 15 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 4 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 6 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 1 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 19 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 26 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 14 ,
		        "target" : 10 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 16 ,
		        "target" : 11 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 20 ,
		        "target" : 13 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 22 ,
		        "target" : 16 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 22 ,
		        "target" : 11 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 25 ,
		        "target" : 18 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 25 ,
		        "target" : 32 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 25 ,
		        "target" : 2 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 28 ,
		        "target" : 28 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 28 ,
		        "target" : 12 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 28 ,
		        "target" : 12 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 30 ,
		        "target" : 30 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 30 ,
		        "target" : 8 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 31 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 16 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 18 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 14 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 28 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 30 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 22 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 25 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 29 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 16 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 18 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 14 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 28 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 30 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 22 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 25 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 31 ,
		        "target" : 29 ,
		        "value" : 1
		      } ,
		      { 
		        "source" : 32 ,
		        "target" : 18 ,
		        "value" : 1
		      }
		    ] ,
		  "nodes" : [ 
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res180"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res295"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/dc-invmbr-diffmr/res31"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res113"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res251"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res136"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res274"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res159"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/dc-invmbr/res5"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res27"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res383"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/dc-diffmr/res5"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/dc-simple/res5"
		      } ,
		      { 
		        "group" : 1 ,
		        "name" : "-464989d:1475580ced9:-7fec"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res226"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/diffmr1"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res67"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/diffmr2"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res310"
		      } ,
		      { 
		        "group" : 2 ,
		        "name" : "/MOCKUP/bc/res45?_rdf"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res52"
		      } ,
		      { 
		        "group" : 3 ,
		        "name" : "/MOCKUP/dc-diffmr/"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res90"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res5"
		      } ,
		      { 
		        "group" : 3 ,
		        "name" : "/MOCKUP/dc-invmbr-diffmr/"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res367"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc/res205"
		      } ,
		      { 
		        "group" : 3 ,
		        "name" : "/MOCKUP/dc-simple/"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/bc-asres/"
		      } ,
		      { 
		        "group" : 3 ,
		        "name" : "/MOCKUP/dc-invmbr/"
		      } ,
		      { 
		        "group" : 3 ,
		        "name" : "/MOCKUP/"
		      } ,
		      { 
		        "group" : 0 ,
		        "name" : "/MOCKUP/dc-invmbr-diffmr/res5"
		      }
		    ]
		};
};