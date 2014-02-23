// Dependencies.

var Q = require( 'q' );

// Initialization methods.

/**
 * Modifies given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {Character} item Basic Character object (just attributes, without methods).
 * @return {promise}        Promise about updating given object.
 */
function process_item( item )
{
	var model = require( './model.js' );

	// Find class.

	var class_found_defer = Q.defer();
	var class_found_promise = class_found_defer.promise;

	model.Class.find(
	{
		id: item.class.id
	},
	{
		id: 1
	}, function ( err, docs )
	{
		if ( err ) class_found_defer.reject( err );
		else if ( docs.length < 1 ) class_found_defer.reject( 404 );
		else
		{
			var doc = docs[ 0 ];
			item.class = doc._id;
			class_found_defer.resolve();
		}
	} );

	// Find all accessories.

	var all_accessories_found_promise;

	var find_accessory_and_resolve_promise = function ( item, _accessory, accessory_defer )
	{
		model.Accessory.find(
		{
			id: item.accessories[ _accessory ].id
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) accessory_defer.reject( err );
			else if ( docs.length < 1 ) accessory_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.accessories[ _accessory ] = doc._id;
				accessory_defer.resolve();
			}
		} );
	};

	var accessory_promises = [];
	for ( var _accessory in item.accessories )
	{
		var accessory_defer = Q.defer();
		accessory_promises.push( accessory_defer.promise );
		find_accessory_and_resolve_promise( item, _accessory, accessory_defer );
	}

	all_accessories_found_promise = Q.all( accessory_promises );

	// Find all weapon slots.

	var all_weapon_slots_found_promise;

	var find_weapon_slot_and_resolve_promise = function ( item, _weapon_slot, weapon_slot_defer )
	{
		model.WeaponSlot.find(
		{
			id: item.weapons[ _weapon_slot ].slot.id
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
				item.weapons[ _weapon_slot ].slot = doc._id;
				weapon_slot_defer.resolve();
			}
		} );
	};

	var weapon_slot_promises = [];
	for ( var _weapon_slot in item.weapons )
	{
		var weapon_slot_defer = Q.defer();
		weapon_slot_promises.push( weapon_slot_defer.promise );
		find_weapon_slot_and_resolve_promise( item, _weapon_slot, weapon_slot_defer );
	}

	all_weapon_slots_found_promise = Q.all( weapon_slot_promises );

	// Find all weapons.

	var all_weapons_found_promise;

	var find_weapon_and_resolve_promise = function ( item, _weapon, weapon_defer )
	{
		model.Weapon.find(
		{
			id: item.weapons[ _weapon ].weapon.id
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) weapon_defer.reject( err );
			else if ( docs.length < 1 ) weapon_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.weapons[ _weapon ].weapon = doc._id;
				weapon_defer.resolve();
			}
		} );
	};

	var weapon_promises = [];
	for ( var _weapon in item.weapons )
	{
		var weapon_defer = Q.defer();
		weapon_promises.push( weapon_defer.promise );
		find_weapon_and_resolve_promise( item, _weapon, weapon_defer );
	}

	all_weapons_found_promise = Q.all( weapon_promises );

	// Find armor.

	var armor_found_defer = Q.defer();
	var armor_found_promise = armor_found_defer.promise;

	model.ArmorPiece.find(
	{
		id: item.armor.id
	},
	{
		id: 1
	}, function ( err, docs )
	{
		if ( err ) armor_found_defer.reject( err );
		else if ( docs.length < 1 ) armor_found_defer.reject( 404 );
		else
		{
			var doc = docs[ 0 ];
			item.armor = doc._id;
			armor_found_defer.resolve();
		}
	} );

	// Find boots.

	var boots_found_defer = Q.defer();
	var boots_found_promise = boots_found_defer.promise;

	model.ArmorPiece.find(
	{
		id: item.boots.id
	},
	{
		id: 1
	}, function ( err, docs )
	{
		if ( err ) boots_found_defer.reject( err );
		else if ( docs.length < 1 ) boots_found_defer.reject( 404 );
		else
		{
			var doc = docs[ 0 ];
			item.boots = doc._id;
			boots_found_defer.resolve();
		}
	} );

	// Find helmet.

	var helmet_found_defer = Q.defer();
	var helmet_found_promise = helmet_found_defer.promise;

	model.ArmorPiece.find(
	{
		id: item.helmet.id
	},
	{
		id: 1
	}, function ( err, docs )
	{
		if ( err ) helmet_found_defer.reject( err );
		else if ( docs.length < 1 ) helmet_found_defer.reject( 404 );
		else
		{
			var doc = docs[ 0 ];
			item.helmet = doc._id;
			helmet_found_defer.resolve();
		}
	} );

	// Find gauntlets.

	var gauntlets_found_defer = Q.defer();
	var gauntlets_found_promise = gauntlets_found_defer.promise;

	model.ArmorPiece.find(
	{
		id: item.gauntlets.id
	},
	{
		id: 1
	}, function ( err, docs )
	{
		if ( err ) gauntlets_found_defer.reject( err );
		else if ( docs.length < 1 ) gauntlets_found_defer.reject( 404 );
		else
		{
			var doc = docs[ 0 ];
			item.gauntlets = doc._id;
			gauntlets_found_defer.resolve();
		}
	} );

	// Find everything.

	return Q.all( [ class_found_promise, all_accessories_found_promise, all_weapon_slots_found_promise, all_weapons_found_promise, armor_found_promise, boots_found_promise, helmet_found_promise, gauntlets_found_promise ] );
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
		},
		class:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'Class'
		},
		accessories:
		{
			type: [
			{

				type: require( 'mongoose' ).Schema.Types.ObjectId,
				ref: 'Accessory'
			} ]
		},
		weapons:
		{
			type: [
			{
				slot:
				{
					type: require( 'mongoose' ).Schema.Types.ObjectId,
					ref: 'WeaponSlot'
				},
				weapon:
				{
					type: require( 'mongoose' ).Schema.Types.ObjectId,
					ref: 'Weapon'
				}
			} ]
		},
		armor:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'ArmorPiece'
		},
		boots:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'ArmorPiece'
		},
		helmet:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'ArmorPiece'
		},
		gauntlets:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'ArmorPiece'
		}
	},
	join: 'class accessories weapons.weapon weapons.slot armor boots helmet gauntlets',
	phases: [
	{
		name: 'init',
		requirements: [ 'Class', 'Accessory', 'Weapon', 'ArmorPiece', 'WeaponSlot' ],
		callback: process_item
	} ],
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				if ( ret.class )
					ret.class = {
						id: ret.class.id,
						name: ret.class.name,
						description: ret.class.description,
					};

				if ( ret.armor )
					ret.armor = {
						id: ret.armor.id,
						name: ret.armor.name
					};

				if ( ret.helmet )
					ret.helmet = {
						id: ret.helmet.id,
						name: ret.helmet.name
					};

				if ( ret.boots )
					ret.boots = {
						id: ret.boots.id,
						name: ret.boots.name
					};

				if ( ret.gauntlets )
					ret.gauntlets = {
						id: ret.gauntlets.id,
						name: ret.gauntlets.name
					};

				if ( ret.weapons )
					for ( var _weapon in ret.weapons )
					{
						ret.weapons[ _weapon ].weapon = {
							id: ret.weapons[ _weapon ].weapon.id,
							name: ret.weapons[ _weapon ].weapon.name
						};
					}

				if ( ret.accessories )
					for ( var _acc in ret.accessories )
					{
						ret.accessories[ _acc ] = {
							id: ret.accessories[ _acc ].id,
							name: ret.accessories[ _acc ].name
						};
					}

				delete ret._id;
				delete ret.__v;
			}
		}
	}
};