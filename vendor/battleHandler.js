var Constants = require( './constants.js' );
var Q = require( 'q' );

module.exports = function ( socket )
{

	var connectedPlayers = [];
	var readyPlayers = 0;
	var whatToDo = [];
	var whatToDoCount = 0;
	var bothPlayersReadyToMatch = Q.defer();

	var reset = function ()
	{
		connectedPlayers = [];
		readyPlayers = 0;
		whatToDo = [];
		whatToDoCount = 0;
		bothPlayersReadyToMatch = Q.defer();
		bothPlayersReadyToMatch.promise.then( both_players_ready_to_match_handler );
	}

	// Add hooks to socket.

	socket.on( 'connection', function ( client )
	{

		// If there is space for this player in the battle...
		if ( connectedPlayers.length < 2 )
		{
			// Add player to list of players in the battle and greet and send him his ID.
			connectedPlayers.push( client );

			var index = connectedPlayers.length - 1;

			client.emit( 'messages', Constants.WELCOME_TO_SOCKET_MSG );
			client.emit( 'your_id', index );

			// If the player is disconnected, broadcast the end of the battle.
			client.on( 'disconnect', function ()
			{
				client.broadcast.emit( 'disconnect', Constants.PLAYER_LEFT_GAME );
				reset(); // Reset
			} );

			// If the player chooses a name, store it.
			client.on( 'choose_name', function ( name )
			{
				client.set( 'name', name, function ()
				{
					client.emit( 'chosen_name_saved' );
				} );
			} );

			// If the player chooses a team, store it.
			client.on( 'choose_team', function ( team_id )
			{
				client.set( 'team_id', team_id, function ()
				{
					client.emit( 'chosen_team_saved' );
					client.broadcast.emit( 'other_player_has_chosen_team' );
					readyPlayers++;
					if ( readyPlayers === 2 )
					{
						bothPlayersReadyToMatch.resolve();
					}
				} );
			} );

			// If the player decides what to do, store it.
			client.on( 'decisions', function ( decisions )
			{
				whatToDo[ index ] = decisions;

				whatToDoCount++;
				if ( whatToDoCount === 2 )
				{
					client.emit( 'decisions', whatToDo[ ( index === 0 ) ? 1 : 0 ] );
					client.broadcast.emit( 'decisions', whatToDo[ index ] );
				}
			} );

		}
		else
		{
			client.emit( 'error', Constants.SERVER_FULL );
		}
	} );

	// Function to be called when both players are ready to match.
	var both_players_ready_to_match_handler = function ()
	{
		connectedPlayers[ 0 ].get( 'team_id', function ( err, team_0 )
		{
			connectedPlayers[ 0 ].get( 'name', function ( err, name_0 )
			{
				connectedPlayers[ 1 ].get( 'team_id', function ( err, team_1 )
				{
					connectedPlayers[ 1 ].get( 'name', function ( err, name_1 )
					{
						connectedPlayers[ 0 ].broadcast.emit( 'match_ready',
						{
							name: name_0,
							team: team_0
						} );
						connectedPlayers[ 0 ].emit( 'match_ready',
						{
							name: name_1,
							team: team_1
						} );
					} );
				} );
			} );
		} );
	};

	reset();

};