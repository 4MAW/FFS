// Dependencies.

var Q = require( 'q' ),
	model = require( '../models/model.js' ),
	Constants = require( './constants.js' ),
	log = require( './log.js' );

// Exports.

module.exports = {

	jsonReply: function ( req, res )
	{
		model.Statistic.find(
		{}, function ( err, docs )
		{

			var find_and_assign_skill = function ( stat_skill, defer, skills_stats )
			{
				var name = stat_skill.name;
				var value = stat_skill.value;

				var id = name.replace( Constants.STATISTIC_SKILLS_USED_PREFIX, '' );
				model.Skill.find(
				{
					id: id
				}, function ( err, docs )
				{
					if ( err )
						defer.reject( err );
					else
					{
						skills_stats[ docs[ 0 ].name ] = value;
						defer.resolve();
					}
				} );
			};

			var find_and_assign_skill_damage = function ( stat_skill_damage, defer, skills_damage_stats )
			{
				var name = stat_skill_damage.name;
				var value = stat_skill_damage.value;

				var id = name.replace( Constants.STATISTIC_DAMAGE_BY_SKILL_PREFIX, '' );
				model.Skill.find(
				{
					id: id
				}, function ( err, docs )
				{
					if ( err )
						defer.reject( err );
					else
					{
						skills_damage_stats[ docs[ 0 ].name ] = value;
						defer.resolve();
					}
				} );
			};

			if ( err )
			{
				log.error( err );
				res.send( 500 );
			}
			else
			{
				var skills_patt = new RegExp( Constants.STATISTIC_SKILLS_USED_PREFIX + "\\d+" );
				var skills_damage_patt = new RegExp( Constants.STATISTIC_DAMAGE_BY_SKILL_PREFIX + "\\d+" );
				var status_patt = new RegExp( "^" + Constants.STATISTIC_TIMES_STATUS_ALTERED_PREFIX + "\\w" );
				var healed_status_patt = new RegExp( Constants.STATISTIC_TIMES_HEALED_STATUS_ALTERED_PREFIX + "\\w" );

				var skills_stats = {};
				var skills_damage_stats = {};
				var status_stats = {};
				var healed_status_stats = {};

				var results = {};

				var d;

				var promises = [];
				for ( var i in docs )
				{
					if ( skills_patt.test( docs[ i ].name ) )
					{
						d = Q.defer();
						find_and_assign_skill( docs[ i ], d, skills_stats );
						promises.push( d.promise );
					}
					else if ( skills_damage_patt.test( docs[ i ].name ) )
					{
						d = Q.defer();
						find_and_assign_skill_damage( docs[ i ], d, skills_damage_stats );
						promises.push( d.promise );
					}
					else if ( status_patt.test( docs[ i ].name ) )
					{
						status_stats[ docs[ i ].name.replace( Constants.STATISTIC_TIMES_STATUS_ALTERED_PREFIX, '' ) ] = docs[ i ].value;
					}
					else if ( healed_status_patt.test( docs[ i ].name ) )
					{
						healed_status_stats[ docs[ i ].name.replace( Constants.STATISTIC_TIMES_HEALED_STATUS_ALTERED_PREFIX, '' ) ] = docs[ i ].value;
					}
					else
					{
						results[ docs[ i ].name ] = docs[ i ].value;
					}
				}

				results[ 'skills_used' ] = skills_stats;
				results[ 'skills_damage' ] = skills_damage_stats;
				results[ 'status_altered' ] = status_stats;
				results[ 'status_healed' ] = healed_status_stats;

				Q.all( promises ).then( function ()
				{
					res.send( results );
				} ).fail( function ( err )
				{
					log.error( err );
					res.send( 500 );
				} );

			}
		} );
	},

	increaseStatistic: function ( stat_name, value )
	{
		var defer = Q.defer();

		var v = parseInt( value, 10 );

		model.Statistic.update(
		{
			name: stat_name
		},
		{
			$inc:
			{
				value: v
			}
		},
		{
			multi: false,
			upsert: true
		}, function ( err )
		{
			if ( err ) defer.reject( err );
			defer.resolve();
		} );

		return defer.promise;
	},

	decreaseStatistic: function ( stat_name, value )
	{
		var v = parseInt( value, 10 );
		return this.increaseStatistic( stat_name, v * -1 );
	}

};