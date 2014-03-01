// Dependencies.

var Q = require( 'q' );
var model = require( '../models/model.js' );
var Constants = require( './constants.js' );

// Instance methods.

var hello = function ()
{
	return "Hello, my name's " + this.name;
};

var skillList = function()
{
	return this.class.skills;
};

var stats = function()
{
	var returnStats = this.class.stats;
	for(var weap in this.weapons){
		this.class.stats[0].value+=this.weapons[weap].stats.value;
	}
	for(var piece in Constants.ARMOR_ELEMENTS){
		this.class.stats[1].value+=this[Constants.ARMOR_ELEMENTS[piece]].stats.value;
	}
};

var alterStat = function(){}

var newStatus = function(skillDef, round){
	var rand = (Math.random() < 0.5) ? -1: 1;

	if(this.status[skillDef.id] - round.currentRound() < skillDef.duration+rand)
		this.status[skillDef.id] = [{skillDef.id,skillDef.duration+rand}];
}

var performAction = function(skillDef){
	for(var i in skillDef.blockedBy){
		if(this.status[skillDef.blockedBy[i]].length == 1)
			return false;
	}
	return true;
}

var getPasives = function(){}

var doSkill = function(){}

var clientObject = function(){}

// Add here any instance method you want to make public.
// Key: public name.
// Value: function to be called.
var INSTANCE_METHODS = {
	"hello": hello,
	"skillList": skillList,
	"stats": stats,
	"alterStat": alterStat,
	"performAction": performAction,
	"getPasives": getPasives,
	"doSkill": doSkill,
	"clientObject": clientObject
};

// Constructor.

module.exports = function ( db_source )
{
	var defer = Q.defer();

	// Promises about having loaded references.
	var class_loaded = Q.defer();
	var weapons_loaded; // This defer will be redefined as a Q.all.
	var armors_loaded; // This defer will be redefined as a Q.all.
	var accessories_loaded; // This defer will be redefined as a Q.all.

	var source = JSON.parse( JSON.stringify( db_source ) );

	var character = {};

	for ( var i in source )
		character[ i ] = source[ i ];

	// Load references.
	model.ready.then( function ()
	{
		// Load class.
		model.Class.find(
		{
			_id: db_source.class
		} ).populate( model.Class.join ).exec( function ( err, docs )
		{
			if ( err ) class_loaded.reject( err );
			else if ( docs.length === 0 ) class_loaded.reject( Constants.ERROR_CLASS_NOT_FOUND );
			else
			{
				character.class = docs[ 0 ];
				class_loaded.resolve();
			}
		} );

		// Load weapons.
		var weapon_loaded_promises = [];

		var assign_weapon = function ( i )
		{
			var _dw = Q.defer();
			var _ds = Q.defer();

			model.Weapon.find(
			{
				_id: db_source.weapons[ i ].weapon
			} ).populate( model.Weapon.join ).exec( function ( err, docs )
			{
				if ( err ) _dw.reject( err );
				else if ( docs.length === 0 ) _dw.reject( Constants.ERROR_WEAPON_NOT_FOUND );
				else
				{
					character.weapons[ i ].weapon = JSON.parse( JSON.stringify( docs[ 0 ] ) );
					for ( var j in character.weapons[ i ].weapon.skills )
						character.weapons[ i ].weapon.skills[ j ].skill.definition = docs[ 0 ].skills[ j ].skill.definition;
					_dw.resolve();
				}
			} );

			model.WeaponSlot.find(
			{
				_id: db_source.weapons[ i ].slot
			} ).populate( model.WeaponSlot.join ).exec( function ( err, docs )
			{
				if ( err ) _ds.reject( err );
				else if ( docs.length === 0 ) _ds.reject( Constants.ERROR_WEAPON_NOT_FOUND );
				else
				{
					character.weapons[ i ].slot = docs[ 0 ];
					_ds.resolve();
				}
			} );

			return Q.all( [ _dw.promise, _ds.promise ] );
		};

		for ( var i = 0; i < db_source.weapons.length; i++ ) // Use traditional for because database objects have hidden attributes that affect foreach loops.
			weapon_loaded_promises.push( assign_weapon( i ) );

		weapons_loaded = Q.all( weapon_loaded_promises );

		// Armors.
		armor_loaded_promises = [];

		var assign_armor = function ( element )
		{
			var _d = Q.defer();

			model.ArmorPiece.find(
			{
				_id: db_source[ element ]
			} ).populate( model.ArmorPiece.join ).exec( function ( err, docs )
			{
				if ( err ) _d.reject( err );
				else if ( docs.length === 0 ) _d.reject( Constants.ERROR_ARMOR_PIECE_NOT_FOUND );
				else
				{
					character[ element ] = JSON.parse( JSON.stringify( docs[ 0 ] ) );

					var _dat = Q.defer();
					var _das = Q.defer();

					model.ArmorType.find(
					{
						_id: docs[ 0 ].type._id
					} ).populate( model.ArmorType.join ).exec( function ( err, docs )
					{
						if ( err ) _dat.reject( err );
						else if ( docs.length === 0 ) _dat.reject( Constants.ERROR_ARMOR_TYPE_NOT_FOUND );
						else
						{
							character[ element ].type.phyFactor = docs[ 0 ].phyFactor;
							character[ element ].type.magFactor = docs[ 0 ].magFactor;
							_dat.resolve();
						}
					} );

					model.ArmorSet.find(
					{
						id: docs[ 0 ].armorSet.id
					} ).populate( model.ArmorSet.join ).exec( function ( err, docs )
					{
						if ( err ) _das.reject( err );
						else if ( docs.length === 0 ) _das.reject( Constants.ERROR_ARMOR_SET_NOT_FOUND );
						else
						{
							character[ element ].armorSet = JSON.parse( JSON.stringify( docs[ 0 ] ) );
							for ( var i in character[ element ].armorSet.components )
								character[ element ].armorSet.components[ i ] = character[ element ].armorSet.components[ i ].id;
							for ( var j in character[ element ].armorSet.skills )
								character[ element ].armorSet.skills[ j ].skill.definition = docs[ 0 ].skills[ j ].skill.definition;
							_das.resolve();
						}
					} );

					Q.all( [ _dat.promise, _das.promise ] ).then( _d.resolve ).fail( _d.reject );
				}
			} );

			return _d.promise;
		};

		for ( i in Constants.ARMOR_ELEMENTS )
			armor_loaded_promises.push( assign_armor( Constants.ARMOR_ELEMENTS[ i ] ) );

		armors_loaded = Q.all( armor_loaded_promises );

		// Load accessories.
		var accessory_loaded_promises = [];

		var assign_accessory = function ( i )
		{
			var _d = Q.defer();

			model.Accessory.find(
			{
				_id: db_source.accessories[ i ]
			} ).populate( model.Accessory.join ).exec( function ( err, docs )
			{
				if ( err ) _d.reject( err );
				else if ( docs.length === 0 ) _d.reject( Constants.ERROR_ACCESSORY_NOT_FOUND );
				else
				{
					character.accessories[ i ] = JSON.parse( JSON.stringify( docs[ 0 ] ) );
					for ( var j in character.accessories[ i ].skills )
						character.accessories[ i ].skills[ j ].skill.definition = docs[ 0 ].skills[ j ].skill.definition;
					_d.resolve();
				}
			} );

			return _d.promise;
		};

		for ( i = 0; i < db_source.accessories.length; i++ ) // Use traditional for because database objects have hidden attributes that affect foreach loops.
			accessory_loaded_promises.push( assign_accessory( i ) );

		accessories_loaded = Q.all( accessory_loaded_promises );

		// Check references are loaded.

		Q.all( [ class_loaded.promise, weapons_loaded, armors_loaded, accessories_loaded ] ).then( function ()
		{

			character = JSON.parse( JSON.stringify( character ) ); // Transform character to a standard Javascript object.
			character.status = {};

			model.Status.find(
					{
						
					} ).exec( function ( err, docs )
					{
						if ( err ) _das.reject( err );
						else
						{
							for( var i = 0, i<status.length,i++)
								character.status[docs[i].id] = [];
						}
					} );
			// Here we will assign methods to the character.
			for ( var j in INSTANCE_METHODS )
				character[ j ] = INSTANCE_METHODS[ j ];

			defer.resolve( character );
		} ).fail( defer.reject );

	} );

	return defer.promise;
};