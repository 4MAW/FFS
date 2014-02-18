module.exports = {};

// Dependencies.

var Q = require( 'q' );

var main_defer = Q.defer();
module.exports.ready = main_defer.promise;

var config = require( '../config.js' );
module.exports.pagesize = config.pagesize; // To make pagesize constant available without requiring config.

var mongoose = require( 'mongoose' );
mongoose.connect( config.databaseURL );
//mongoose.set( 'debug', true );
var Schema = mongoose.Schema;

var path = require( 'path' );
var fs = require( 'fs' );
var log = require( '../vendor/log.js' );
var models_path = path.resolve( __dirname );

// Load files synchronous: this is startup time, so this is fine.

var files = fs.readdirSync( models_path );

var dependencies = [];
var defers = [];
var promises = [];

for ( var _f in files )
	if ( /.*\.js$/.test( files[ _f ] ) && files[ _f ] !== path.basename( __filename ) )
	{
		dependencies.push( path.resolve( models_path, files[ _f ] ) );
		defers.push( Q.defer() );
		promises.push( defers[ defers.length - 1 ].promise );
	}

for ( var _d in dependencies )
{
	var filename = path.basename( dependencies[ _d ], '.js' );
	filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
	var model_content = require( path.resolve( dependencies[ _d ] ) );

	var sch = new Schema( model_content.schema );
	sch.statics = model_content.statics;

	for ( var _j in model_content.set )
		sch.set( _j, model_content.set[  _j ] );

	if ( typeof model_content.indexes === typeof[] )
		sch.index.apply( sch, model_content.indexes );

	module.exports[ filename ] = mongoose.model( filename, sch );

	module.exports[ filename ].join = model_content.join;
	module.exports[ filename ].pagesize = module.exports.pagesize;

	if ( typeof model_content.initialization === 'function' )
		model_content.initialization( filename + " - Loaded", "MODEL" ).then( defers[ _d ].resolve ).fail( defers[ _d ].reject );
	else
		defers[ _d ].resolve( filename + " - Loaded", "MODEL" );

	promises[ _d ].then( log.info ).fail( log.error );
}

Q.all( promises ).then( function ()
{
	log.status( "All models loaded", "MODEL" );
	main_defer.resolve();
} ).fail( function ( err )
{
	log.error( err, 'MODEL' );
	main_defer.reject( err );
} );