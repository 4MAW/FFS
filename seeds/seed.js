// Dependencies.

var fs = require( 'fs' );
var path = require( 'path' );
var Q = require( 'q' );
var model = require( '../models/model.js' );
var log = require( '../vendor/log.js' );

// Actual load.

model.ready.then( function ()
{
	var files = fs.readdirSync( '.' );

	var dependencies = [];
	var seeds = [];
	var promises = [];

	for ( var _f in files )
		if ( /.*\.json$/.test( files[ _f ] ) )
			dependencies.push( path.resolve( path.dirname( __filename ), files[ _f ] ) );

	for ( var _d in dependencies )
	{
		var content = require( dependencies[ _d ] );
		var filename = path.basename( dependencies[ _d ], '.json' );
		filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
		seeds[ filename ] = content;
		promises[ filename ] = Q.defer();
	}

	var seed_model = function ( collection )
	{
		return function ( err )
		{
			var local_promises = [];
			if ( err )
			{
				log.error( err, collection + ' SEEDING' );
			}
			else
			{
				for ( var _i in seeds[ collection ] )
				{
					var new_item = new model[ collection ]( seeds[ collection ][ _i ] );
					var new_item_promise = Q.npost( new_item, "save" );
					local_promises.push( new_item_promise );
				}
			}
			Q.all( local_promises ).then( promises[ collection ].resolve ).fail( promises[ collection ].reject );
		};
	};

	for ( var collection in seeds )
		model[ collection ].remove(
		{}, seed_model( collection ) );

	var plain_promises = [];
	for ( var p in promises )
		plain_promises.push( promises[ p ].promise );

	Q.all( plain_promises ).then( function ()
	{
		log.success( 'Database seeded successfully', 'SEED' );
		process.exit( 0 );
	} ).fail( function ( err )
	{
		log.error( err, 'SEED' );
		process.exit( -1 );
	} );

} );