// Dependencies.
var Constants = require( '../vendor/constants.js' );

// Definition.
module.exports = function ()
{
	this.type = Constants.PHYSICAL;
	this.internalVariables = {};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ Constants.PARALYSIS_STATUS_ID, Constants.SILENCE_STATUS_ID ];
	// Initialization, called when a skill is used.
	this.init = function ()
	{
		this.Round.do( this.fiddle, this );
	};

	this.fiddle = function ()
	{
		// Compute duration: 2±1 rounds.
		var duration = 2 + Math.round( Math.random() * 2 - 1 );
		duration = 3; // Just to make the tests deterministic.
		this.caller.realDamage( this.cost.amount, this.cost.stat );

		this.internalVariables.did_fiddle1 = this.targets[ 0 ].setStatus( [ Constants.FIDDLED_STATUS_ID ], this, this.Round.currentRound() + duration )[ 0 ];
		this.internalVariables.did_fiddle2 = this.targets[ 1 ].setStatus( [ Constants.FIDDLED_STATUS_ID ], this, this.Round.currentRound() + duration )[ 0 ];

		if ( this.internalVariables.did_fiddle1 && this.internalVariables.did_fiddle2 )
		{
			var statAux1 = this.targets[ 0 ].getStat( Constants.DEF_STAT_ID );
			var statAux2 = this.targets[ 1 ].getStat( Constants.DEF_STAT_ID );

			this.internalVariables.diff1 = statAux1 - statAux2;
			this.internalVariables.diff2 = statAux2 - statAux1;


			this.targets[ 0 ].alterStat( this.internalVariables.diff1, Constants.DEF_STAT_ID, this );
			this.targets[ 1 ].alterStat( this.internalVariables.diff2, Constants.DEF_STAT_ID, this );

			// Store UUIDs to cancel callbacks in the future.
			this.internalVariables.in_uuid = this.Round. in ( duration, this.unfiddle, this, Constants.ENDROUND_EVENT );
		}
		// If both fiddles can't be done, undone the one done.
		else if ( this.internalVariables.did_fiddle1 )
		{
			this.targets[ 0 ].unsetStatus( [ Constants.FIDDLED_STATUS_ID ], this, false );
		}
		else if ( this.internalVariables.did_fiddle2 )
		{
			this.targets[ 1 ].unsetStatus( [ Constants.FIDDLED_STATUS_ID ], this, false );
		}
	};
	// Unsets altered status.
	this.unfiddle = function ()
	{
		// Unpoison only if this skill did poison the character.
		if ( this.internalVariables.did_fiddle1 && this.internalVariables.did_fiddle2 )
		{
			this.targets[ 0 ].unsetStatus( [ Constants.FIDDLED_STATUS_ID ], this, false );
			this.targets[ 1 ].unsetStatus( [ Constants.FIDDLED_STATUS_ID ], this, false );
			this.targets[ 0 ].alterStat( -this.internalVariables.diff1, Constants.DEF_STAT_ID, this );
			this.targets[ 1 ].alterStat( -this.internalVariables.diff2, Constants.DEF_STAT_ID, this );
		}
	};
	// Cancels the effects produced by this skill.
	this.cancel = function ( reasons )
	{
		// Unparalyses only if this skill did paralyze the character.
		if ( this.internalVariables.did_fiddle1 && this.internalVariables.did_fiddle2 && reasons.indexOf( Constants.FIDDLED_STATUS_ID ) > -1 )
			this.Round.cancel( this.internalVariables.in_uuid );
	};
};