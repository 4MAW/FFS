// Dependencies.

if ( typeof process.env.NODE_ENV !== "undefined" && process.env.NODE_ENV === 'production' )
{
	require( 'newrelic' );
	log.status( 'New Relic loaded' );
}

var socket = require( 'socket.io' ),
	express = require( 'express' ),
	http = require( 'http' ),
	url = require( 'url' ),
	colors = require( 'colors' ),
	fs = require( 'fs' ),
	Q = require( 'q' ),
	model = require( './models/model.js' ),
	controller = require( './controllers/controller.js' ),
	log = require( './vendor/log.js' ),
	Constants = require( './vendor/constants.js' ),
	config = require( './config.js' ),
	port = config.port,
	app = express(),
	server = http.createServer( app ),
	io = socket.listen( server,
	{
		'sync disconnect on unload': true
	} ),
	battleHandler = new require( './vendor/battleHandler.js' )( io.sockets );

io.set( 'log level', 1 ); // Reduce log level.

// Wait for model initialization before continuing.

model.ready.then( function ()
{
	// App Middlewares.

	app.use( express.json() );
	app.use( express.urlencoded() );

	// Routes.

	// Skills.
	app.get( '/skill', controller.Skill.get() );
	app.get( '/skill/:id', controller.Skill.getBy( 'id', 'id' ) );

	// Weapons.
	app.get( '/weapon', controller.Weapon.get() );
	app.get( '/weapon/:id', controller.Weapon.getBy( 'id', 'id' ) );

	// ArmorPiece.
	app.get( '/armor/piece', controller.ArmorPiece.get() );
	app.get( '/armor/piece/:id', controller.ArmorPiece.getBy( 'id', 'id' ) );

	// ArmorSet.
	app.get( '/armor', controller.ArmorSet.get() );
	app.get( '/armor/:id', controller.ArmorSet.getBy( 'id', 'id' ) );

	// Accessories.
	app.get( '/accessory', controller.Accessory.get() );
	app.get( '/accessory/:id', controller.Accessory.getBy( 'id', 'id' ) );

	// Classes.
	app.get( '/class', controller.Class.get() );
	app.get( '/class/:id', controller.Class.getBy( 'id', 'id' ) );

	// Characters.
	app.get( '/character/:id', controller.Character.getBy( 'id', 'id' ) );

	// Teams.
	app.get( '/team', controller.Team.get() );
	app.get( '/team/:id', controller.Team.getBy( 'id', 'id' ) );
	// @TODO Add a way to query the teams by user.

	app.get( '/', function ( req, res )
	{
		res.send( 200 );
	} );

	// Server startup and shutdown.

	server.listen( port, function ()
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