// Dependencies.
var crypt = require( './crypt.js' ),
	Q = require( 'q' ),
	Events = require( 'events' ),
	Environment = require( './environment.js' );

// Event emitter in charge of actions' results.
var ema = new Events.EventEmitter();

// Array of enqueued callbacks.
var callbacks_once = [];

// Array of callbacks to be run each round.
var callbacks_each = {};

// Array of defers that handle whether a skill would be performed or not.
var callback_defers = [];

// Store current round number.
var current_round = 0;

// Store current round's changes.
var current_round_changes = [];

ema.on( 'CHANGE', function ( data )
{
	var changes = data.changes;
	var skill = data.skill;

	var i = 0;
	for ( i = 0; i < current_round_changes.length; i++ ) // Foreach loop resets index after completion.
		if ( current_round_changes[ i ].uuid === skill.uuid ) break;

	if ( current_round_changes[ i ] === undefined )
		current_round_changes[ i ] = {
			uuid: skill.uuid,
			skill: skill,
			changes: []
		};

	for ( var j in changes )
		current_round_changes[ i ].changes.push( changes[ j ] );
} );

ema.on( 'COMMIT_ENVIRONMENT', function ()
{

	/*
	 * THIS IS JUST TO MAKE DEBUG EASIER.
	 */

	/*
	console.log( 'Send' );

	for ( var c in current_round_changes )
	{
		var action = current_round_changes[ c ];
		console.log( 'Action ' + c + ' (' + action.uuid.substring( 0, 5 ) + '):' );
		for ( var i in action.changes )
		{
			var change = action.changes[ i ];
			console.log( '\tChange ' + change.change + ' ' + change.item.key + ' ' + change.item.value );
		}
	}

	console.log( 'Clean' );
	*/

	current_round_changes = [];
} );

module.exports = {

	/**
	 *
	 *
	 *        ROUND API FOR CHARACTER
	 *
	 *
	 */

	/**
	 * Notifies that caller performed skill targetting targets altering environtment from before to after.
	 * @param  {Character} caller Character who used the skill. If skill is a registered callback caller would be undefined.
	 * @param  {[Target]}          targets Character who will be affected by skill.
	 * @param  {CalledSkill}       skill   Skill used.
	 * @param  {Environment}       before  Environment before using the skill.
	 * @param  {Environment}       after   Environment after using the skill.
	 */
	notify: function ( caller, targets, skill, before, after ) {

	},

	/**
	 * Notifies that given skill produced given changes in the environment.
	 * @param  {[Change]}    changes Array of changes due to given skill.
	 * @param  {CalledSkill} skill   Skill performed.
	 */
	notifyChanges: function ( changes, skill )
	{
		ema.emit( 'CHANGE',
		{
			changes: changes,
			skill: skill
		} );
	},

	/**
	 *
	 *
	 *         ROUND API FOR SKILLS
	 *
	 *
	 */

	/**
	 * Performs given callback in this round.
	 * @param  {Function} callback Callback to run.
	 * @param  {Object}   tthis    Object to be used as caller of callback.
	 * @return {Promise}           Promise about performing given action.
	 */
	"do": function ( callback, tthis )
	{
		// To be able to tell apart different instantiations of a skill.
		tthis.round = this.currentRound();
		tthis.uuid = crypt.hash( JSON.stringify(
		{
			target: tthis.target.id,
			caller: tthis.caller.id,
			round: tthis.round,
			skill: tthis.id
		} ) );
		// @TODO This should be recored in an array of actions performed this round so it can be animated by the clients.
		callback.apply( tthis );
	},
	/**
	 * Performs given callback N rounds after current round.
	 * @param  {[type]}   rounds   Amount of rounds that will pass before running the callback, including current round.
	 * @param  {Function} callback Callback to run.
	 * @param  {Object}   tthis    Object to be used as caller of callback.
	 * @param  {string}   phase    Round phase when given callback should be run.
	 * @return {string}            UUID of registered callback.
	 */
	"in": function ( rounds, callback, tthis, phase )
	{
		if ( callbacks_once[ rounds ] === undefined )
			callbacks_once[ rounds ] = {};
		if ( callbacks_once[ rounds ][ phase ] === undefined )
			callbacks_once[ rounds ][ phase ] = {};
		var uuid = crypt.nonce();
		var defer = Q.defer();
		// @TODO This should be recored in an array of actions performed this round so it can be animated by the clients.
		// Probably we would use something like:
		// callbacks_once[ rounds ][ phase ][ uuid ] = defer.promise.then( ··· callback ··· ).then( log_action ).fail( log_action_failed );
		for ( var i = 0; i < rounds; i++ )
			if ( callbacks_once[ i ] === undefined )
				callbacks_once[ i ] = {};
		callbacks_once[ rounds ][ phase ][ uuid ] = defer.promise.then( function ()
		{
			callback.apply( tthis );
		} );
		callback_defers[ uuid ] = defer;
		return uuid;
	},
	/**
	 * Cancels a callback enqueued to be performed in a future round.
	 * @param  {string} callback_uuid UUID of callback to be cancelled.
	 */
	"cancel": function ( callback_uuid )
	{
		callback_defers[ callback_uuid ].reject();
	},
	/**
	 * Registers a callback so it is performed every round at given phase.
	 * @param  {Function} callback Callback to run.
	 * @param  {Object}   tthis    Object to be used as caller of callback.
	 * @param  {string}   phase    Round phase when given callback should be run.
	 * @return {string}            UUID of callback, to be used as identifier to unregister the callback later.
	 */
	"each": function ( callback, tthis, phase )
	{
		if ( callbacks_each[ phase ] === undefined )
			callbacks_each[ phase ] = {};
		var uuid = crypt.nonce();
		callbacks_each[ phase ][ uuid ] = {
			callback: callback,
			_this: tthis
		};
		return uuid;
	},
	/**
	 * Unregisters a callback that otherwise would be performed each round.
	 * @param  {string} uuid UUID of callback to unregister.
	 */
	"uneach": function ( uuid )
	{
		for ( var p in callbacks_each )
			delete callbacks_each[ p ][ uuid ];
	},

	/**
	 *
	 *
	 *         ROUND API FOR BATTLE HANDLER
	 *
	 *
	 */

	/**
	 * Finishes current round, removing elements from array and increasing counter.
	 * @return {Object} Object with the actions performed by each player, indicating the order and the results.
	 */
	"finishRound": function ()
	{
		callbacks_once.shift();
		current_round++;
		ema.emit( 'COMMIT_ENVIRONMENT' );

		// @TODO This method should return the results of this round so they can be sent to players.
		//return everything_done_and_the_results;
	},
	/**
	 * Performs callbacks of given phase for current round.
	 * @param  {string}  phase Phase whose callbacks will be performed.
	 * @return {Promise}       Promise about performing the callbacks of given phase.
	 */
	"performPhaseCallbacks": function ( phase )
	{

		// We want to wait until all callbacks have been executed.
		var promises = [];

		// If there are callbacks added to this round and this phase...
		if ( callbacks_once[ 0 ] !== undefined && callbacks_once[ 0 ][  phase ] !== undefined )
		{
			for ( var uuid in callbacks_once[ 0 ][ phase ] )
			{
				// This defer will be resolved when the callback has been executed.
				var defer = Q.defer();
				promises.push( defer.promise );
				// Maybe a callback is not executed because it's cancelled.
				// That's ok, we won't wait for it but we want to use Q.all
				// and a rejected defer will break the wait, so we resolve
				// the defer to use Q.all without any other change.
				callbacks_once[ 0 ][ phase ][ uuid ].then( defer.resolve ).fail( defer.resolve );
				// Resolve the defer so the skill is executed.
				// If the skill was cancelled the defer would be already rejected
				// and this will be equivalent to noop.
				callback_defers[ uuid ].resolve();
			}
		}

		if ( callbacks_each[ phase ] !== undefined )
			for ( var i in callbacks_each[ phase ] )
				callbacks_each[ phase ][ i ].callback.apply( callbacks_each[ phase ][ i ]._this );

		return Q.all( promises );
	},

	/**
	 * Returns current round's number.
	 * @return {integer} Current round's number.
	 */
	"currentRound": function ()
	{
		return current_round;
	},

	/**
	 * Returns the commit (array of changes) of this round.
	 * @return {Commit} Changes of this round.
	 */
	"changes": function ()
	{
		return current_round_changes;
	}
};