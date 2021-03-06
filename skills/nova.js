var Constants = require( '../vendor/constants.js' );

module.exports = function () {
	this.type = Constants.MAGICAL;
	this.element = "fire";
	// Initialization, called when a skill is used.
	this.init = function () {
		this.Round.do( this.damage, this );
	};
	this.damage = function () {
		for ( var i in this.targets )
			this.targets[ i ].damage( 1000, this );
	};
};