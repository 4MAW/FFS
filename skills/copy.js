var Constants = require( '../vendor/constants.js' ),
	Skill = require( './skill.js' );

module.exports = function () {
	this.type = Constants.MAGICAL;
	// Initialization, called when a skill is used.
	this.init = function () {
		var targetSkill = this.Round.previousRound( this.target );
		if ( targetSkill ) {
			var c = Skill.cast( this.caller, [ this.target ], targetSkill.id );
			c.init();
		}
	};
};