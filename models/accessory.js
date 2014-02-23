// Dependencies.

var Q = require( 'q' );

// Initialization methods.

/**
 * Modifies given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {Accessory} item Basic Accessory object (just attributes, without methods).
 * @return {promise}        Promise about updating given object.
 */
function process_item( item )
{
	var model = require( './model.js' );

	// Find all skills.

	var all_skills_found_promise;

	var find_skill_and_resolve_promise = function ( item, _skill, skill_defer )
	{
		model.Skill.find(
		{
			id: item.skills[  _skill ].skill.id
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

	return Q.all( [ all_skills_found_promise ] );
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
	join: 'skills.skill',
	phases: [
	{
		name: 'init',
		requirements: [ 'Skill' ],
		callback: process_item
	} ],
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				delete ret._id;
				delete ret.__v;
			}
		}
	}
};