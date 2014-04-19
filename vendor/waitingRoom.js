var Q = require( 'q' ),
	events = require( 'events' ),
	// Model will be ready as it is loaded and waited in app.js.
	model = require( '../models/model.js' ),
	Constants = require( './constants.js' ),
	crypt = require( './crypt.js' ),
	utils = require( './battleUtils.js' ),
	log = require( './log.js' ),
	Battle = require( './battleHandler.js' );

/**
 * This class is in charge of instantiating a new Battle Handler when needed.
 */

module.exports = function ( endpoint ) {

	// Waiting queue socket.
	// - New players arrive to waiting queue.
	//     -< Welcome message is sent.
	//     -> Login message is received.
	//         -< If login is valid, notify and go to next phase.
	//         -< If login is invalid, warn and return to previous phase.
	// - When a match is found, both players are notified and the new room is
	//   assigned.
	// - Both players are disconnected from queue socket (stop listening events)
	// ··· If a player is disconnected in this phase, it is removed from the
	//     queue.

	var waiting = {
		queue: [],
		ev: new events.EventEmitter()
	};

	var rooms = [];

	var on_login_handler = function ( credentials ) {

		var client = this;

		model.Player.find( {
			username: credentials.username,
			password: crypt.hash( credentials.password )
		}, function ( err, docs ) {
			if ( err ||  docs.length !== 1 )
				client.emit( Constants.LOGIN_FAILED_EVENT );
			else {
				client.removeAllListeners( Constants.LOGIN_EVENT );
				client.emit( Constants.LOGIN_SUCCEED_EVENT, {
					id: docs[ 0 ].id
				} );

				client.on( Constants.CHOOSE_TEAM_EVENT, function ( team_id ) {
					var player = docs[ 0 ];

					model.Team.find( {
						id: team_id
					} ).populate( model.Team.join ).exec(
						function ( err, docs ) {
							if (
								err ||
								docs.length !== 1 ||
								player.teams.indexOf( docs[ 0 ]._id ) < 0
							)
								client.emit( Constants.INVALID_TEAM_EVENT );
							else {
								var team = docs[ 0 ];
								var new_entry = {
									socket: client,
									player: JSON.parse(
										JSON.stringify( player )
									),
									team: JSON.parse( JSON.stringify( team ) )
								};
								waiting.queue.push( new_entry );
								client.removeAllListeners( 'disconnect' );
								client.emit( Constants.VALID_TEAM_EVENT );
								waiting.ev.emit(
									'new',
									waiting.queue.indexOf( new_entry )
								);
							}
						}
					); // On Team.find.
				} ); // On Choose Team.
			}
		} ); // On Player.find.
	};

	endpoint.on( 'connection', function ( client ) {

		client.emit( Constants.WELCOME_EVENT, Constants.WELCOME_TO_SOCKET_MSG );

		client.on( 'disconnect', function () {
			client.removeAllListeners( Constants.LOGIN_EVENT );
			client.removeAllListeners( 'disconnect' );
		} );

		client.on( Constants.LOGIN_EVENT, on_login_handler ); // On Login.

	} ); // On New Connection.

	waiting.ev.on( 'new', function ( index ) {
		var connected = true;

		waiting.queue[ index ].socket.on( 'disconnect', function () {
			connected = false;
			waiting.queue[ index ].socket.removeAllListeners( 'disconnect' );
			waiting.queue.splice( index, i );
		} );

		var match_found = -1;
		var wql = waiting.queue.length;
		for ( var i = 0; match_found < 0 && i < wql && connected; i++ ) {
			if ( i === index ) continue;
			var wq = waiting.queue;
			var wqi = wq[ i ];
			var wqindex = wq[ index ];
			var diff = wqi.player.gamesPlayed - wq[ index ].player.gamesPlayed;
			if ( Math.abs( diff ) < 20 && connected ) {
				var new_room_id = crypt.nonce();
				rooms[ new_room_id ] = {
					room_id: new_room_id,
					players: [],
					characters: {},
					ev: new events.EventEmitter(),
					battle: {
						winner: -1,
						finished: false
					}
				};

				wqindex.socket.removeAllListeners( 'disconnect' );

				wqi.socket.join( new_room_id );
				wqindex.socket.join( new_room_id );
				wqi.room = new_room_id;
				wqindex.room = new_room_id;
				rooms[ new_room_id ].players.push( wqi );
				rooms[ new_room_id ].players.push( wqindex );
				waiting.queue.splice( i, 1 );
				waiting.queue.splice( index, 1 );
				endpoint. in ( new_room_id ).emit( Constants.MATCH_FOUND_EVENT );
				waiting.ev.emit( 'match_ready', new_room_id );
			}
		}
	} );

	// Match socket.
	// - New players arrive to match socket.
	// - Server computes stats for local use.
	// -< Rival's team is sent to player.
	// -< Match phase starts.
	// ··· If a player is disconnected in this phase, rival is declared winner.

	waiting.ev.on( 'match_ready', function ( room_id ) {
		var promise = new Battle( rooms[ room_id ], endpoint );
		promise.then( function () {
			delete this.rooms[ room_id ];
		} );
	} );

};