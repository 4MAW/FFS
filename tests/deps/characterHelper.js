// Dependencies.

var characterHelper = require( '../../vendor/characterHelper.js' ),
	Q = require( 'q' );

var INSTANCE_METHODS = [
	"toJSON",
	"skills",
	"skillAvailable",
	"isInTeam",
	"passiveSkills",
	"stats",
	"initStats",
	"getStat",
	"getMinimumValueOfRangedStat",
	"getMaximumValueOfRangedStat",
	"alterStat",
	"clearStat",
	"clearAllStats",
	"getArmorType",
	"getArmorDefenseFactorAgainst",
	// API
	"canPerformAction",
	"damage",
	"realDamage",
	"hasStatus",
	"hasAllStatus",
	"setStatus",
	"unsetStatus",
	"alive",
	"consumeMP",
	"consumeKI"
];

module.exports = function ( db_source, Battle ) {
	var defer = Q.defer();
	var promise = characterHelper.apply(
		characterHelper, [ db_source, Battle ]
	);

	promise.then( function ( character ) {

		character.__times_called = {};

		var wrap_function = function ( name, callback, that ) {
			return function () {
				if ( that.__times_called[ name ] === undefined )
					that.__times_called[ name ] = 0;
				that.__times_called[ name ]++;
				return callback.apply( that, arguments );
			};
		};

		for ( var i in INSTANCE_METHODS ) {
			var func = INSTANCE_METHODS[ i ];
			character[ func ] = wrap_function(
				func,
				character[ func ],
				character
			);
		}

		character[ "__prev_times_called" ] = {};

		character[ "__times_called_delta" ] = function () {
			var ret = {};

			for ( var j in this.__times_called )
				if ( this.__prev_times_called[ j ] === undefined )
					ret[ j ] = this.__times_called[ j ];
				else
					ret[ j ] = this.__times_called[ j ] -
						this.__prev_times_called[ j ];

			this.__prev_times_called = JSON.parse(
				JSON.stringify( this.__times_called )
			);

			return ret;
		};

		defer.resolve( character );

	} );

	return defer.promise;
};