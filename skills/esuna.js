var Constants = require( '../vendor/constants.js' );

module.exports = function () {
	this.type = Constants.MAGICAL;
	// Initialization, called when a skill is used.
	this.init = function () {
		this.Round.do( this.heal, this );
	};
	this.heal = function () {
		this.target.unsetStatus( [ Constants.POISON_STATUS_ID, Constants.BLIND_STATUS_ID ], this, true );
	};
};