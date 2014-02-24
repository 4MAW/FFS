var Q = require( 'q' ),
	model = require( '../models/model.js' ); // Model will be ready as it is loaded and waited in app.js.

function load_character_stats( character )
{
	var schema_prepared = Q.defer();
	var class_found = Q.defer();
	var weapon_promises = [];
	var weapons_found;
	var equipment_promises = [];
	var equipment_found;

	character.alive = true;
	character.stats = [];

	// Load list of stats.

	model.Stats.find(
	{}, function ( err, docs )
	{
		if ( err )
			schema_prepared.reject( err );
		else
		{
			for ( var _d in docs )
				character.stats[ docs[ _d ].id ] = 0;
			schema_prepared.resolve();
		}
	} );

	// Load class.

	schema_prepared.then( function ()
	{
		model.Class.find(
		{
			id: character.class.id
		} ).populate( model.Class.join ).exec( function ( err, docs )
		{
			if ( err || docs.length < 1 )
				class_found.reject( err );
			else
			{
				var klass = docs[ 0 ];
				for ( var _d in klass )
					schema_prepared[ klass[ _d ].stat.id ] += klass[ _d ].value;
				class_found.resolve();
			}
		} );
	} ).fail( class_found.reject );

	// Load weapons.

	var find_weapon_and_resolve_defer = function ( w, d )
	{
		model.Weapon.find(
		{
			id: character.weapons[ w ].id
		} ).populate( model.Weapon.join ).exec( function ( err, docs )
		{
			if ( err || docs.length !== 1 )
				d.reject( err );
			else
			{
				for ( var _s in docs[ 0 ].stats )
					character.stats[ docs[ 0 ].stats[ _s ].stat.id ] += docs[ 0 ].stats[ _s ].value;
				d.resolve();
			}
		} );
	};

	schema_prepared.then( function ()
	{
		for ( var w in character.weapons )
		{
			var d = Q.defer();
			weapon_promises.push( d );
			find_weapon_and_resolve_defer( w, d );
		}
	} );

	Q.all( weapon_promises ).then( weapons_found.resolve ).fail( weapons_found.reject );

	// Load equipment.

	var equipment = [ 'armor', 'boots', 'helmet', 'gauntlets', 'accessories' ];

	var find_equipment_and_resolve_defer = function ( e, d )
	{
		model.ArmorPiece.find(
		{
			id: character[ equipment[ e ] ].id
		} ).populate( model.ArmorPiece.join ).exec( function ( err, docs )
		{
			if ( err || docs.length !== 1 )
				d.reject( err );
			else
			{
				for ( var _s in docs[ 0 ].stats )
					character.stats[ docs[ 0 ].stats[ _s ].stat.id ] += docs[ 0 ].stats[ _s ].value;
				d.resolve();
			}
		} );
	};

	schema_prepared.then( function ()
	{
		for ( var e in equipment )
		{
			var d = Q.defer();
			equipment_promises.push( d );
			find_equipment_and_resolve_defer( e, d );
		}
	} );

	Q.all( equipment_promises ).then( equipment_found.resolve ).fail( equipment_found.reject );

	// Load everything.

	return Q.all( [ class_found, weapons_found, equipment_found ] );
}

function load_characters_stats( characters )
{
	var character_promises = [];
	for ( var _c in characters )
		character_promises.push( load_character_stats( characters ) );
	return Q.all( character_promises );
}

module.exports = {
	loadCharacterStats: load_character_stats,
	loadCharactersStats: load_characters_stats
};