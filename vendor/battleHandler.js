var Constants = require( './constants.js' );

module.exports = function ( socket )
{

	// Add hooks to socket.

	socket.on( 'connection', function ( client )
	{
		client.emit( 'messages', Constants.WELCOME_TO_SOCKET_MSG );
	} );

};