// Dependencies.

if ( typeof process.env.NODE_ENV !== "undefined" && process.env.NODE_ENV === 'production' )
{
	require( 'newrelic' );
	log.status( 'New Relic loaded' );
}

var express = require( 'express' ),
	url = require( 'url' ),
	colors = require( 'colors' ),
	fs = require( 'fs' ),
	Q = require( 'q' ),
	model = require( './models/model.js' ),
	controller = require( './controllers/controller.js' ),
	log = require( './vendor/log.js' ),
	config = require( './config.js' ),
	port = config.port;

// Wait for model initialization before continuing.

model.ready.then( function ()
{

	// App Middlewares.

	var app = express();
	app.use( express.json() );
	app.use( express.urlencoded() );

	// Routes.

	app.get( '/', function ( req, res )
	{
		res.send( 200 );
	} );

	// Server startup and shutdown.

	app.listen( port, function ()
	{
		log.success( 'Listening on port ' + ( '' + port ).underline, 'START' );
	} );

	// This handler is triggered when you use Control-C on the terminal.
	process.on( 'SIGINT', function ()
	{
		console.log(); // Just to break line.
		log.status( 'Shutting down', 'EXIT' );
		process.exit();
	} );

} ).fail( function ( err )
{
	log.error( err, 'INIT' );
	process.exit( -1 );
} );