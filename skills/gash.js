var Constants = require( './constants.js' ),

module.exports = function ()
{
	this.type = Constants.PHYSICAL;
	// Initialization, called when a skill is used.
	this.init = function ()
	{
		this.Round.do( this.damage, this );
	};
	this.damage = function ()
	{
		this.caller.realDamage(this.cost, Constants.ACTUALMP_STAT_ID);
		if(this.target.getArmorType(Constants.PHYSICAL) == Constants.PHY_FACTOR_LEATHER)
			this.target.damage( 2000, this );
		else if(this.target.getArmorType(Constants.PHYSICAL) == Constants.PHY_FACTOR_CHAIN)
			this.targets.damage( 1000, this );
		else 
			this.targets.damage( 500, this );
	};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ Constants.PARALYSIS_STATUS_ID, Constants.BOUND_STATUS_ID ];
};