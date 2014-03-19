// Dependencies.
var Constants = require( '../vendor/constants.js' );

// Definition.
module.exports = function () {
	this.type = Constants.MAGICAL;
	this.internalVariables = {};
	// Initialization, called when a skill is used.
	this.init = function () {
		this.Round.do( this.paralyze, this );
	};
	this.paralyze = function () {
		// Compute duration: 2±1 rounds.
		var duration = 2 + Math.round( Math.random() * 2 - 1 );
		duration = 3; // Just to make the tests deterministic.
		// Store whether character was paralyzed or not.
		this.internalVariables.did_paralyze = this.target.setStatus( [ Constants.PARALYSIS_STATUS_ID ], this, this.Round.currentRound() + duration )[ 0 ];
		// If character was paralyzed by this skill then register unregister callback.
		if ( this.internalVariables.did_paralyze ) {
			// Store UUIDs to cancel callbacks in the future.
			this.internalVariables.in_uuid = this.Round. in ( duration, this.unparalyze, this, Constants.ENDROUND_EVENT );
		}
	};
	// Unsets altered status.
	this.unparalyze = function () {
		// Unpoison only if this skill did poison the character.
		if ( this.internalVariables.did_paralyze )
			this.target.unsetStatus( [ Constants.PARALYSIS_STATUS_ID ], this, false );
	};
	// Cancels the effects produced by this skill.
	this.cancel = function ( reasons ) {
		// Unparalyses only if this skill did paralyze the character.
		if ( this.internalVariables.did_paralyze && reasons.indexOf( Constants.PARALYSIS_STATUS_ID ) > -1 )
			this.Round.cancel( this.internalVariables.in_uuid );
	};
};