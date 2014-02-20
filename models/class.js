// Dependencies.

var Q = require( 'q' );

// Initialization methods.

/**
 * Modifies given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {Class} item Basic Class object (just attributes, without methods).
 * @return {promise}    Promise about updating given object.
 */
function process_item( item )
{
	var model = require( './model.js' );

	// Find all weapon slots.

	var all_weapon_slots_found_promise;

	var find_weapon_slot_and_resolve_promise = function ( item, _weapon_slot, weapon_slot_defer )
	{
		model.WeaponSlot.find(
		{
			id: item.allowedWeapons[ _weapon_slot ].slot.id
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) weapon_slot_defer.reject( err );
			else if ( docs.length < 1 ) weapon_slot_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.allowedWeapons[ _weapon_slot ].slot = doc._id;
				weapon_slot_defer.resolve();
			}
		} );
	};

	var weapon_slot_promises = [];
	for ( var _weapon_slot in item.allowedWeapons )
	{
		var weapon_slot_defer = Q.defer();
		weapon_slot_promises.push( weapon_slot_defer.promise );
		find_weapon_slot_and_resolve_promise( item, _weapon_slot, weapon_slot_defer );
	}

	all_weapon_slot_found_promise = Q.all( weapon_slot_promises );

	// Find all weapon types.

	var all_weapon_types_found_promise;

	var find_weapon_type_and_resolve_promise = function ( item, _weapon_type, weapon_type_defer )
	{
		model.WeaponType.find(
		{
			id: item.allowedWeapons[ _weapon_type ].type.id
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) weapon_type_defer.reject( err );
			else if ( docs.length < 1 ) weapon_type_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.allowedWeapons[ _weapon_type ].type = doc._id;
				weapon_type_defer.resolve();
			}
		} );
	};

	var weapon_type_promises = [];
	for ( var _weapon_type in item.allowedWeapons )
	{
		var weapon_type_defer = Q.defer();
		weapon_type_promises.push( weapon_type_defer.promise );
		find_weapon_type_and_resolve_promise( item, _weapon_type, weapon_type_defer );
	}

	all_weapon_types_found_promise = Q.all( weapon_type_promises );

	// Find all armor types.

	var all_armor_types_found_promise;

	var find_armor_type_and_resolve_promise = function ( item, _armor_type, armor_type_defer )
	{
		model.ArmorType.find(
		{
			id: item.allowedArmors[ _armor_type ].id
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) armor_type_defer.reject( err );
			else if ( docs.length < 1 ) armor_type_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.allowedArmors[ _armor_type ] = doc._id;
				armor_type_defer.resolve();
			}
		} );
	};

	var armor_type_promises = [];
	for ( var _armor_type in item.allowedArmors )
	{
		var armor_type_defer = Q.defer();
		armor_type_promises.push( armor_type_defer.promise );
		find_armor_type_and_resolve_promise( item, _armor_type, armor_type_defer );
	}

	all_armor_types_found_promise = Q.all( armor_type_promises );

	// Find everything.

	return Q.all( [ all_weapon_slots_found_promise, all_weapon_types_found_promise, all_armor_types_found_promise ] );
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
		description:
		{
			type: String
		},
		allowedWeapons:
		{
			type: [
			{
				slot:
				{
					type: require( 'mongoose' ).Schema.Types.ObjectId,
					ref: 'WeaponSlot'
				},
				type:
				{
					type: require( 'mongoose' ).Schema.Types.ObjectId,
					ref: 'WeaponType'
				}
			} ]
		},
		allowedArmors:
		{
			type: [
			{
				type: require( 'mongoose' ).Schema.Types.ObjectId,
				ref: 'ArmorType'
			} ]
		}
	},
	join: 'allowedArmors allowedWeapons.slot allowedWeapons.type',
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