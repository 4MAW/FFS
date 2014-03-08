var Constants = require( '../vendor/constants.js' );

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
		if ( Constants.LIGHT_ARMOR_TYPES.indexOf( this.target.getArmorType().id ) > -1 )
			this.target.damage( 2000, this );
		else if ( Constants.MEDIUM_ARMOR_TYPES.indexOf( this.target.getArmorType().id ) > -1 )
			this.target.damage( 1000, this );
		else
			this.target.damage( 500, this );
	};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ Constants.PARALYSIS_STATUS_ID, Constants.BOUND_STATUS_ID ];
};