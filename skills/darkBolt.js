var Constants = require( '../vendor/constants.js' );

module.exports = function () {
	this.type = Constants.MAGICAL;
	this.element = 'Dark';
	// Initialization, called when a skill is used.
	this.init = function () {
		this.Round.do( this.damage, this );
	};
	this.damage = function () {
		this.target.damage( 2000, this );
	};
};