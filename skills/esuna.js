module.exports = function ()
{
	this.type = "magical";
	// Initialization, called when a skill is used.
	this.init = function ()
	{
		this.Round.do( this.heal, this );
	};
	this.heal = function ()
	{
		this.target.unsetStatus( [ "poison", "blind" ], this, true );
	};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ "paralysis", "mutis" ];
};