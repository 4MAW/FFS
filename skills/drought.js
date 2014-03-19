var Constants = require( '../vendor/constants.js' );

module.exports = function () {
	this.type = Constants.PHYSICAL;
	// Initialization, called when a skill is used.
	this.init = function () {
		this.Round.do( this.damage, this );
	};
	this.damage = function () {
		this.target.consumeMP( 300, this );
	};
};