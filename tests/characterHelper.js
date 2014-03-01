// Dependencies.

var Q = require( 'q' ),
	assert = require( 'assert' ),
	model = require( '../models/model.js' ),
	log = require( '../vendor/log.js' ),
	Constants = require( '../vendor/constants.js' ),
	config = require( '../config.js' ),
	Character = require( '../vendor/characterHelper.js' ),
	Mocks = require( './deps/mocks.js' );


describe( "Character helper tests", function ()
{
	var c;

	before( function ( done )
	{
		model.ready.then( function ()
		{
			model.Character.find(
			{
				id: Mocks.characters[ 0 ].id
			}, function ( err, docs )
			{
				assert.ifError( err );
				var promise = Character( docs[ 0 ] );
				promise.then( function ( _c )
				{
					c = _c;
					done();
				} ).fail( function ( err )
				{
					assert.fail( err );
				} ); // new Character

			} ); // model.Character.find
		} );
	} ); // before

	it( "Character should store all hierarchical information", function ( done )
	{
		var i, j;

		assert.notEqual( c, undefined );
		assert.notEqual( c.class, undefined );
		assert.notEqual( c.class.stats, undefined );
		for ( i in c.class.stats )
		{
			assert.notEqual( c.class.stats[ i ].value, undefined );
			assert.notEqual( c.class.stats[ i ].stat, undefined );
			assert.notEqual( c.class.stats[ i ].stat.id, undefined );
			assert.notEqual( c.class.stats[ i ].stat.name, undefined );
		}
		assert.notEqual( c.class.allowedWeapons, undefined );
		for ( i in c.allowedWeapons )
		{
			assert.notEqual( c.allowedWeapons[ i ].slot, undefined );
			assert.notEqual( c.allowedWeapons[ i ].slot.id, undefined );
			assert.notEqual( c.allowedWeapons[ i ].slot.type, undefined );
			assert.notEqual( c.allowedWeapons[ i ].type, undefined );
			assert.notEqual( c.allowedWeapons[ i ].type.id, undefined );
			assert.notEqual( c.allowedWeapons[ i ].type.name, undefined );
		}
		assert.notEqual( c.class.allowedArmors, undefined );
		for ( i in c.allowedArmors )
		{
			assert.notEqual( c.allowedArmors[ i ].slot, undefined );
			assert.notEqual( c.allowedArmors[ i ].slot.id, undefined );
			assert.notEqual( c.allowedArmors[ i ].slot.type, undefined );
			assert.notEqual( c.allowedArmors[ i ].type, undefined );
			assert.notEqual( c.allowedArmors[ i ].type.id, undefined );
			assert.notEqual( c.allowedArmors[ i ].type.name, undefined );
		}
		assert.notEqual( c.class.skills, undefined );
		for ( i in c.skills )
		{
			assert.notEqual( c.skills[ i ].id, undefined );
			assert.notEqual( c.skills[ i ].name, undefined );
			assert.notEqual( c.skills[ i ].definition, undefined );
			assert.notEqual( c.skills[ i ].passive, undefined );
		}
		assert.notEqual( c.weapons, undefined );
		for ( i in c.weapons )
		{
			assert.notEqual( c.weapons[ i ].slot, undefined );
			assert.notEqual( c.weapons[ i ].slot.id, undefined );
			assert.notEqual( c.weapons[ i ].slot.name, undefined );
			assert.notEqual( c.weapons[ i ].weapon, undefined );
			assert.notEqual( c.weapons[ i ].weapon.id, undefined );
			assert.notEqual( c.weapons[ i ].weapon.name, undefined );
			assert.notEqual( c.weapons[ i ].weapon.type.id, undefined );
			assert.notEqual( c.weapons[ i ].weapon.type.name, undefined );
			assert.notEqual( c.weapons[ i ].weapon.skills, undefined );
			for ( j in c.weapons[ i ].weapon.skills )
			{
				assert.notEqual( c.weapons[ i ].weapon.skills[ j ].probability, undefined );
				assert.notEqual( c.weapons[ i ].weapon.skills[ j ].skill, undefined );
				assert.notEqual( c.weapons[ i ].weapon.skills[ j ].skill.id, undefined );
				assert.notEqual( c.weapons[ i ].weapon.skills[ j ].skill.name, undefined );
				assert.notEqual( c.weapons[ i ].weapon.skills[ j ].skill.definition, undefined );
				assert.notEqual( c.weapons[ i ].weapon.skills[ j ].skill.passive, undefined );
			}
			for ( j in c.weapons[ i ].weapon.stats )
			{
				assert.notEqual( c.weapons[ i ].weapon.stats[ j ].value, undefined );
				assert.notEqual( c.weapons[ i ].weapon.stats[ j ].stat, undefined );
				assert.notEqual( c.weapons[ i ].weapon.stats[ j ].stat.id, undefined );
				assert.notEqual( c.weapons[ i ].weapon.stats[ j ].stat.name, undefined );
			}
		}
		for ( i in Constants.ARMOR_ELEMENTS )
		{
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].id, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].name, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].slot, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].slot.id, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].slot.name, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].type, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].type.id, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].type.name, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].type.phyFactor, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].type.magFactor, undefined );
			for ( j in c[ Constants.ARMOR_ELEMENTS[ i ] ].stats )
			{
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].stats[ j ].value, undefined );
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].stats[ j ].stat, undefined );
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].stats[ j ].stat.id, undefined );
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].stats[ j ].stat.name, undefined );
			}
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.id, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.name, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.type, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.type.id, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.type.name, undefined );
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.components, undefined );
			for ( j in c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.components )
			{
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.components[ j ], undefined );
			}
			assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.skills, undefined );
			for ( j in c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.skills )
			{
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.skills[ j ].amount, undefined );
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.skills[ j ].skill, undefined );
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.skills[ j ].skill.id, undefined );
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.skills[ j ].skill.name, undefined );
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.skills[ j ].skill.definition, undefined );
				assert.notEqual( c[ Constants.ARMOR_ELEMENTS[ i ] ].armorSet.skills[ j ].skill.passive, undefined );
			}
		}
		for ( i in c.accessories )
		{
			assert.notEqual( c.accessories[ i ].id, undefined );
			assert.notEqual( c.accessories[ i ].name, undefined );
			for ( j in c.accessories[ i ].skills )
			{
				assert.notEqual( c.accessories[ i ].skills[ j ].probability, undefined );
				assert.notEqual( c.accessories[ i ].skills[ j ].skill, undefined );
				assert.notEqual( c.accessories[ i ].skills[ j ].skill.id, undefined );
				assert.notEqual( c.accessories[ i ].skills[ j ].skill.name, undefined );
				assert.notEqual( c.accessories[ i ].skills[ j ].skill.definition, undefined );
				assert.notEqual( c.accessories[ i ].skills[ j ].skill.passive, undefined );
			}
		}

		assert.notEqual( c.hello, undefined );
		assert.notEqual( c.hello().length, 0 );

		done();

	} ); // it

} );