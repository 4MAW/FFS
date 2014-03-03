// You can safely assume that the following attributes are set:
//
// - id:       ID of this skill.
// - name:     Name of this skill.
// - target:   Target of this skill (if there is only one target). Character.
// - targets:  Array of targets of this skill. [Character].
// - caller:   Character performing using this skill.
// - Round:    Round API.

module.exports = function ()
{
	this.type = "physical";
	// Initialization, called when a skill is used.
	this.init = function ()
	{
		this.Round.do( this.damage, this );
	};
	this.damage = function ()
	{
		this.target.damage( 100, 50, this );
	};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ "paralysis" ];
};