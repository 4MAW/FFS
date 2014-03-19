var Constants = require( '../vendor/constants.js' );

module.exports = function () {
	this.type = Constants.PHYSICAL;
	// Initialization, called when a skill is used.
	this.init = function () {
		this.Round.do( this.damage, this );
	};
	this.damage = function () {
		for ( var i in this.targets )
			this.targets[ i ].damage( 1500, this );
	};
};