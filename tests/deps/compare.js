// Dependencies.

var assert = require( 'assert' );

/**
 * Asserts whether both skills are equal or not.
 * @param  {Skill} actual   Actual skill.
 * @param  {Skill} expected Expected skill.
 */
function same_skill( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
	assert.strictEqual( actual.passive, expected.passive );
}

/**
 * Asserts whether both skills are different or not.
 * @param  {Skill} actual   Actual skill.
 * @param  {Skill} expected Expected skill.
 */
function different_skill( actual, expected )
{
	assert.ok( !( actual.id === expected.id && actual.name === expected.name && actual.passive === expected.passive ) );
}

/**
 * Asserts whether both weapons are equal or not.
 * @param  {Weapon} actual   Actual weapon.
 * @param  {Weapon} expected Expected weapon.
 */
function same_weapon( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
	same_weapon_type( actual.type, expected.type );
	assert.strictEqual( actual.stats.length, expected.stats.length );
	for ( var i in actual.stats )
		same_valued_stat( actual.stats[ i ], expected.stats[ i ] );
	assert.strictEqual( actual.skills.length, expected.skills.length );
	for ( var j in actual.skills )
		same_valued_stat( actual.skills[ j ], expected.skills[ j ] );
}

/**
 * Asserts whether both weapons are different or not.
 * @param  {Weapon} actual   Actual weapon.
 * @param  {Weapon} expected Expected weapon.
 */
function different_weapon( actual, expected )
{
	assert.ok( !( actual.id === expected.id && actual.name === expected.name ) );
}


/**
 * Asserts whether both accessories are equal or not.
 * @param  {Accessory} actual   Actual accessory.
 * @param  {Accessory} expected Expected accessory.
 */
function same_accessory( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
	assert.strictEqual( actual.skills.length, expected.skills.length );
	for ( var j in actual.skills )
		same_valued_stat( actual.skills[ j ], expected.skills[ j ] );
}

/**
 * Asserts whether both accessories are different or not.
 * @param  {Accessory} actual   Actual accessory.
 * @param  {Accessory} expected Expected accessory.
 */
function different_accessory( actual, expected )
{
	assert.ok( !( actual.id === expected.id && actual.name === expected.name ) );
}

/**
 * Asserts whether both weapon types are equal or not.
 * @param  {WeaponType} actual   Actual weapon type.
 * @param  {WeaponType} expected Expected weapon type.
 */
function same_weapon_type( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
}

/**
 * Asserts whether both armor types are equal or not.
 * @param  {ArmorType} actual   Actual armor type.
 * @param  {ArmorType} expected Expected armor type.
 */
function same_armor_type( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
}

/**
 * Asserts whether both valued stats are equal or not.
 * @param  {ValuedStat} actual   Actual valued stat.
 * @param  {ValuedStat} expected Expected valued stat.
 */
function same_valued_stat( actual, expected )
{
	assert.strictEqual( actual.value, expected.value );
	assert.strictEqual( actual.name, expected.name );
	same_stat( actual, expected );
}

/**
 * Asserts whether both stats are equal or not.
 * @param  {Stat} actual   Actual valued.
 * @param  {Stat} expected Expected valued.
 */
function same_stat( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
}

/**
 * Asserts whether both skill probabilities are equal or not.
 * @param  {SkillProb} actual   Actual skill probability.
 * @param  {SkillProb} expected Expected skill probability.
 */
function same_skill_prob( actual, expected )
{
	assert.strictEqual( actual.probability, expected.probability );
	same_skill( actual, expected );
}

/**
 * Asserts whether both SkillAmount are equal or not.
 * @param  {SkillAmount} actual   Actual skill with a minimum amount of pieces required to be enabled.
 * @param  {SkillAmount} expected Expected skill with a minimum amount of pieces required to be enabled.
 */
function same_skill_amount( actual, expected )
{
	assert.strictEqual( actual.amount, expected.amount );
	same_skill( actual, expected );
}

/**
 * Asserts whether both basic armor sets are equal or not.
 * @param  {BasicArmorSet} actual   Actual basic armor set.
 * @param  {BasicArmorSet} expected Expected basic armor set.
 */
function same_basic_armor_set( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
}

/**
 * Asserts whether both basic armor pieces are equal or not.
 * @param  {BasicArmorPiece} actual   Actual basic armor piece.
 * @param  {BasicArmorPiece} expected Expected basic armor piece.
 */
function same_basic_armor_piece( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
}

/**
 * Asserts whether both armor slots are equal or not.
 * @param  {ArmorSlot} actual   Actual armor slot.
 * @param  {ArmorSlot} expected Expected armor slot.
 */
function same_armor_slot( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
}

/**
 * Asserts whether both weapon slots are equal or not.
 * @param  {WeaponSlot} actual   Actual weapon slot.
 * @param  {WeaponSlot} expected Expected weapon slot.
 */
function same_weapon_slot( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
}

/**
 * Asserts whether both armor pieces are equal or not.
 * @param  {ArmorPiece} actual   Actual armor piece.
 * @param  {ArmorPiece} expected Expected armor piece.
 */
function same_armor_piece( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
	assert.strictEqual( actual.stats.length, expected.stats.length );
	for ( var i in actual.stats )
		same_valued_stat( actual.stats[ i ], expected.stats[ i ] );
	same_armor_type( actual.type, expected.type );
	same_basic_armor_set( actual.armorSet, expected.armorSet );
	same_armor_slot( actual.slot, expected.slot );
}

/**
 * Asserts whether both armor pieces are different or not.
 * @param  {ArmorPiece} actual   Actual armor piece.
 * @param  {ArmorPiece} expected Expected armor piece.
 */
function different_armor_piece( actual, expected )
{
	assert.ok( !( actual.id === expected.id && actual.name === expected.name ) );
}

/**
 * Asserts whether both armor sets are equal or not.
 * @param  {ArmorSet} actual   Actual armor set.
 * @param  {ArmorSet} expected Expected armor set.
 */
function same_armor_set( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
	assert.strictEqual( actual.skills.length, expected.skills.length );
	for ( var i in actual.skills )
		same_skill_amount( actual.skills[ i ], expected.skills[ i ] );
	assert.strictEqual( actual.components.length, expected.components.length );
	for ( var j in actual.components )
		same_basic_armor_piece( actual.components[ j ], expected.components[ j ] );
	same_armor_type( actual.type, expected.type );
}

/**
 * Asserts whether both armor sets are different or not.
 * @param  {ArmorSet} actual   Actual armor set.
 * @param  {ArmorSet} expected Expected armor set.
 */
function different_armor_set( actual, expected )
{
	assert.ok( !( actual.id === expected.id && actual.name === expected.name ) );
}

/**
 * Asserts whether both classes are equal or not.
 * @param  {Class} actual   Actual class.
 * @param  {Class} expected Expected class.
 */
function same_class( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );
	assert.strictEqual( actual.description, expected.description );
	assert.strictEqual( actual.allowedArmors.length, expected.allowedArmors.length );
	for ( var i in actual.allowedArmors )
		same_armor_type( actual.allowedArmors[ i ], expected.allowedArmors[ i ] );
	assert.strictEqual( actual.allowedWeapons.length, expected.allowedWeapons.length );
	for ( var j in actual.allowedWeapons )
	{
		same_weapon_slot( actual.allowedWeapons[ j ].slot, expected.allowedWeapons[ j ].slot );
		same_weapon_type( actual.allowedWeapons[ j ].type, expected.allowedWeapons[ j ].type );
	}
	assert.strictEqual( actual.skills.length, expected.skills.length );
	for ( var i in actual.skills )
		same_skill( actual.skills[ i ], expected.skills[ i ] );
}

/**
 * Asserts whether both classes are different or not.
 * @param  {Class} actual   Actual class.
 * @param  {Class} expected Expected class.
 */
function different_class( actual, expected )
{
	assert.ok( !( actual.id === expected.id && actual.name === expected.name && actual.description === expected.description ) );
}

/**
 * Asserts whether both characters are equal or not.
 * @param  {Character} actual   Actual character.
 * @param  {Character} expected Expected character.
 */
function same_character( actual, expected )
{
	assert.strictEqual( actual.id, expected.id );
	assert.strictEqual( actual.name, expected.name );

	assert.strictEqual( actual.class.id, expected.class.id );
	assert.strictEqual( actual.class.name, expected.class.name );
	assert.strictEqual( actual.class.description, expected.class.description );

	assert.strictEqual( actual.weapons.length, expected.weapons.length );
	for ( var i in actual.weapons )
	{
		same_weapon_slot( actual.weapons[ i ].slot, expected.weapons[ i ].slot );
		assert.strictEqual( actual.weapons[ i ].weapon.id, expected.weapons[ i ].weapon.id );
		assert.strictEqual( actual.weapons[ i ].weapon.name, expected.weapons[ i ].weapon.name );
	}

	assert.strictEqual( actual.accessories.length, expected.accessories.length );
	for ( var j in actual.accessories )
	{
		assert.strictEqual( actual.accessories[ j ].id, expected.accessories[ j ].id );
		assert.strictEqual( actual.accessories[ j ].name, expected.accessories[ j ].name );
	}

	assert.strictEqual( actual.armor.id, expected.armor.id );
	assert.strictEqual( actual.armor.name, expected.armor.name );
	assert.strictEqual( actual.boots.id, expected.boots.id );
	assert.strictEqual( actual.boots.name, expected.boots.name );
	assert.strictEqual( actual.helmet.id, expected.helmet.id );
	assert.strictEqual( actual.helmet.name, expected.helmet.name );
	assert.strictEqual( actual.gauntlets.id, expected.gauntlets.id );
	assert.strictEqual( actual.gauntlets.name, expected.gauntlets.name );
}

/**
 * Asserts whether both characters are different or not.
 * @param  {Character} actual   Actual character.
 * @param  {Character} expected Expected character.
 */
function different_character( actual, expected )
{
	assert.ok( !( actual.id === expected.id ) );
}

/**
 * Asserts whether both teams are equal or not.
 * @param  {Team} actual   Actual team.
 * @param  {Team} expected Expected team.
 */
function same_team( actual, expected )
{
	assert.strictEqual( actual.length, expected.length );
	for ( var i in actual )
	{
		assert.strictEqual( actual[ i ].id, expected[ i ].id );
		assert.strictEqual( actual[ i ].name, expected[ i ].name );
	}
}

/**
 * Asserts whether both teams are different or not.
 * @param  {Team} actual   Actual team.
 * @param  {Team} expected Expected team.
 */
function different_team( actual, expected )
{
	if ( actual.length === expected.length )
		for ( var i in actual )
		{
			different_character( actual[ i ], expected[ i ] );
		}
	else
		assert.ok( !( actual.length === expected.length ) );
}

module.exports = {
	sameSkill: same_skill,
	differentSkill: different_skill,
	sameWeapon: same_weapon,
	differentWeapon: different_weapon,
	sameArmorPiece: same_armor_piece,
	differentArmorPiece: different_armor_piece,
	sameArmorSet: same_armor_set,
	differentArmorSet: different_armor_set,
	sameClass: same_class,
	differentClass: different_class,
	sameAccessory: same_accessory,
	differentAccessory: different_accessory,
	sameCharacter: same_character,
	differentCharacter: different_character,
	sameTeam: same_team,
	differentTeam: different_team
};