// Dependencies.
var crypt = require( './crypt.js' );
var Q = require( 'q' );

// Array of enqueued callbacks.
var callbacks_once = [];

// Array of callbacks to be run each round.
var callbacks_each = {};

// Array of defers that handle whether a skill would be performed or not.
var callback_defers = {};

// Store current round number.
var current_round = 0;

module.exports = {

	/**
	 *
	 *
	 *         ROUND API FOR SKILLS
	 *
	 *
	 */

	/**
	 * Performs given callback in this round at given phase.
	 * @param  {Function} callback Callback to run.
	 * @param  {string}   phase    Round phase when given callback should be run.
	 * @return {Promise}           Promise about performing given action.
	 */
	"do": function ( callback, phase ) {

	},
	/**
	 * Performs given callback N rounds after current round.
	 * @param  {[type]}   rounds   Amount of rounds that will pass before running the callback, including current round.
	 * @param  {Function} callback Callback to run.
	 * @param  {string}   phase    Round phase when given callback should be run.
	 * @return {string}            UUID of registered callback.
	 */
	"in": function ( rounds, callback, phase )
	{
		if ( callbacks_once[ rounds ] === undefined )
			callbacks_once[ rounds ] = {};
		if ( callbacks_once[ rounds ][ phase ] === undefined )
			callbacks_once[ rounds ][ phase ] = {};
		var uuid = crypt.nonce();
		var defer = Q.defer();
		callbacks_once[ rounds ][ phase ][ uuid ] = defer.promise.then( callback );
		callback_defers[ uuid ] = defer;
		return uuid;
	},
	/**
	 * Cancels a callback enqueued to be performed in a future round.
	 * @param  {string} callback_uuid UUID of callback to be cancelled.
	 */
	"cancel": function ( callback_uuid )
	{
		callbacks_defers[ callback_uuid ].reject();
	},
	/**
	 * Registers a callback so it is performed every round at given phase.
	 * @param  {Function} callback Callback to run.
	 * @param  {string}   phase    Round phase when given callback should be run.
	 * @return {string}            UUID of callback, to be used as identifier to unregister the callback later.
	 */
	"each": function ( callback, phase )
	{
		if ( callbacks_each[ phase ] === undefined )
			callbacks_each[ phase ] = {};
		var uuid = crypt.nonce();
		callbacks_each[ phase ][ uuid ] = callback;
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
	 */
	"finishRound": function ()
	{
		callbacks_once.shift();
		current_round++;
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

		for ( var uuid in callbacks_once[ 0 ][ phase ] )
		{
			// This defer will be resolved when the callback has been executed.
			var defer = Q.defer();
			promises.push( defer.promise );
			// Maybe a callback is not executed because it's cancelled.
			// That's ok, we won't wait for it but we want to use Q.all
			// and a rejected defer will break the wait, so we resolve
			// the defer to use Q.all without any other change.
			callbacks_once[ 0 ][ phase ].then( defer.resolve ).fail( defer.resolve );
			// Resolve the defer so the skill is executed.
			// If the skill was cancelled the defer would be already rejected
			// and this will be equivalent to noop.
			callback_defers[ uuid ].resolve();
		}

		return Q.all( promises );
	},

	/**
	 * Returns current round's number.
	 * @return {integer} Current round's number.
	 */
	"currentRound": function ()
	{
		return current_round;
	}
};