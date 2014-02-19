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
	same_type( actual.type, expected.type );
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
 * Asserts whether both weapon types are equal or not.
 * @param  {WeaponType} actual   Actual weapon type.
 * @param  {WeaponType} expected Expected weapon type.
 */
function same_type( actual, expected )
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

module.exports = {
	sameSkill: same_skill,
	differentSkill: different_skill,
	sameWeapon: same_weapon,
	differentWeapon: different_weapon
};