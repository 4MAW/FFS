var Q = require( 'q' ),
	model = require( '../models/model.js' ); // Model will be ready as it is loaded and waited in app.js.

function load_character_stats( character )
{
	var defer = Q.defer();
	var schema_prepared = Q.defer();
	var class_found = Q.defer();
	var weapon_promises = [];
	var weapons_found = Q.defer();
	var equipment_promises = [];
	var equipment_found = Q.defer();

	var c;

	// Load list of stats.
	model.Stat.find(
	{}, function ( err, stats )
	{
		if ( err )
			schema_prepared.reject( err );
		else
		{
			model.Character.find(
			{
				id: character.id
			} ).populate( model.Character.join ).exec( function ( err, docs )
			{
				if ( err || docs.length !== 1 ) schema_prepared.reject( err );
				else
				{
					c = JSON.parse( JSON.stringify( docs[ 0 ] ) );
					c.alive = true;
					c.stats = {};
					for ( var _d in stats )
						c.stats[ '' + stats[ _d ].id ] = 0;
					schema_prepared.resolve( c );
				}
			} );
		}
	} );

	// Load class.

	schema_prepared.promise.then( function ( character )
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
				for ( var _d = 0; _d < klass.stats.length; _d++ )
					character.stats[ klass.stats[ _d ].stat.id ] += klass.stats[ _d ].value;
				class_found.resolve();
			}
		} );
	} ).fail( class_found.reject );

	// Load weapons.

	var find_weapon_and_resolve_defer = function ( w, d )
	{
		model.Weapon.find(
		{
			id: character.weapons[ w ].weapon.id
		} ).populate( model.Weapon.join ).exec( function ( err, docs )
		{
			if ( err || docs.length !== 1 )
				d.reject( err );
			else
			{
				for ( var _s in docs[ 0 ].stats )
					c.stats[ docs[ 0 ].stats[ _s ].stat.id ] += docs[ 0 ].stats[ _s ].value;
				d.resolve();
			}
		} );
	};

	schema_prepared.promise.then( function ( character )
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
					c.stats[ docs[ 0 ].stats[ _s ].stat.id ] += docs[ 0 ].stats[ _s ].value;
				d.resolve();
			}
		} );
	};

	schema_prepared.promise.then( function ( character )
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

	Q.all( [ class_found.promise, weapons_found.promise, equipment_found.promise ] ).then( function ()
	{
		defer.resolve( c );
	} ).fail( defer.reject );

	return defer.promise;
}

function load_characters_stats( characters )
{
	var defer = Q.defer();
	var character_promises = [];
	var assign_character = function ( _c )
	{
		return function ( character )
		{
			characters[ _c ] = character;
		};
	};
	for ( var _c = 0; _c < characters.length; _c++ )
		character_promises.push( load_character_stats( characters[ _c ] ).then( assign_character( _c ) ) );
	Q.all( character_promises ).then( function ()
	{
		var c = JSON.parse( JSON.stringify( characters ) );
		defer.resolve( c );
	} ).fail( defer.reject );
	return defer.promise;
}

module.exports = {
	loadCharacterStats: load_character_stats,
	loadCharactersStats: load_characters_stats
};