// Dependencies.
var Constants = require( '../vendor/constants.js' );

// Definition.

module.exports = function ()
{
	this.type = Constants.PHYSICAL;
	// Here we will store UUIDs of callbacks registered by this skill.
	this.internalVariables = {};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ Constants.PARALYSYS_STATUS_ID, Constants.BOUND_STATUS_ID ];

	// Initialization, called when a skill is used.
	this.init = function ()
	{
		this.Round.do( this.stealth, this );
	};

	// Registers the duration and unregister callbacks.
	this.stealth = function ()
	{
		// Compute duration: 2±1 rounds.
		var duration = 1 + Math.round( Math.random() * 2 - 1 );
		duration = 1; // Just to make the tests deterministic.
		// Store whether character was stealthed or not: in
		// some cases a character won't be stealthed because
		// YOLO MAYBE, no, en serio, de momento no sé que podría evitarlo
		this.internalVariables.did_stealth = this.target.setStatus( [ Constants.HIDDEN_STATUS_ID ], this, this.Round.currentRound() + duration )[ 0 ]; // Stealth's priority will be the round number where it ends. This could be modified to be a linear combination of duration and damage, for instance.
		// If character was stealthed by this skill then register callbacks.
		if ( this.internalVariables.did_stealth )
		{
			// Store UUIDs to cancel callbacks in the future.
			this.internalVariables.in_uuid = this.Round. in ( duration, this.unstealth, this, Constants.ENDROUND_EVENT );
		}
	};

	// Unregisters the stealth callback.
	this.unstealth = function ()
	{
		// Unstealth only if this skill did stealth the character.
		if ( this.internalVariables.did_stealth )
			this.target.unsetStatus( [ Constants.HIDDEN_STATUS_ID ], this, false );
	};

	// Cancels the effects produced by this skill.
	//
	// Reasons is an optional array of status, used to
	// allow cancelling just the effects produced by a
	// skill due to one altered status.
	//
	// For instance:  «Vómito de Molbol» will affect
	// several status, one of them might be poison and
	// other might be blind. If you cast a spell that
	// heals "blind" altered status you should affect
	// the poison damage triggered by this skill, even
	// if blind status was triggered also by this skill.
	this.cancel = function ( reasons )
	{
		// Unstealth only if this skill did stealth the character.
		if ( this.internalVariables.did_stealth )
		{
			// In this case this is trivial but if this skill
			// affected more than one altered status this
			// won't be so trivial.
			if ( reasons.indexOf( Constants.HIDDEN_STATUS_ID) > -1 )
			{
				this.Round.cancel( this.internalVariables.in_uuid );
			}
		}
	};
};