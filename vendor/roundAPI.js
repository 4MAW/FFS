// Dependencies.
var crypt = require( './crypt.js' ),
	Q = require( 'q' ),
	Events = require( 'events' ),
	Constants = require( './constants.js' ),
	Statistics = require( './statistics.js' ),
	RoundAction = require( './roundAction.js' );

/**
 * RoundAPI offers a lot of helper methods to add tasks to be performed
 * in the future, cancel enqueued tasks and easily manage any change that
 * should be notified to players.
 *
 * @class RoundAPI
 * @constructor
 */
module.exports = function () {

	/**
	 * Event emitter in charge of actions' results.
	 *
	 * @property ema
	 * @type EventEmitter
	 * @private
	 */
	this.ema = new Events.EventEmitter();

	/**
	 * Array of enqueued callbacks.
	 *
	 * @property callbacks_once
	 * @type {Array}
	 * @private
	 */
	this.callbacks_once = [];

	/**
	 * Array of callbacks to be run each round.
	 *
	 * @property callbacks_each
	 * @type {Object}
	 * @private
	 */
	this.callbacks_each = {};

	/**
	 * Array of defers that handle whether a skill would be performed or not.
	 *
	 * @property callback_defers
	 * @type {Array}
	 * @private
	 */
	this.callback_defers = [];

	/**
	 * Stores current round number.
	 *
	 * @property current_round
	 * @type {Number}
	 * @private
	 */
	this.current_round = 0;

	/**
	 * Stores current round's changes.
	 *
	 * @property current_round_changes
	 * @type {Array}
	 * @private
	 */
	this.current_round_changes = [];

	/**
	 * Stores previous round's changes.
	 *
	 * @property previous_round_changes
	 * @type {Array}
	 * @private
	 */
	this.previous_round_changes = [];

	/**
	 * Fired when a change in a character is produced.
	 *
	 * @event change
	 * @param {Change} data Change object representing the change.
	 */
	this.CHANGE_EVENT_NAME = 'CHANGE';

	/**
	 * Handles a change event.
	 *
	 * @method handle_change_event
	 * @private
	 *
	 * @param {RoundAPI} that Reference to this instance to access internal
	 *                        variables.
	 * @return {Callable}     Handler of change event.
	 */
	this.handle_change_event = function ( that ) {
		return function ( data ) {
			var changes = data.changes;
			var skill = data.skill;

			var i = 0;
			// Foreach loop resets index after completion.
			for ( i = 0; i < that.current_round_changes.length; i++ )
				if ( that.current_round_changes[ i ].uuid === skill.uuid )
					break;

			if ( that.current_round_changes[ i ] === undefined )
				that.current_round_changes[ i ] = new RoundAction( skill );

			for ( var j in changes )
				that.current_round_changes[ i ].changes.push( changes[ j ] );
		};
	};
	this.ema.on( this.CHANGE_EVENT_NAME, this.handle_change_event( this ) );

	/**
	 * Fired when a round finishes.
	 *
	 * @event commit
	 */
	this.COMMIT_EVENT_NAME = 'COMMIT_ENVIRONMENT';

	/**
	 * Handles a commit event.
	 *
	 * @method handle_commit_event
	 * @private
	 *
	 * @param {RoundAPI} that Reference to this instance to access internal
	 *                        variables.
	 * @return {Callable}     Handler of commit event.
	 */
	this.handle_commit_event = function ( that ) {
		return function () {
			/*
			 * THIS IS JUST TO MAKE DEBUG EASIER.
			 */

			/*
			console.log( 'Send' );

			for ( var c in current_round_changes ) {
				var action = current_round_changes[ c ];
				console.log(
					'Action ' + c + ' (' +
					action.uuid.substring( 0, 5 ) + '):' );
				for ( var i in action.changes ) {
					var change = action.changes[ i ];
					console.log(
						'\tChange ' + change.change + ' ' +
						change.item.key + ' ' + change.item.value );
				}
			}

			console.log( 'Clean' );
			*/

			that.previous_round_changes = that.current_round_changes;
			that.current_round_changes = [];
		};
	};
	this.ema.on( this.COMMIT_EVENT_NAME, this.handle_commit_event( this ) );

	/**
	 *
	 *
	 *          ROUND API FOR CHARACTER
	 *
	 *
	 */

	/**
	 * Notifies that given skill produced given changes in the environment.
	 *
	 * @method notifyChanges
	 * @public
	 *
	 * @param  {[Change]}    changes Array of changes due to given skill.
	 * @param  {CalledSkill} skill   Skill performed.
	 */
	this.notifyChanges = function ( changes, skill ) {
		this.ema.emit( 'CHANGE', {
			changes: changes,
			skill: skill
		} );
	};

	/**
	 *
	 *
	 *         ROUND API FOR SKILLS
	 *
	 *
	 */

	/**
	 * Performs given callback in this round.
	 *
	 * @method do
	 * @public
	 *
	 * @todo This should be recored in an array of actions performed this round
	 *       so it can be animated by the clients.
	 *
	 * @param  {Function} callback Callback to run.
	 * @param  {Object}   tthis    Object to be used as caller of callback.
	 * @return {Promise}           Promise about performing given action.
	 */
	this[ "do" ] = function ( callback, tthis ) {
		// To be able to tell apart different instantiations of a skill.
		tthis.round = this.currentRound();
		tthis.uuid = crypt.hash( JSON.stringify( {
			caller: tthis.caller.id,
			round: tthis.round,
			skill: tthis.id
		} ) );

		Statistics.increaseStatistic(
			Constants.STATISTIC_SKILLS_USED_PREFIX + tthis.id,
			1 );
		Statistics.increaseLocalComplexStatistic(
			Constants.STATISTIC_TIMES_SKILL_USED_IN_WON_BATTLE + tthis.id,
			tthis.caller.id,
			1 );

		// @TODO This should be recored in an array of actions performed this
		//       round so it can be animated by the clients.
		callback.apply( tthis );
	};

	/**
	 * Performs given callback N rounds after current round.
	 *
	 * @method in
	 * @public
	 *
	 * @param  {[type]}   rounds   Amount of rounds that will pass before
	 *                             running the callback, including current
	 *                             round.
	 * @param  {Function} callback Callback to run.
	 * @param  {Object}   tthis    Object to be used as caller of callback.
	 * @param  {string}   phase    Round phase when given callback should be
	 *                             run.
	 * @return {string}            UUID of registered callback.
	 */
	this[ "in" ] = function ( rounds, callback, tthis, phase ) {

		if ( this.callbacks_once[ rounds ] === undefined )
			this.callbacks_once[ rounds ] = {};
		if ( this.callbacks_once[ rounds ][ phase ] === undefined )
			this.callbacks_once[ rounds ][ phase ] = {};
		var uuid = crypt.nonce();
		var defer = Q.defer();
		// @TODO This should be recored in an array of actions performed this
		//       round so it can be animated by the clients.
		// Probably we would use something like:
		// callbacks_once[ rounds ][ phase ][ uuid ] = defer.promise.then( ··· callback ··· ).then( log_action ).fail( log_action_failed );
		for ( var i = 0; i < rounds; i++ )
			if ( this.callbacks_once[ i ] === undefined )
				this.callbacks_once[ i ] = {};
		this.callbacks_once[ rounds ][ phase ][ uuid ] = defer.promise.then(
			function () {
				callback.apply( tthis );
			}
		);
		this.callback_defers[ uuid ] = defer;
		return uuid;
	};

	/**
	 * Cancels a callback enqueued to be performed in a future round.
	 *
	 * @method cancel
	 * @public
	 *
	 * @param  {string} callback_uuid UUID of callback to be cancelled.
	 */
	this.cancel = function ( callback_uuid ) {
		this.callback_defers[ callback_uuid ].reject();
	};

	/**
	 * Registers a callback so it is performed every round at given phase.
	 *
	 * @method each
	 * @param  {Function} callback Callback to run.
	 * @param  {Object}   tthis    Object to be used as caller of callback.
	 * @param  {string}   phase    Round phase when given callback should be
	 *                             run.
	 * @return {string}            UUID of callback, to be used as identifier to
	 *                             unregister the callback later.
	 */
	this.each = function ( callback, tthis, phase ) {
		if ( this.callbacks_each[ phase ] === undefined )
			this.callbacks_each[ phase ] = {};
		var uuid = crypt.nonce();
		this.callbacks_each[ phase ][ uuid ] = {
			callback: callback,
			_this: tthis
		};
		return uuid;
	};

	/**
	 * Unregisters a callback that otherwise would be performed each round.
	 *
	 * @method uneach
	 * @public
	 *
	 * @param  {string} uuid UUID of callback to unregister.
	 */
	this.uneach = function ( uuid ) {
		for ( var p in this.callbacks_each )
			delete this.callbacks_each[ p ][ uuid ];
	};

	/**
	 *
	 *
	 *         ROUND API FOR BATTLE HANDLER
	 *
	 *
	 */

	/**
	 * Finishes current round, removing elements from array and increasing
	 * counter.
	 *
	 * @method finishRound
	 * @public
	 *
	 * @return {Object} Object with the actions performed by each player,
	 *                  indicating the order and the results.
	 */
	this.finishRound = function () {
		this.callbacks_once.shift();
		this.current_round++;
		this.ema.emit( this.COMMIT_EVENT_NAME );
	};

	/**
	 * Performs callbacks of given phase for current round.
	 *
	 * @method performPhaseCallback
	 * @public
	 *
	 * @param  {string}  phase Phase whose callbacks will be performed.
	 * @return {Promise}       Promise about performing the callbacks of given
	 *                         phase.
	 */
	this.performPhaseCallbacks = function ( phase ) {

		// We want to wait until all callbacks have been executed.
		var promises = [];
		var cbo = this.callbacks_once[ 0 ];

		// If there are callbacks added to this round and this phase...
		if ( cbo !== undefined && cbo[ phase ] !== undefined ) {
			for ( var uuid in cbo[ phase ] ) {
				// This defer will be resolved when the callback has been
				// executed.
				var defer = Q.defer();
				promises.push( defer.promise );
				// Maybe a callback is not executed because it's cancelled.
				// That's ok, we won't wait for it but we want to use Q.all
				// and a rejected defer will break the wait, so we resolve
				// the defer to use Q.all without any other change.
				cbo[ phase ][ uuid ]
					.then( defer.resolve )
					.fail( defer.resolve );
				// Resolve the defer so the skill is executed.
				// If the skill was cancelled the defer would be already
				// rejected and this will be equivalent to noop.
				this.callback_defers[ uuid ].resolve();
			}
		}

		if ( this.callbacks_each[ phase ] !== undefined )
			for ( var i in this.callbacks_each[ phase ] ) {
				this.callbacks_each[ phase ][ i ]
					.callback
					.apply( this.callbacks_each[ phase ][ i ]._this );
			}

		return Q.all( promises );
	};

	/**
	 * Returns current round's number.
	 *
	 * @method currentRound
	 * @public
	 *
	 * @return {integer} Current round's number.
	 */
	this.currentRound = function () {
		return this.current_round;
	};

	/**
	 * Returns changes applied in previous round or skill used by given
	 * character in previous round (if any character is given).
	 *
	 * @method previousRound
	 * @param {Character} character        Optional. Character whose action
	 *                                     we're interested on.
	 * @return {[RoundAction]|CalledSkill} Changes applied in previous round by
	 *                                     any player. If a character is given
	 *                                     only the skill performed by that
	 *                                     character is returned. If no skill
	 *                                     was performed null is returned.
	 */
	this.previousRound = function ( character ) {
		if ( character === undefined )
			return this.previous_round_changes;
		else {
			for ( var _c in this.previous_round_changes ) {
				var c = this.previous_round_changes[ _c ];
				if ( c.skill.caller.id === character.id &&
					c.skill.roundNumber === this.current_round - 1 )
					return c.skill;
			}
		}
		return null;
	};

	/**
	 * Returns the array of changes of this round or skill used by given
	 * character in this round (if any character is given).
	 *
	 * @method changes
	 * @public
	 *
	 * @param {Character} character        Character whose action we're
	 *                                     interested on.
	 * @return {[RoundAction]|CalledSkill} Changes applied in this round by any
	 *                                     player. If a character is given only
	 *                                     the skill performed by that character
	 *                                     is returned. If no skill was
	 *                                     performed null is returned.
	 */
	this.changes = function ( character ) {
		if ( character === undefined )
			return this.current_round_changes;
		else {
			for ( var _c in this.current_round_changes ) {
				var c = this.current_round_changes[ _c ];
				if ( c.skill.caller.id === character.id &&
					c.skill.roundNumber === this.current_round )
					return c.skill;
			}
		}
		return null;
	};

	/**
	 *
	 *
	 *         ROUND API FOR MINIONS
	 *
	 *
	 */

	/**
	 * Returns the ID for the next minion in the field.
	 */
	this.newMinionID = function () {
		// @TODO Empty implementation!
	};

};