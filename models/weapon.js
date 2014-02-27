// Dependencies.

var Q = require( 'q' );

// Initialization methods.

/**
 * Modifies given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {Weapon} item Basic Weapon object (just attributes, without methods).
 * @return {promise}     Promise about updating given object.
 */
function process_item( item )
{
	var model = require( './model.js' );

	// Find weapon type.

	var type_found_defer = Q.defer();
	var type_found_promise = type_found_defer.promise;

	model.WeaponType.find(
	{
		id: item.type
	},
	{
		id: 1
	}, function ( err, docs )
	{
		if ( err ) type_found_defer.reject( err );
		else if ( docs.length < 1 ) type_found_defer.reject( 404 );
		else
		{
			var doc = docs[ 0 ];
			item.type = doc._id;
			type_found_defer.resolve();
		}
	} );

	// Find all stats.

	var all_stats_found_promise;

	var find_stat_and_resolve_promise = function ( item, _stat, stat_defer )
	{
		model.Stat.find(
		{
			id: item.stats[  _stat ].stat
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) stat_defer.reject( err );
			else if ( docs.length < 1 ) stat_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.stats[  _stat ].stat = doc._id;
				stat_defer.resolve();
			}
		} );
	};

	var stat_promises = [];
	for ( var _stat in item.stats )
	{
		var stat_defer = Q.defer();
		stat_promises.push( stat_defer.promise );
		find_stat_and_resolve_promise( item, _stat, stat_defer );
	}

	all_stats_found_promise = Q.all( stat_promises );

	// Find all skills.

	var all_skills_found_promise;

	var find_skill_and_resolve_promise = function ( item, _skill, skill_defer )
	{
		model.Skill.find(
		{
			id: item.skills[  _skill ].skill
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) skill_defer.reject( err );
			else if ( docs.length < 1 ) skill_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.skills[  _skill ].skill = doc._id;
				skill_defer.resolve();
			}
		} );
	};

	var skill_promises = [];
	for ( var _skill in item.skills )
	{
		var skill_defer = Q.defer();
		skill_promises.push( skill_defer.promise );
		find_skill_and_resolve_promise( item, _skill, skill_defer );
	}

	all_skills_found_promise = Q.all( skill_promises );

	// Find everything.

	return Q.all( [ type_found_promise, all_stats_found_promise, all_skills_found_promise ] );
}

// Static methods.

// Model definition.

module.exports = {
	schema:
	{
		id:
		{
			type: String,
			index:
			{
				unique: true,
				dropDups: true
			}
		},
		name:
		{
			type: String,
			index:
			{
				unique: true,
				dropDups: true
			}
		},
		type:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'WeaponType'
		},
		stats:
		{
			type: [
			{
				value:
				{
					type: Number,
					set: function ( v )
					{
						return Math.floor( v );
					}
				},
				stat:
				{
					type: require( 'mongoose' ).Schema.Types.ObjectId,
					ref: 'Stat'
				}
			} ]
		},
		skills:
		{
			type: [
			{
				probability:
				{
					type: Number,
					set: function ( v )
					{
						return Math.abs( v );
					}
				},
				skill:
				{
					type: require( 'mongoose' ).Schema.Types.ObjectId,
					ref: 'Skill'
				}
			} ]
		}
	},
	join: 'type skills.skill stats.stat',
	phases: [
	{
		name: 'init',
		requirements: [ 'Stat', 'Skill', 'WeaponType' ],
		callback: process_item
	} ],
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				delete ret.definition;
				delete ret._id;
				delete ret.__v;
			}
		}
	}
};