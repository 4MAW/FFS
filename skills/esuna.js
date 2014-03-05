var Constants = require( '../vendor/constants.js' );

module.exports = function ()
{
	this.type = Constants.MAGICAL;
	// Initialization, called when a skill is used.
	this.init = function ()
	{
		this.Round.do( this.heal, this );
	};
	this.heal = function ()
	{
		this.target.unsetStatus( [ Constants.POISON_STAT_ID, Constants.BLIND_STAT_ID ], this, true );
	};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ Constants.PARALYSIS_STATUS_ID, Constants.SILENCE_STATUS_ID ];
};