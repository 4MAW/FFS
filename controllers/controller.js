module.exports = {};

// Dependencies.

var path = require( 'path' );
var fs = require( 'fs' );
var log = require( '../vendor/log.js' );
var controllers_path = path.resolve( __dirname );

// Load files synchronous: this is startup time, so this is fine.

var files = fs.readdirSync( controllers_path );

var dependencies = [];

for ( var _f in files )
	if ( /.*\.js$/.test( files[ _f ] ) && files[ _f ] !== path.basename( __filename ) )
		dependencies.push( path.resolve( controllers_path, files[ _f ] ) );

for ( var _d in dependencies )
{
	var filename = path.basename( dependencies[ _d ], '.js' );
	filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
	module.exports[ filename ] = require( path.resolve( dependencies[ _d ] ) );
	module.exports[ filename ].model = require( '../models/model.js' )[ module.exports[ filename ].model ];

	var crud = require( '../vendor/crud.js' );

	for ( var method in crud )
		module.exports[ filename ][ method ] = crud[ method ];

	log.info( filename + " - Loaded", "CONTROLLER" );
}

log.status( "All controllers loaded", "CONTROLLER" );