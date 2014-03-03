module.exports = function ()
{
	this.type = "magical";
	this.element = "fire";
	// Initialization, called when a skill is used.
	this.init = function ()
	{
		this.Round.do( this.damage, this );
	};
	this.damage = function ()
	{
		for ( var i in this.targets )
			this.targets[ i ].damage( 1000, 250, this );
	};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ "paralysis", "mutis" ];
};