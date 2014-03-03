// Dependencies.

var Q = require( 'q' ),
	model = require( '../models/model.js' ),
	Constants = require( './constants.js' ),
	Round = require( './roundAPI.js' ),
	Statistics = require( './statistics.js' ),
	Change = require( './change.js' );

// Instance methods.

/**
 * Returns the list of skills this character can use actively.
 * @return {Array} List of active skills of this character.
 */
var skillList = function ()
{
	// Maybe a weapon could offer a new active skill...
	return this.class.skills;
};

/**
 * Returns an array of final stats, including any modification from boons and equipment.
 * @return {Object} Object where each key is an stat ID and the value is the value for that stat.
 */
var stats = function ()
{
	var returnStats = JSON.parse( JSON.stringify( this.class.stats ) ); // We don't want to alter base stats.

	var stat, stat_id, stat_value; // To prevent redefining these variables in each loop.

	for ( var weap in this.weapons )
	{
		for ( stat in this.weapons[ weap ].stats )
		{
			stat_id = this.weapons[ weap ].stats[ stat ].stat.id;
			stat_value = this.weapons[ weap ].stats[ stat ].value;
			returnStats[ stat_id ] += stat_value;
		}
	}

	for ( var piece in Constants.ARMOR_ELEMENTS )
	{
		for ( stat in this[ Constants.ARMOR_ELEMENTS[ piece ] ].stats )
		{
			stat_id = this[ Constants.ARMOR_ELEMENTS[ piece ] ].stats[ stat ].stat.id;
			stat_value = this[ Constants.ARMOR_ELEMENTS[ piece ] ].stats[ stat ].value;
			returnStats[ stat_id ] += stat_value;
		}
	}

	return returnStats;
};

/**
 * Returns whether this character is alive or not.
 * @return {boolean} Whether this character is alive or not.
 */
var alive = function ()
{
	return ( this.stats()[ Constants.HEALTH_STAT_ID ] > 0 );
};

var alterStat = function () {};

/**
 * Returns whether this character is affected by given altered status or not.
 * @param  {Array[string]}  statuses Array of altered status to be checked.
 * @return {boolean}                 Whether this character is affected by ANY of given status.
 */
var has_status = function ( statuses )
{
	for ( var s in statuses )
		if ( this.altered_statuses[ statuses[ s ] ] !== undefined )
			return true;
	return false;
};

/**
 * Returns whether this character is affected by given altered status or not.
 * @param  {Array[string]}  statuses Array of altered status to be checked.
 * @return {boolean}                 Whether this character is affected by ALL given status.
 */
var has_all_status = function ( statuses )
{
	var affected = true;
	for ( var s in statuses )
		affected = affected && ( this.altered_statuses[ statuses[ s ] ] !== undefined );
	return affected;
};


/**
 * Sets altered status if priority is bigger than current reason's priority.
 * @param {Array[string]}   statuses Array of altered status to set.
 * @param {SkillDefinition} skill    Definition of skill that is setting these statuses.
 * @param {integer|boolean} priority Priority of new skill affecting given status.
 *                                   The bigger the more priority it has. A value of true means maximuim priority.
 * @return {Array[boolean]}          Whether each status was affected by given skill or not.
 */
var set_status = function ( statuses, skill, priority )
{
	var affected = [];
	var changes = [];

	for ( var s in statuses )
	{
		var status = statuses[ s ];
		// If status was not altered or the priority is lower than the new one's...
		if ( this.altered_statuses[ status ] === undefined || this.altered_statuses[ status ].priority <= priority )
		{
			if ( this.altered_statuses[ status ] !== undefined )
				this.altered_statuses[ status ].skill.cancel( [ status ] );

			this.altered_statuses[ status ] = {
				skill: skill,
				priority: priority
			};
			affected[ s ] = true;

			Statistics.increaseStatistic( Constants.STATISTIC_TIMES_STATUS_ALTERED_PREFIX + status, 1 );

			// Create change representation.
			var c = new Change( this, "status", status, "+" );
			changes.push( c );
		}
	}
	// Notify round.
	Round.notifyChanges( changes, skill );

	return affected;
};

/**
 * Unsets given altered status if and only if given skill skill is the one responsible for the altered status
 * or priority is true.
 *
 * This also calls cancel() method of skills removed.
 *
 * @param  {Array[string]}   statuses Altered statuses to remove.
 * @param  {SkillDefinition} skill    Definition os skill that is the reason to remove the statuses.
 * @param  {boolean}         override Whether this skill should ignore priorities or not.
 */
var unset_status = function ( statuses, skill, override )
{
	var changes = [];
	for ( var s in statuses )
	{
		var status = statuses[ s ];
		// If status was not altered or the priority is lower than the new one's...
		if ( this.altered_statuses[ status ] !== undefined )
			if ( override || this.altered_statuses[ status ].skill === skill )
			{
				// Create change representation.
				var c = new Change( this, "status", status, "-" );
				changes.push( c );

				Statistics.increaseStatistic( Constants.STATISTIC_TIMES_HEALED_STATUS_ALTERED_PREFIX + status, 1 );

				// Actually change status.
				this.altered_statuses[ status ].skill.cancel( statuses );
				delete this.altered_statuses[ status ];
			}
	}
	// This SHOULD NOT HAPPEN in deployment, but it happens in testing.
	if ( skill !== null )
	{
		// Notify round.
		Round.notifyChanges( changes, skill );
	}
};

// Similar to set_status but changing character's class.
var change_class = function () {};

/**
 * Damages the player given the amount of damage, the type and the element of the hit.
 * @param  {integer}     amount  Base amount of health points to decrease.
 * @param  {integer}     margin  Margin where the damage will be located.
 * @param  {CalledSkill} skill Skill that performes this damage.
 */
var damage = function ( amount, margin, skill )
{
	// @TODO Take into account the type of damage and the element.
	var type = skill.type;
	var element = skill.element;
	// Compute a random damage in range amount±margin.
	// To perform a fixed damage just pass margin=0 when calling this method.
	var actual_damage = Math.max( Math.round( amount + margin * ( Math.random() * 2 - 1 ) ), 0 ); // Damage can't be negative!
	actual_damage = Math.min( this.class.stats[ Constants.HEALTH_STAT_ID ], actual_damage ); // Don't do more damage than player can stand.
	this.class.stats[ Constants.HEALTH_STAT_ID ] -= actual_damage;

	Statistics.increaseStatistic( Constants.STATISTIC_DAMAGE_DEALED, actual_damage );

	Statistics.increaseStatistic( Constants.STATISTIC_DAMAGE_BY_SKILL_PREFIX + skill.id, actual_damage );

	if ( skill.type === Constants.PHYSICAL )
		Statistics.increaseStatistic( Constants.STATISTIC_PHYSICAL_DAMAGE_DEALED, actual_damage );
	else
		Statistics.increaseStatistic( Constants.STATISTIC_MAGICAL_DAMAGE_DEALED, actual_damage );

	if ( this.class.stats[ Constants.HEALTH_STAT_ID ] === 0 && actual_damage > 0 )
		Statistics.increaseStatistic( Constants.STATISTIC_CHARACTERS_DIE, 1 );

	// Get change object.
	var c = new Change( this, "stat", Constants.HEALTH_STAT_ID, "-" + actual_damage );
	// Notify round.
	Round.notifyChanges( [ c ], skill );

	return actual_damage;
};


/* renamed to setStatus, but this is left as it has an implementation including semi-immunity.
var newStatus = function ( skillDef, round )
{
	// Probability of applying a status should be part of the skill.
	// For instance: Pokémon's Toxic has 100% of probability but
	// Poison Fang only 50%.
	// var rand = (Math.random() < 0.5) ? -1: 1;

	if ( this.status[ skillDef.id ] - round.currentRound() < skillDef.duration )
		this.status[ skillDef.id ] = [
		{
			skillDef.id, skillDef.duration + rand
		} ];
}
*/

/**
 * Returns whether a skill can be performed by this player or not (due to altered status).
 * @param  {SkillDefinition} skill Skill to be checked.
 * @return {boolean}               Whether this character can perform this skill or not.
 */
var can_perform_action = function ( skill )
{
	return this.alive() && !this.hasStatus( skill.blockedBy );
};

var getPasives = function () {};

var doSkill = function () {};

var clientObject = function () {};

/**
 * Returns a JSON version of this Character.
 * @return {string} JSON representation of this Character.
 */
var toJSON = function ()
{
	ret = {};
	for ( var i in this )
		if ( typeof this[ i ] !== 'function' )
			ret[ i ] = this[ i ];
	delete ret.altered_statuses;
	ret.stats = this.stats();
	ret.alive = this.alive();
	return ret;
};

// Add here any instance method you want to make public.
// Key: public name.
// Value: function to be called.
var INSTANCE_METHODS = {
	toJSON: toJSON,
	skillList: skillList,
	stats: stats,
	alterStat: alterStat,
	getPasives: getPasives,
	doSkill: doSkill,
	clientObject: clientObject,
	// API
	canPerformAction: can_perform_action,
	damage: damage,
	hasStatus: has_status,
	hasAllStatus: has_all_status,
	setStatus: set_status,
	unsetStatus: unset_status,
	alive: alive
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
				character.class = JSON.parse( JSON.stringify( docs[ 0 ] ) );
				var stats = {};
				for ( var i in character.class.stats )
				{
					var pair = character.class.stats[ i ];
					stats[ pair.stat.id ] = pair.value;
				}
				character.class.stats = stats;
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

			// Data structures.

			character.altered_statuses = {};

			// Here we will assign methods to the character.
			for ( var j in INSTANCE_METHODS )
				character[ j ] = INSTANCE_METHODS[ j ];

			defer.resolve( character );
		} ).fail( defer.reject );

	} );

	return defer.promise;
};