// Dependencies.

var fs = require( 'fs' );
var path = require( 'path' );

// Constants.

var NON_EXISTING_ID = 'lolThisIDDoesNotExist';
var seeds_path = path.resolve( path.dirname( __filename ), '../../seeds' );

// Load seed files.

var files = fs.readdirSync( seeds_path );

var dependencies = [];
var seeds = [];
var promises = [];

for ( var _f in files )
	if ( /.*\.json$/.test( files[ _f ] ) )
		dependencies.push( path.resolve( seeds_path, files[ _f ] ) );

for ( var _d in dependencies )
{
	var content = fs.readFileSync( dependencies[ _d ] ).toString();
	var filename = path.basename( dependencies[ _d ], '.json' );
	filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
	seeds[ filename ] = JSON.parse( content );
}

module.exports = {
	NON_EXISTING_ID: NON_EXISTING_ID,
	skills: seeds[ 'Skill' ]
};