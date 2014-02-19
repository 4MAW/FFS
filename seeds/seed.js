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
	}

	promises[ 'Skill' ] = Q.defer();
	// Load skills.
	model.Skill.remove(
	{}, function ( err )
	{
		var local_promises = [];
		if ( err )
		{
			log.error( err, 'SKILL SEEDING' );
		}
		else
		{
			for ( var _i in seeds[ 'Skill' ] )
			{
				var new_skill = new model.Skill( seeds[ 'Skill' ][ _i ] );
				var new_skill_promise = Q.npost( new_skill, "save" );
				local_promises.push( new_skill_promise );
			}
		}
		Q.all( local_promises ).then( promises[ 'Skill' ].resolve ).fail( promises[ 'Skill' ].reject );
	} );

	Q.all( [ promises[ 'Skill' ].promise ] ).then( function ()
	{
		log.success( 'Database seeded successfully', 'SEED' );
		process.exit( 0 );
	} ).fail( function ( err )
	{
		log.error( err, 'SEED' );
		process.exit( -1 );
	} );

} );