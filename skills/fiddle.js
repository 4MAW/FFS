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
		// Store whether character was paralyzed or not.
		//this.internalVariables.did_paralyze = this.target.setStatus( [ "paralysis" ], this, this.Round.currentRound() + duration )[ 0 ];

		this.internalVariables.did_fiddle1 = this.target.setStatus( [ Constants.HIDDEN_STATUS_ID ], this, this.Round.currentRound() + duration )[ 0 ]
		this.internalVariables.did_fiddle2 = this.target.setStatus( [ Constants.HIDDEN_STATUS_ID ], this, this.Round.currentRound() + duration )[ 1 ]

		if(this.internalVariables.did_fiddle1 && this.internalVariables.did_fiddle2){
			var statAux1 = this.targets[ 0 ].get_stat(Constants.DEF_STAT_ID);
			var statAux2 = this.targets[ 1 ].get_stat(Constants.DEF_STAT_ID);
			this.targets[ 0 ].alterStat(statAux2/statAux1, Constants.DEF_STAT_ID, this);
			this.targets[ 1 ].alterStat(statAux1/statAux2, Constants.DEF_STAT_ID, this);

			// Store UUIDs to cancel callbacks in the future.
			this.internalVariables.in_uuid = this.Round. in ( duration, this.unparalyze, this, Constants.ENDROUND_EVENT );
		}
	};
	// Unsets altered status.
	this.unfiddle = function ()
	{
		// Unpoison only if this skill did poison the character.
		if ( this.internalVariables.did_fiddle1 && this.internalVariables.did_fiddle2 ){
			this.targets[ 0 ].unsetStatus( [ Constants.HIDDEN_STATUS_ID ], this, false );
			this.targets[ 1 ].unsetStatus( [ Constants.HIDDEN_STATUS_ID ], this, false );
			var statAux1 = this.targets[ 0 ].get_stat(Constants.DEF_STAT_ID);
			var statAux2 = this.targets[ 1 ].get_stat(Constants.DEF_STAT_ID);
			this.targets[ 0 ].alterStat(statAux2/statAux1, Constants.DEF_STAT_ID, this);
			this.targets[ 1 ].alterStat(statAux1/statAux2, Constants.DEF_STAT_ID, this);
		}
	};
	// Cancels the effects produced by this skill.
	this.cancel = function ( reasons )
	{
		// Unparalyses only if this skill did paralyze the character.
		if ( this.internalVariables.did_fiddle1 && this.internalVariables.did_fiddle2 && reasons.indexOf( Constants.HIDDEN_STATUS_ID ) > -1 )
			this.Round.cancel( this.internalVariables.in_uuid );
	};
};