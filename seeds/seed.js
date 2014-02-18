// Dependencies.

var fs = require( 'fs' );
var path = require( 'path' );

// Actual load.

var files = fs.readdirSync( '.' );

var dependencies = [];
var seeds = [];

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