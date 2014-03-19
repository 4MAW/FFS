var Q = require( 'q' ),
	events = require( 'events' ),
	// Model will be ready as it is loaded and waited in app.js.
	model = require( '../models/model.js' ),
	Constants = require( './constants.js' ),
	crypt = require( './crypt.js' ),
	utils = require( './battleUtils.js' ),
	log = require( './log.js' ),
	Skills = require( '../skills/skill.js' ),
	Character = require( './characterHelper.js' ),
	Round = require( './roundAPI.js' ),
	Statistics = require( './statistics.js' );

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

	endpoint.on( 'connection', function ( client ) {

		client.emit( Constants.WELCOME_EVENT, Constants.WELCOME_TO_SOCKET_MSG );

		client.on( 'disconnect', function () {
			client.removeAllListeners( Constants.LOGIN_EVENT );
			client.removeAllListeners( 'disconnect' );
		} );

		client.on( Constants.LOGIN_EVENT, function ( credentials ) {

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
						} ).populate( model.Team.join ).exec( function ( err, docs ) {
							if ( err || docs.length !== 1 || player.teams.indexOf( docs[ 0 ]._id ) < 0 ) client.emit( Constants.INVALID_TEAM_EVENT );
							else {
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

	waiting.ev.on( 'new', function ( index ) {
		var connected = true;

		waiting.queue[ index ].socket.on( 'disconnect', function () {
			connected = false;
			waiting.queue[ index ].socket.removeAllListeners( 'disconnect' );
			waiting.queue.splice( index, i );
		} );

		var match_found = -1;
		for ( var i = 0; match_found < 0 && i < waiting.queue.length && connected; i++ ) {
			if ( i === index ) continue;
			var diff = waiting.queue[ i ].player.gamesPlayed - waiting.queue[ index ].player.gamesPlayed;
			if ( Math.abs( diff ) < 20 && connected ) {
				var new_room_id = crypt.nonce();
				rooms[ new_room_id ] = {
					players: [],
					characters: {},
					ev: new events.EventEmitter(),
					battle: {
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

	waiting.ev.on( 'match_ready', function ( room_id ) {
		Statistics.increaseStatistic( Constants.STATISTIC_BATTLES_PLAYED, 1 );

		var room = rooms[ room_id ];

		room.players[ 0 ].socket.on( 'disconnect', function () {
			room.battle.finished = true;
			room.battle.winner = 1;
		} );

		room.players[ 1 ].socket.on( 'disconnect', function () {
			room.battle.finished = true;
			room.battle.winner = 0;
		} );

		var team_0 = room.players[ 0 ].team;
		var name_0 = room.players[ 0 ].player.username;
		var team_1 = room.players[ 1 ].team;
		var name_1 = room.players[ 1 ].player.username;

		var characters_promises = [];

		var assign_character = function ( team, index ) {
			return function ( c ) {
				team[ index ] = c;
			};
		};

		var query_and_assign_character = function ( p, i ) {
			var defer = Q.defer();
			characters_promises.push( defer.promise );
			model.Character.find( {
				id: room.players[ p ].team.characters[ i ].id
			}, function ( err, docs ) {
				if ( err ) defer.reject( err );
				else if ( docs.length === 0 ) defer.reject( Constants.ERROR_CHARACTER_NOT_FOUND );
				else {
					Character( docs[ 0 ] ).then( function ( c ) {
						room.players[ p ].team.characters[ i ] = c;
						room.characters[ c.id ] = c;
						defer.resolve();
					} );
				}
			} );
		};

		for ( var p = 0; p < room.players.length; p++ )
			for ( var i = 0; i < room.players[ p ].team.characters.length; i++ )
				query_and_assign_character( p, i );

		Q.all( characters_promises ).then( function () {
			room.players[ 0 ].socket.emit( Constants.SEND_RIVAL_INFO_EVENT, {
				rival: {
					name: name_1,
					team: team_1
				},
				team: team_0
			} );
			room.players[ 1 ].socket.emit( Constants.SEND_RIVAL_INFO_EVENT, {
				rival: {
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
		} ).fail( function ( err ) {
			log.error( err, 'MATCH SOCKET' );
			console.log( err.stack );
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

	var decision_phase_start = function ( room_id ) {
		var room = rooms[ room_id ];
		var players = room.players;
		var characters = room.characters;
		var ev = room.ev;

		var decisions = [];
		var decisions_received = 0;

		var decisions_in_order = [];

		var roundTimeLimit = setTimeout( function () {
			log.warn( 'A player has timeout on decisions phase', 'TIMEOUT' );
			if ( decisions[ 0 ] === undefined ) decisions[ 0 ] = [];
			if ( decisions[ 1 ] === undefined ) decisions[ 1 ] = [];
			ev.emit( 'all_decisions_received' );
		}, 30000 );

		var handle_decision = function ( _p ) {
			return function ( decision ) {
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

		ev.on( 'all_decisions_received', function () {
			clearTimeout( roundTimeLimit );
			ev.removeAllListeners( 'all_decisions_received' );

			endpoint. in ( room_id ).emit( Constants.DECISIONS_PHASE_END_EVENT );

			for ( var _d = 0; _d < 2; _d++ )
				if ( decisions[ _d ] === undefined )
					decisions[ _d ] = [];

				// We use defers so we can query the Database in the hooks if needed.
			before_order().then( compute_order ).then( after_order ).then( before_damage_phase ).then( damage_phase ).then( after_damage_phase ).then( endphase_phase ).then( function () {

				if ( room.battle.finished ) {
					// There is a winner by disconnection.
					log.info( 'Winner by disconnection', 'DISCONNECT' );
					close_room( room_id );
				} else {

					var loser = -1;
					for ( var _p in players ) {
						var characters_alive = 0;
						for ( var _c in players[ _p ].team.characters ) {
							if ( players[ _p ].team.characters[ _c ].alive() )
								characters_alive++;
						}
						if ( characters_alive === 0 )
							loser = _p;
					}

					for ( _p in players )
						players[ _p ].socket.emit( Constants.ROUND_RESULTS_EVENT, Round.changes() );

					Round.finishRound();

					if ( loser === -1 ) {
						// Next round.
						endpoint. in ( room_id ).emit( Constants.DECISIONS_PHASE_START_EVENT );
						ev.emit( 'decision_phase_start', room_id );
					} else {
						log.success( players[ ( loser === 0 ) ? 1 : 0 ].player.username + ' has won!', 'WINNER' );

						// Save victory statistics.
						var winner_characters = players[ ( loser === 0 ) ? 1 : 0 ].team.characters;
						for ( var i in winner_characters ) {
							Statistics.increaseStatistic( Constants.STATISTIC_TIMES_CLASS_WINS_BATTLE + winner_characters[ i ].class.id, 1 );

							var skills_used = Statistics.getLocalComplexStatistic( winner_characters[ i ].id );
							for ( var j in skills_used )
								Statistics.increaseStatistic( j, skills_used[ j ] );
						}

						Statistics.increaseStatistic( Constants.STATISTIC_TIMES_TEAM_WINS_BATTLE + players[ ( loser === 0 ) ? 1 : 0 ].team.id, 1 );

						// Notify winner and loser.
						players[ loser ].socket.emit( Constants.LOSE_EVENT );
						players[ ( loser === '0' ) ? 1 : 0 ].socket.emit( Constants.WIN_EVENT );

						// @TODO Stats should be saved, but we won't yet because we don't want to alter the Matchmaking algorithm... yet!

						close_room( room_id );
					}
				}

			} ).fail( function ( err ) {
				log.error( err );
				console.log( err.stack );
			} );
		} );

		before_order = function () {
			var defer = Q.defer();
			log.info( 'before_order', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else {
				Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
				defer.resolve();
			}
			return defer.promise;
		};

		compute_order = function () {
			var defer = Q.defer();
			log.info( 'compute_order', 'HOOK' );

			if ( room.battle.finished ) defer.resolve();
			else {
				// Sort characters by speed.
				// @TODO Use a faster algorithm.

				var added = {};
				var casters = {};

				while ( decisions_in_order.length < decisions[ 0 ].length + decisions[ 1 ].length ) {
					var local_speed = -1;
					var local_index = {
						_p: -1,
						_c: -1
					};

					for ( var _p in decisions ) {
						for ( var _c in decisions[ _p ] ) {
							var speed = players[ _p ].team.characters[ _c ].stats()[ Constants.SPEED_STAT_ID ];
							if ( speed >= local_speed && added[ _p + '_' + _c ] === undefined ) {
								// @TODO If speed is equal, randomly choose one.
								local_speed = speed;
								local_index._c = _c;
								local_index._p = _p;
							}
						}
					}
					var d = decisions[ local_index._p ][ local_index._c ];
					var caster = characters[ d.character ];

					// Don't store this action if the caster has already
					// performed an action.
					if ( casters[ caster.id ] !== undefined ) continue;
					casters[ caster.id ] = true;

					added[ local_index._p + '_' + local_index._c ] = true;

					var targets = [];
					for ( var j in d.targets )
						targets.push( characters[ d.targets[ j ] ] );

					var calledSkill = Skills.cast( caster, targets, d.skill );
					decisions_in_order.push( calledSkill );
				}

			}

			defer.resolve();
			log.success( 'compute_order', 'HOOK' );
			return defer.promise;
		};

		after_order = function () {
			var defer = Q.defer();
			log.info( 'after_order', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else {
				Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
				defer.resolve();
			}
			return defer.promise;
		};

		before_damage_phase = function () {
			var defer = Q.defer();
			log.info( 'before_damage_phase', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else {
				Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
				defer.resolve();
			}
			return defer.promise;
		};

		damage_phase = function () {
			var defer = Q.defer();
			log.info( 'damage_phase', 'HOOK' );

			if ( room.battle.finished ) defer.resolve();
			else {
				for ( var _d in decisions_in_order ) {
					var castedSkill = decisions_in_order[ _d ];
					if ( castedSkill.caller.canPerformAction( castedSkill ) ) {
						castedSkill.caller.realDamage( castedSkill.cost.amount, castedSkill.cost.stat );
						castedSkill.init();
					}
				}
				defer.resolve();
			}
			log.success( 'damage_phase', 'HOOK' );
			return defer.promise;
		};

		after_damage_phase = function () {
			var defer = Q.defer();
			log.info( 'after_damage_phase', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else {
				Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
				defer.resolve();
			}
			return defer.promise;
		};

		endphase_phase = function () {
			var defer = Q.defer();
			log.info( 'endphase_phase', 'HOOK' );

			for ( var p in players )
				for ( var i in players[ p ].team.characters )
					Statistics.increaseStatistic( Constants.STATISTIC_ROUNDS_CLASS_PLAYED + players[ p ].team.characters[ i ].class.id, 1 );

			if ( room.battle.finished ) defer.resolve();
			else {
				Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );
				defer.resolve();
			}
			return defer.promise;
		};
	};

	var close_room = function ( room_id ) {
		log.info( 'Closing room ' + room_id, 'ROOM' );
		var room = rooms[ room_id ];

		for ( var p in room.players ) {
			room.players[ p ].socket.leave( room_id );
			room.players[ p ].socket.disconnect();
		}

		room.ev.removeAllListeners( 'decision_phase_start' );
		room.ev.removeAllListeners( 'all_decisions_received' );

		delete rooms[ room_id ];
	};
};