var Q = require( 'q' ),
	events = require( 'events' ),
	model = require( '../models/model.js' ), // Model will be ready as it is loaded and waited in app.js.
	Constants = require( './constants.js' ),
	crypt = require( './crypt.js' ),
	utils = require( './battleUtils.js' ),
	log = require( './log.js' );

module.exports = function ( endpoint )
{

	// Waiting queue socket.
	// - New players arrive to waiting queue.
	//     -< Welcome message is sent.
	//     -> Login message is received.
	//         -< If login is valid, notify and go to next phase.
	//         -< If login is invalid, warn and return to previous phase.
	// - When a match is found, both players are notified and the new room is assigned.
	// - Both players are disconnected from queue socket (stop listening events).
	// ··· If a player is disconnected in this phase, it is removed from the queue.

	var waiting = {
		queue: [],
		ev: new events.EventEmitter()
	};

	var rooms = [];

	endpoint.on( 'connection', function ( client )
	{

		client.emit( Constants.WELCOME_EVENT, Constants.WELCOME_TO_SOCKET_MSG );

		client.on( 'disconnect', function ()
		{
			client.removeAllListeners( Constants.LOGIN_EVENT );
			client.removeAllListeners( 'disconnect' );
		} );

		client.on( Constants.LOGIN_EVENT, function ( credentials )
		{

			model.Player.find(
			{
				username: credentials.username,
				password: crypt.hash( credentials.password )
			}, function ( err, docs )
			{
				if ( err ||  docs.length !== 1 ) client.emit( Constants.LOGIN_FAILED_EVENT );
				else
				{
					client.removeAllListeners( Constants.LOGIN_EVENT );
					client.emit( Constants.LOGIN_SUCCEED_EVENT,
					{
						id: docs[ 0 ].id
					} );

					client.on( Constants.CHOOSE_TEAM_EVENT, function ( team_id )
					{
						var player = docs[ 0 ];

						model.Team.find(
						{
							id: team_id
						} ).populate( model.Team.join ).exec( function ( err, docs )
						{
							if ( err || docs.length !== 1 || player.teams.indexOf( docs[ 0 ]._id ) < 0 ) client.emit( Constants.INVALID_TEAM_EVENT );
							else
							{
								var team = docs[ 0 ];
								var new_entry = {
									socket: client,
									player: JSON.parse( JSON.stringify( player ) ),
									team: JSON.parse( JSON.stringify( team ) )
								};
								waiting.queue.push( new_entry );
								client.removeAllListeners( 'disconnect' );
								client.emit( Constants.VALID_TEAM_EVENT );
								waiting.ev.emit( 'new', waiting.queue.indexOf( new_entry ) );
							}
						} ); // On Team.find.
					} ); // On Choose Team.
				}
			} ); // On Player.find.
		} ); // On Login.

	} ); // On New Connection.

	waiting.ev.on( 'new', function ( index )
	{
		var connected = true;

		waiting.queue[ index ].socket.on( 'disconnect', function ()
		{
			connected = false;
			waiting.queue[ index ].socket.removeAllListeners( 'disconnect' );
			waiting.queue.splice( index, i );
		} );

		var match_found = -1;
		for ( var i = 0; match_found < 0 && i < waiting.queue.length && connected; i++ )
		{
			if ( i === index ) continue;
			var diff = waiting.queue[ i ].player.gamesPlayed - waiting.queue[ index ].player.gamesPlayed;
			if ( Math.abs( diff ) < 20 && connected )
			{
				var new_room_id = crypt.nonce();
				rooms[ new_room_id ] = {
					players: [],
					ev: new events.EventEmitter(),
					battle:
					{
						winner: -1,
						finished: false
					}
				};

				waiting.queue[ index ].socket.removeAllListeners( 'disconnect' );

				waiting.queue[ i ].socket.join( new_room_id );
				waiting.queue[ index ].socket.join( new_room_id );
				waiting.queue[ i ].room = new_room_id;
				waiting.queue[ index ].room = new_room_id;
				rooms[ new_room_id ].players.push( waiting.queue[ i ] );
				rooms[ new_room_id ].players.push( waiting.queue[ index ] );
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

	waiting.ev.on( 'match_ready', function ( room_id )
	{
		var room = rooms[ room_id ];

		room.players[ 0 ].socket.on( 'disconnect', function ()
		{
			room.battle.finished = true;
			room.battle.winner = 1;
		} );

		room.players[ 1 ].socket.on( 'disconnect', function ()
		{
			room.battle.finished = true;
			room.battle.winner = 0;
		} );

		var team_0 = room.players[ 0 ].team;
		var name_0 = room.players[ 0 ].player.username;
		var team_1 = room.players[ 1 ].team;
		var name_1 = room.players[ 1 ].player.username;

		var team_0_ready = utils.loadCharactersStats( team_0.characters ).then( function ( t )
		{
			room.players[ 0 ].team.characters = t;
		} );
		var team_1_ready = utils.loadCharactersStats( team_1.characters ).then( function ( t )
		{
			room.players[ 1 ].team.characters = t;
		} );

		Q.all( [ team_0_ready, team_1_ready ] ).then( function ()
		{
			room.players[ 0 ].socket.emit( Constants.SEND_RIVAL_INFO_EVENT,
			{
				rival:
				{
					name: name_1,
					team: team_1
				},
				team: team_0
			} );
			room.players[ 1 ].socket.emit( Constants.SEND_RIVAL_INFO_EVENT,
			{
				rival:
				{
					name: name_0,
					team: team_0
				},
				team: team_1
			} );
			endpoint. in ( room_id ).emit( Constants.DECISIONS_PHASE_START_EVENT );
			// Add handlers.
			room.ev.on( 'decision_phase_start', decision_phase_start );
			// Emit start.
			room.ev.emit( 'decision_phase_start', room_id );
		} ).fail( function ( err )
		{
			log.error( err, 'MATCH SOCKET' );
			log.warn( 'Here hacking attempt should be analyzed', 'HACKING' );
		} );
	} );

	// Match phase.
	// -> Send decision.
	// -< Send rival's decision.
	// - Process character's order.
	// - For each decision d...
	//     - Process result of decision d.
	//     -< Broadcast result of decision d to both players.
	// -< Broadcast end of decision processment.
	// -> Notify about animations ended.
	// -< If match did not end, return to beginning of this phase.
	// -< If match did end, notify and close socket.
	// ··· If a player is disconnected in this phase, rival is declared winner.

	var decision_phase_start = function ( room_id )
	{
		var room = rooms[ room_id ];
		var players = room.players;
		var ev = room.ev;

		var decisions = [];
		var decisions_received = 0;

		var decisions_in_order = {
			actions: [],
			characters: [],
			players: []
		};

		var roundTimeLimit = setTimeout( function ()
		{
			ev.emit( 'all_decisions_received' );
		}, 30000 );

		var handle_decision = function ( _p )
		{
			return function ( decision )
			{
				players[ _p ].socket.removeAllListeners( Constants.DECISION_MADE_EVENT );
				// @TODO Add a verification step to prevent hackers to use unavailable skills.
				log.warn( 'Server should check that given decisions can be performed by character' );
				decisions[ _p ] = decision;
				decisions_received++;
				if ( decisions_received === 2 ) ev.emit( 'all_decisions_received' );
			};
		};

		for ( var _p in players )
			players[ _p ].socket.on( Constants.DECISION_MADE_EVENT, handle_decision( _p ) );

		ev.on( 'all_decisions_received', function ()
		{
			clearTimeout( roundTimeLimit );
			ev.removeAllListeners( 'all_decisions_received' );

			endpoint. in ( room_id ).emit( Constants.DECISIONS_PHASE_END_EVENT );

			for ( var _d = 0; _d < 2; _d++ )
				if ( decisions[ _d ] === undefined )
					decisions[ _d ] = [];

				// We use defers so we can query the Database in the hooks if needed.
			before_order().then( compute_order ).then( after_order ).then( before_damage_phase ).then( damage_phase ).then( after_damage_phase ).then( endphase_phase ).then( function ()
			{

				if ( room.battle.finished )
				{
					// There is a winner by disconnection.
					log.info( 'Winner by disconnection', 'DISCONNECT' );
					close_room( room_id );
				}
				else
				{

					var loser = -1;
					for ( var _p in players )
					{
						var characters_alive = 0;
						for ( var _c in players[ _p ].team.characters )
							if ( players[ _p ].team.characters[ _c ].alive )
								characters_alive++;
						if ( characters_alive === 0 )
							loser = _p;
					}

					for ( _p in players )
					{
						var decisions = {
							actions: [],
							characters: [],
							players: []
						};
						for ( var i in decisions_in_order.players )
						{
							if ( decisions_in_order.actions[ i ].damage === Constants.CHARACTER_DIED_BEFORE_ACTION )
								continue;
							decisions.actions.push( decisions_in_order.actions[ i ] );
							decisions.characters.push( decisions_in_order.characters[ i ] );
							if ( decisions_in_order.players[ i ] === '' + _p )
								decisions.players.push( Constants.PLAYER_SELF );
							else
								decisions.players.push( Constants.PLAYER_RIVAL );
						}
						players[ _p ].socket.emit( Constants.ROUND_RESULTS_EVENT, decisions );
					}

					if ( loser === -1 )
					{
						// Next round.
						endpoint. in ( room_id ).emit( Constants.DECISIONS_PHASE_START_EVENT );
						ev.emit( 'decision_phase_start', room_id );
					}
					else
					{
						log.success( players[ ( loser === 0 ) ? 1 : 0 ].player.username + ' has won!', 'WINNER' );

						// Notify winner and loser.
						players[ loser ].socket.emit( Constants.LOSE_EVENT );
						players[ ( loser === '0' ) ? 1 : 0 ].socket.emit( Constants.WIN_EVENT );

						// @TODO Stats should be saved, but we won't yet because we don't want to alter the Matchmaking algorithm... yet!

						close_room( room_id );
					}
				}

			} );
		} );

		before_order = function ()
		{
			var defer = Q.defer();
			log.info( 'before_order', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else defer.resolve();
			return defer.promise;
		};

		compute_order = function ()
		{
			var defer = Q.defer();
			log.info( 'compute_order', 'HOOK' );

			if ( room.battle.finished ) defer.resolve();
			else
			{
				// Sort characters by speed.
				// @TODO Use a faster algorithm.

				while ( decisions_in_order.actions.length < decisions[ 0 ].length + decisions[ 1 ].length )
				{
					var local_speed = -1;
					var local_index = {
						_p: -1,
						_c: -1
					};

					for ( var _p in decisions )
					{
						for ( var _c in decisions[ _p ] )
						{
							var speed = players[ _p ].team.characters[ _c ].stats[ Constants.SPEED_STAT_ID ];
							if ( speed >= local_speed && decisions_in_order.actions.indexOf( decisions[ _p ][ _c ] ) === -1 )
							{
								// @TODO If speed is equal, randomly choose one.
								local_speed = speed;
								local_index._c = _c;
								local_index._p = _p;
							}
						}
					}
					decisions_in_order.actions.push( decisions[ local_index._p ][ local_index._c ] );
					decisions_in_order.characters.push( players[ local_index._p ].team.characters[ local_index._c ] );
					decisions_in_order.players.push( local_index._p );
				}

			}

			defer.resolve();
			log.success( 'compute_order', 'HOOK' );
			return defer.promise;
		};

		after_order = function ()
		{
			var defer = Q.defer();
			log.info( 'after_order', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else defer.resolve();
			return defer.promise;
		};

		before_damage_phase = function ()
		{
			var defer = Q.defer();
			log.info( 'before_damage_phase', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else defer.resolve();
			return defer.promise;
		};

		damage_phase = function ()
		{
			var defer = Q.defer();
			log.info( 'damage_phase', 'HOOK' );

			if ( room.battle.finished ) defer.resolve();
			else
			{
				for ( var _d in decisions_in_order.actions )
				{
					var d = decisions_in_order.actions[ _d ];
					var c = decisions_in_order.characters[ _d ];
					var p = decisions_in_order.players[ _d ];

					/*
					p === 0 && d.target.player === Constants.PLAYER_RIVAL -> 1
					p === 1 && d.target.player === Constants.PLAYER_ME -> 1
					p === 0 && d.target.player === Constants.PLAYER_ME -> 0
					p === 1 && d.target.player === Constants.PLAYER_RIVAL -> 0
					*/
					var player_target = ( ( p === '0' && d.target.player === Constants.PLAYER_RIVAL ) || ( p === '1' && d.target.player === Constants.PLAYER_SELF ) ) ? 1 : 0;

					var t = players[ player_target ].team.characters[ d.target.character ];

					if ( !( c.alive && t.alive ) )
					{
						decisions_in_order.actions[ _d ].damage = Constants.CHARACTER_DIED_BEFORE_ACTION;
						continue;
					}

					// @TODO Implement the real effects of the skills.
					var damage = Math.round( Math.random() * 10 );

					decisions_in_order.actions[ _d ].damage = damage;

					log.status( c.name + ' used ' + d.skill + ' and did ' + damage + ' damage points to ' + t.name + '!', 'DAMAGE' );

					t.stats[ Constants.HEALTH_STAT_ID ] -= damage;
					t.stats[ Constants.HEALTH_STAT_ID ] = Math.max( t.stats[ Constants.HEALTH_STAT_ID ], 0 );
					if ( t.stats[ Constants.HEALTH_STAT_ID ] === 0 )
					{
						t.alive = false;
						log.status( t.name + ' has fallen!', 'DAMAGE' );
					}
				}

				defer.resolve();
			}
			log.success( 'damage_phase', 'HOOK' );
			return defer.promise;
		};

		after_damage_phase = function ()
		{
			var defer = Q.defer();
			log.info( 'after_damage_phase', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else defer.resolve();
			return defer.promise;
		};

		endphase_phase = function ()
		{
			var defer = Q.defer();
			log.info( 'endphase_phase', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else defer.resolve();
			return defer.promise;
		};
	};

	var close_room = function ( room_id )
	{
		log.info( 'Closing room ' + room_id, 'ROOM' );
		var room = rooms[ room_id ];
		endpoint. in ( room_id ).disconnect();
		room.ev.removeAllListeners( 'decision_phase_start' );
		room.ev.removeAllListeners( 'all_decisions_received' );
	};
};