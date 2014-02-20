// Dependencies.

var Q = require( 'q' );

// Initialization methods.

/**
 * Modifies given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {ArmorSet} item    Basic ArmorSet object (just attributes, without methods).
 * @return {promise}          Promise about updating given object.
 */
function process_item( item )
{
	var model = require( './model.js' );

	// Find armor type.

	var type_found_defer = Q.defer();
	var type_found_promise = type_found_defer.promise;

	model.ArmorType.find(
	{
		id: item.type.id
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

	// Find all components.

	var all_components_found_promise;

	var find_component_and_resolve_promise = function ( item, _component, component_defer )
	{
		model.ArmorPiece.find(
		{
			id: item.components[ _component ].id
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) component_defer.reject( err );
			else if ( docs.length < 1 ) component_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.components[  _component ] = doc._id;
				component_defer.resolve();
			}
		} );
	};

	var component_promises = [];
	for ( var _component in item.components )
	{
		var component_defer = Q.defer();
		component_promises.push( component_defer.promise );
		find_component_and_resolve_promise( item, _component, component_defer );
	}

	all_components_found_promise = Q.all( component_promises );

	// Find all skills.

	var all_skills_found_promise;

	var find_skill_and_resolve_promise = function ( item, _skill, skill_defer )
	{
		model.Skill.find(
		{
			id: item.skills[ _skill ].skill.id
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

	return Q.all( [ type_found_promise, all_components_found_promise, all_skills_found_promise ] );
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
			ref: 'ArmorType'
		},
		skills:
		{
			type: [
			{
				amount:
				{
					type: Number,
					set: function ( v )
					{
						return Math.floor( v );
					}
				},
				skill:
				{
					type: require( 'mongoose' ).Schema.Types.ObjectId,
					ref: 'Skill'
				}
			} ]
		},
		components:
		{
			type: [
			{
				type: require( 'mongoose' ).Schema.Types.ObjectId,
				ref: 'ArmorPiece'
			} ]
		}
	},
	join: 'type skills.skill components',
	phases: [
	{
		name: 'init',
		requirements: [ 'Skill', 'ArmorType', 'ArmorPiece.init' ],
		callback: process_item
	} ],
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				for ( var i in ret.components )
				{
					ret.components[ i ] = {
						id: ret.components[ i ].id,
						name: ret.components[ i ].name
					};
				}
				delete ret._id;
				delete ret.__v;
			}
		}
	}
};