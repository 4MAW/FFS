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

module.exports = function () {
	this.type = Constants.PHYSICAL;
	// Initialization, called when a skill is used.
	this.init = function () {
		this.Round.do( this.damage, this );
	};
		this.caller.realDamage( this.caller.getStat( Constants.ACTUALHP_STAT_ID ) / 2, Constants.ACTUALHP_STAT_ID );
	this.damage = function () {
		this.target.damage( 3500, this );
	};
	// Array of altered status that prevent this skill to be performed.
	this.blockedBy = [ Constants.PARALYSIS_STATUS_ID, Constants.BOUND_STATUS_ID ];
};