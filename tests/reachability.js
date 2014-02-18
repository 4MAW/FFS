// Dependencies.

var request = require( 'request' ),
	assert = require( 'assert' ),
	config = require( '../config.js' ),
	Constants = require( '../vendor/constants.js' ),
	Q = require( 'q' ),
	log = require( '../vendor/log.js' ),
	io = require( 'socket.io-client' );

// Settings.

var baseURL = config.baseURL + ':' + config.port;

describe( 'Reachability', function ()
{

	it( "API should respond with status 200 to GET request on base URL", function ( done )
	{
		request( baseURL, function ( err, resp )
		{
			assert.equal( resp.statusCode, 200 );
			done();
		} );
	} );

	it( "Socket must send a greeting message when we connect to it", function ( done )
	{
		var defer = Q.defer();

		var socket = io.connect( baseURL );

		socket.on( 'messages', function ( data )
		{
			socket.disconnect();
			assert.strictEqual( data, Constants.WELCOME_TO_SOCKET_MSG );
			defer.resolve();
		} );

		defer.promise.then( function ()
		{
			done();
		} );
	} );

} );