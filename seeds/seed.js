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
		var content = fs.readFileSync( dependencies[ _d ] ).toString();
		var filename = path.basename( dependencies[ _d ], '.json' );
		filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
		seeds[ filename ] = JSON.parse( content );
		promises[ filename ] = Q.defer();
	}

	var seed_model = function ( collection )
	{
		return function ( err )
		{

			var requirements_ready = Q.defer();

			if ( model[ collection ].requirements !== undefined )
			{
				var required_promises = [];
				for ( var _r in model[ collection ].requirements )
					required_promises.push( promises[ model[ collection ].requirements[ _r ] ].promise );
				requirements_ready_promise = Q.all( required_promises );
			}
			else
			{
				requirements_ready.resolve();
				requirements_ready_promise = requirements_ready.promise;
			}

			requirements_ready_promise.then( function ()
			{

				var local_promises = [];
				if ( err )
				{
					log.error( err, collection + ' SEEDING' );
				}
				else
				{
					var processed = [];

					for ( var _i in seeds[ collection ] )
					{
						var processed_defer = Q.defer();
						processed.push( processed_defer.promise );
						if ( model[  collection ].process === undefined )
							processed_defer.resolve();
						else
							model[  collection ].process( seeds[ collection ][ _i ] ).then( processed_defer.resolve );
					}

					var insert = function ( item )
					{
						var new_item = new model[ collection ]( item );
						var new_item_promise = Q.npost( new_item, "save" );
						local_promises.push( new_item_promise );
					};

					Q.all( processed ).then( function ()
					{
						for ( var _i in seeds[ collection ] )
							insert( seeds[ collection ][ _i ] );

						Q.all( local_promises ).then( function ()
						{
							log.success( 'Collection seeded to database!', collection );
							promises[ collection ].resolve();
						} ).fail( promises[ collection ].reject );
					} );
				}

			} ); // Requirements.

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