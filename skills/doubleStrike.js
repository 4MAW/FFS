// You can safely assume that the following attributes are set:
//
// - id:          ID of this skill.
// - name:        Name of this skill.
// - target:      Target of this skill (if there is only one target). Character.
// - targets:     Array of targets of this skill. [Character].
// - caller:      Character performing using this skill.
// - Round:       Round API.
// - accuracy:    Accuracy of the skill (0...1).
// - multiTarget: Whether this skill is a multi target skill or not.

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
		this.caller.realDamage( this.cost.amount, this.cost.stat );
		for ( var i in this.targets )
		// WTF? Daño en función de la fuerza? Es intencionado?
		// En cualquier caso, si esto se salta la defensa la skill no debería de
		// tener tipo de daño, ya que el tipo es para elegir el algoritmo, y si
		// no hay algoritmo...
			this.targets[ i ].damage( 0.6 * Constants.STR_STAT_ID, this );
	};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ Constants.PARALYSIS_STATUS_ID, Constants.BOUND_STATUS_ID ];
};