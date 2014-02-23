// Dependencies.

var Q = require( 'q' );

// Initialization methods.

/**
 * Modified given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {ArmorPiece} item  Basic ArmorPiece object (just attributes, without methods).
 * @return {promise}          Promise about updating given object.
 */
function process_item( item )
{
	var defer = Q.defer();

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

	// Find armor slot.

	var slot_found_defer = Q.defer();
	var slot_found_promise = slot_found_defer.promise;

	model.ArmorSlot.find(
	{
		id: item.slot.id
	},
	{
		id: 1
	}, function ( err, docs )
	{
		if ( err ) slot_found_defer.reject( err );
		else if ( docs.length < 1 ) slot_found_defer.reject( 404 );
		else
		{
			var doc = docs[ 0 ];
			item.slot = doc._id;
			slot_found_defer.resolve();
		}
	} );

	// Find all stats.

	var all_stats_found_promise;

	var find_stat_and_resolve_promise = function ( item, _stat, stat_defer )
	{
		model.Stat.find(
		{
			id: item.stats[  _stat ].stat.id
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

	// Find everything.

	Q.all( [ type_found_promise, slot_found_promise, all_stats_found_promise ] ).then( function ()
	{
		var itemCopy = JSON.parse( JSON.stringify( item ) );
		itemCopy.armorSet = undefined;
		var modelItem = new model.ArmorPiece( itemCopy );
		modelItem.save( function ( err )
		{
			defer.resolve();
		} );
	} );

	return defer.promise;
}

/**
 * Returns a promise about updating the Armor Set of given item.
 * @param {ArmorPiece} item Item to be updated.
 * @return {promise}        Promise about updating the Armor Set of given ArmorPiece.
 */
function update_set( item )
{
	var model = require( './model.js' );

	var set_found_defer = Q.defer();
	var set_found_promise = set_found_defer.promise;

	// First of all we retrieve the real object from Database.
	model.ArmorPiece.find(
	{
		id: item.id
	}, function ( err, docs )
	{
		if ( err ) set_found_defer.reject( err );
		else if ( docs.length < 1 ) set_found_defer.reject( 404 );
		else
		{
			var dbItem = docs[ 0 ];
			// Then we query the ArmorSet.
			model.ArmorSet.find(
			{
				id: item.armorSet.id
			},
			{
				id: 1
			}, function ( err, docs )
			{
				if ( err ) set_found_defer.reject( err );
				else if ( docs.length < 1 ) set_found_defer.reject( 404 );
				else
				{
					var doc = docs[ 0 ];
					item.armorSet = doc._id;
					dbItem.armorSet = doc._id;
					// Finally we update the real item.
					dbItem.save( function ( err )
					{
						if ( err )
							set_found_defer.reject( err );
						else
							set_found_defer.resolve();
					} );
				}
			} );
		}
	} );

	return set_found_promise;
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
		slot:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'ArmorSlot'
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
		armorSet:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'ArmorSet'
		}
	},
	join: 'type slot stats.stat armorSet',
	manualSeeding: true, // This attribute disables automatic insertion when seeding, assuming one of the processing phases will take care of that.
	phases: [
	{
		name: 'init',
		requirements: [ 'Stat', 'ArmorType', 'ArmorSlot' ],
		callback: process_item
	},
	{
		name: 'set_armorSet',
		requirements: [ 'ArmorSet' ],
		callback: update_set
	} ],
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				if ( ret.armorSet )
				{
					delete ret.armorSet.components;
					delete ret.armorSet.skills;
					delete ret.armorSet.type;
				}
				delete ret._id;
				delete ret.__v;
			}
		}
	}
};