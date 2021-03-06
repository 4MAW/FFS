// Dependencies.

var fs = require( 'fs' );
var path = require( 'path' );
var Q = require( 'q' );
var model = require( '../models/model.js' );
var log = require( '../vendor/log.js' );

// Actual load.

model.ready.then( function ()
{
	var files = fs.readdirSync( path.dirname( __filename ) );

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
		try
		{
			promises[ filename ] = Q.defer();
			seeds[ filename ] = JSON.parse( content );
		}
		catch ( e )
		{
			promises[ filename ].reject( e );
			log.error( e, 'PARSING ' + filename );
		}
		for ( var _p in model[ filename ].phases )
			promises[ filename + '.' + model[ filename ].phases[ _p ].name ] = Q.defer();
	}

	var seed_model = function ( collection )
	{
		return function ( err )
		{
			// First we must perform each initialization phase.
			var phases_ready = []; // This will store the array of promises about finishing each phase.
			if ( model[ collection ].phases )
			{

				var callbacks_in_this_phase_run = [];

				var log_phase_success = function ( phase )
				{
					return function ()
					{
						log.success( '«' + phase + '» phase succeed', collection );
					};
				};

				var log_phase_error = function ( phase )
				{
					return function ()
					{
						log.error( '«' + phase + '» phase failed!', collection );
					};
				};

				var perform_phase = function ( phase, phase_ready_defer )
				{
					return function ()
					{
						for ( var _i in seeds[ collection ] )
							callbacks_in_this_phase_run.push( phase.callback( seeds[ collection ][ _i ] ) ); //Run the callback for this phase.
						Q.all( callbacks_in_this_phase_run ).then( phase_ready_defer.resolve ).fail( phase_ready_defer.reject );
					};
				};

				for ( var _phase in model[ collection ].phases )
				{
					var phase = model[ collection ].phases[ _phase ]; // Just a nice alias.
					var phase_ready_defer = promises[ collection + '.' + phase.name ]; // A promise about one phase.

					phases_ready.push( phase_ready_defer.promise );

					var required_promises = []; // To wait for dependencies before initializing this phase.
					for ( var _r in phase.requirements )
					{
						log.info( '«' + phase.requirements[ _r ] + '» phase required to initialize collection ', collection + ':' + phase.name );
						required_promises.push( promises[ phase.requirements[ _r ] ].promise ); // Query and add any promise required to the list.
					}

					// When all dependencies are met just resolve the promise about this phase.
					Q.all( required_promises ).then( perform_phase( phase, phase_ready_defer ) ).fail( phase_ready_defer.reject );

					phase_ready_defer.promise.then( log_phase_success( phase.name ) ).fail( log_phase_error( phase.name ) );
				}
			}

			// The requirements array is just a promise about running all phases.
			var requirements_ready = Q.all( phases_ready );

			var local_promises = [];
			if ( err )
			{
				log.error( err, collection + ' SEEDING' );
			}
			else
			{
				var processed = [];

				var insert = function ( item )
				{
					var new_item = new model[ collection ]( item );
					var new_item_promise = Q.npost( new_item, "save" );
					local_promises.push( new_item_promise );
				};

				requirements_ready.then( function ()
				{
					if ( model[ collection ].manualSeeding !== true )
						for ( var _i in seeds[ collection ] )
							insert( seeds[ collection ][ _i ] );

					Q.all( local_promises ).then( function ()
					{
						log.success( 'Collection seeded to database!', collection );
						promises[ collection ].resolve();
					} ).fail( promises[ collection ].reject );
				} ).fail( promises[ collection ].reject );
			}

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