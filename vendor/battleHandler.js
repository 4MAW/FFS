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
	Field = require( './fieldAPI.js' ),
	Statistics = require( './statistics.js' );

module.exports = function ( room, endpoint ) {

	var that = this;

	/**
	 * RoundAPI acces.
	 *
	 * @property Round
	 * @type {RoundAPI}
	 * @private
	 */
	this.Round = new Round();

	/**
	 * Field API access.
	 *
	 * @property Field
	 * @type {Field}
	 * @private
	 */
	this.Field = new Field();

	this.room = room;
	this.endpoint = endpoint;

	/**
	 * Control defer.
	 *
	 * @property defer
	 * @type {Defer}
	 * @private
	 */
	this.defer = Q.defer();

	/**
	 * Returns the RoundAPI of this battle.
	 *
	 * @method getRoundAPI
	 * @public
	 *
	 * @return {RoundAPI} RoundAPI instance of this battle.
	 */
	this.getRoundAPI = function () {
		return this.Round;
	};

	/**
	 * Returns the FieldAPI of this battle.
	 *
	 * @method getFieldAPI
	 * @method public
	 *
	 * @return {Field} Field instance of this battle.
	 */
	this.getFieldAPI = function () {
		return this.Field;
	};

	Statistics.increaseStatistic( Constants.STATISTIC_BATTLES_PLAYED, 1 );

	this.room.players[ 0 ].socket.on( 'disconnect', function () {
		room.battle.finished = true;
		room.battle.winner = 1;
	} );

	this.room.players[ 1 ].socket.on( 'disconnect', function () {
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
			id: that.room.players[ p ].team.characters[ i ].id
		}, function ( err, docs ) {
			if ( err ) defer.reject( err );
			else if ( docs.length === 0 )
				defer.reject( Constants.ERROR_CHARACTER_NOT_FOUND );
			else {
				Character( docs[ 0 ], that ).then( function ( c ) {
					that.room.players[ p ].team.characters[ i ] = c;
					that.room.characters[ c.id ] = c;
					// @TODO Add character to proper field.
					that.Field.addCharacter( p, 0, c );
					defer.resolve();
				} );
			}
		} );
	};

	var p, i;

	for ( p = 0; p < this.room.players.length; p++ )
		for ( i = 0; i < this.room.players[ p ].team.characters.length; i++ )
			query_and_assign_character( p, i );

	Q.all( characters_promises ).then( function () {
		that.room.players[ 0 ].socket.emit( Constants.SEND_RIVAL_INFO_EVENT, {
			rival: {
				name: name_1,
				team: team_1
			},
			team: team_0
		} );
		that.room.players[ 1 ].socket.emit( Constants.SEND_RIVAL_INFO_EVENT, {
			rival: {
				name: name_0,
				team: team_0
			},
			team: team_1
		} );
		that.endpoint. in ( that.room.room_id ).emit(
			Constants.DECISIONS_PHASE_START_EVENT
		);
		// Add handlers.
		that.room.ev.on( 'decision_phase_start', decision_phase_start );
		// Emit start.
		that.room.ev.emit( 'decision_phase_start' );
	} ).fail( function ( err ) {
		log.error( err, 'MATCH SOCKET' );
		console.log( err.stack );
		log.warn( 'Here hacking attempt should be analyzed', 'HACKING' );
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

	var decision_phase_start = function () {
		var room = that.room;
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
				players[ _p ].socket.removeAllListeners(
					Constants.DECISION_MADE_EVENT
				);

				var filtered_decisions = [];

				for ( var _c in decision ) {

					var caster = characters[ decision[ _c ].character ];
					var skill = decision[ _c ].skill;

					if ( !caster.isInTeam( players[ _p ].team ) ) {
						// @TODO Store hacking attempt.
						log.warn(
							'A player tried to use a non-available character!'
						);
					} else if ( !caster.skillAvailable( skill ) ) {
						// @TODO Store hacking attempt.
						log.warn(
							'A player tried to use a non-available skill!'
						);
					} else {
						filtered_decisions.push( decision[ _c ] );
					}
				}

				decisions[ _p ] = filtered_decisions;
				decisions_received++;

				if ( decisions_received === 2 )
					ev.emit( 'all_decisions_received' );
			};
		};

		for ( var _p in players )
			players[ _p ].socket.on(
				Constants.DECISION_MADE_EVENT,
				handle_decision( _p )
			);

		ev.on( 'all_decisions_received', function () {
			clearTimeout( roundTimeLimit );
			ev.removeAllListeners( 'all_decisions_received' );

			that.endpoint. in ( that.room.room_id ).emit(
				Constants.DECISIONS_PHASE_END_EVENT
			);

			for ( var _d = 0; _d < 2; _d++ )
				if ( decisions[ _d ] === undefined )
					decisions[ _d ] = [];

				// We use defers so we can query the Database in the hooks if needed.
			var chain = before_order()
				.then( compute_order )
				.then( after_order )
				.then( before_damage_phase )
				.then( damage_phase )
				.then( after_damage_phase )
				.then( endphase_phase );
			chain.then( function () {

				if ( room.battle.finished ) {
					// There is a winner by disconnection.
					log.info( 'Winner by disconnection', 'DISCONNECT' );
					close_room();
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
						players[ _p ].socket.emit(
							Constants.ROUND_RESULTS_EVENT, that.Round.changes()
						);

					that.Round.finishRound();

					if ( loser === -1 ) {
						// Next round.
						//setTimeout( function () {
						that.endpoint. in ( that.room.room_id ).emit(
							Constants.DECISIONS_PHASE_START_EVENT
						);
						ev.emit( 'decision_phase_start', that.room.room_id );
						//}, 1000 );
					} else {
						log.success(
							players[ ( loser === 0 ) ? 1 : 0 ].player.username +
							' has won!', 'WINNER'
						);

						// Save victory statistics.
						var win_chars = players[ ( loser === 0 ) ? 1 : 0 ]
							.team
							.characters;
						for ( var i in win_chars ) {
							Statistics.increaseStatistic(
								Constants.STATISTIC_TIMES_CLASS_WINS_BATTLE +
								win_chars[ i ].class.id,
								1
							);

							var skills_used = Statistics
								.getLocalComplexStatistic( win_chars[ i ].id );
							for ( var j in skills_used )
								Statistics.increaseStatistic(
									j,
									skills_used[ j ]
								);
						}

						Statistics.increaseStatistic(
							Constants.STATISTIC_TIMES_TEAM_WINS_BATTLE +
							players[ ( loser === 0 ) ? 1 : 0 ].team.id,
							1
						);

						// Notify winner and loser.
						players[ loser ].socket.emit( Constants.LOSE_EVENT );
						players[ ( loser === '0' ) ? 1 : 0 ].socket.emit(
							Constants.WIN_EVENT
						);

						// @TODO Stats should be saved, but we won't yet because we don't want to alter the Matchmaking algorithm... yet!

						close_room();
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
			if ( that.room.battle.finished ) defer.resolve();
			else {
				that.Round.performPhaseCallbacks(
					Constants.BEFORE_ORDER_PHASE_EVENT
				);
				defer.resolve();
			}
			return defer.promise;
		};

		compute_order = function () {
			var defer = Q.defer();
			log.info( 'compute_order', 'HOOK' );

			if ( that.room.battle.finished ) defer.resolve();
			else {
				// Sort characters by speed.
				// @TODO Use a faster algorithm.

				var added = {};
				var casters = {};

				while (
					decisions_in_order.length <
					decisions[ 0 ].length + decisions[ 1 ].length
				) {
					var local_speed = -1;
					var local_index = {
						_p: -1,
						_c: -1
					};

					for ( var _p in decisions ) {
						for ( var _c in decisions[ _p ] ) {
							var speed = players[ _p ]
								.team
								.characters[ _c ]
								.stats()[ Constants.SPEED_STAT_ID ];
							if (
								speed >= local_speed &&
								added[ _p + '_' + _c ] === undefined
							) {
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
					if ( casters[ caster.id ] !== undefined ) {
						// @TODO Store hacking attempts.
						log.warn(
							'A player tried to twice the same character'
						);
						continue;
					}
					casters[ caster.id ] = true;

					added[ local_index._p + '_' + local_index._c ] = true;

					var targets = [];
					for ( var j in d.targets )
						targets.push( characters[ d.targets[ j ] ] );

					var calledSkill = Skills.cast(
						caster,
						targets,
						d.skill,
						that
					);
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
				that.Round.performPhaseCallbacks(
					Constants.AFTER_ORDER_PHASE_EVENT
				);
				defer.resolve();
			}
			return defer.promise;
		};

		before_damage_phase = function () {
			var defer = Q.defer();
			log.info( 'before_damage_phase', 'HOOK' );
			if ( room.battle.finished ) defer.resolve();
			else {
				that.Round.performPhaseCallbacks(
					Constants.BEFORE_DAMAGE_PHASE_EVENT
				);
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
						castedSkill.caller.realDamage(
							castedSkill.cost.amount,
							castedSkill.cost.stat
						);
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
				that.Round.performPhaseCallbacks(
					Constants.AFTER_DAMAGE_PHASE_EVENT
				);
				defer.resolve();
			}
			return defer.promise;
		};

		endphase_phase = function () {
			var defer = Q.defer();
			log.info( 'endphase_phase', 'HOOK' );

			for ( var p in players )
				for ( var i in players[ p ].team.characters )
					Statistics.increaseStatistic(
						Constants.STATISTIC_ROUNDS_CLASS_PLAYED +
						players[ p ].team.characters[ i ].class.id,
						1
					);

			if ( room.battle.finished ) defer.resolve();
			else {
				that.Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );
				defer.resolve();
			}
			return defer.promise;
		};
	};

	var close_room = function () {
		log.info( 'Closing room ', 'ROOM' );
		var room = that.room;

		for ( var p in room.players ) {
			room.players[ p ].socket.leave( that.room.room_id );
			room.players[ p ].socket.disconnect();
		}

		room.ev.removeAllListeners( 'decision_phase_start' );
		room.ev.removeAllListeners( 'all_decisions_received' );

		that.defer.resolve();
	};

	return this.defer.promise;
};