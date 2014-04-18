/**
 * This class features a Character, with methods to deal damage, alter
 * statistics, get skills, etc.
 *
 * @class CharacterHelper
 */

// Dependencies.

var Q = require( 'q' ),
	log = require( './log.js' ),
	model = require( '../models/model.js' ),
	Constants = require( './constants.js' ),
	Round = require( './roundAPI.js' ),
	Statistics = require( './statistics.js' ),
	Change = require( './change.js' );

// Instance methods.

/**
 * Returns the list of skills this character can use actively.
 *
 * @method skills
 * @public
 *
 * @return {Array} List of active skills of this character.
 */
var get_skills = function () {
	var returnSkills = [];

	for ( var weap in this.weapons )
		for ( var sk in this.weapons[ weap ].skills )
			if ( !this.weapons[ weap ].skills[ sk ].passive )
				returnSkills.push( this.weapons[ weap ].skills[ sk ] );

	for ( var acc in this.accessories )
		for ( var ask in this.accessories[ acc ].skills )
			if ( !this.accessories[ acc ].skills[ ask ].passive )
				returnSkills.push( this.accessories[ acc ].skills[ ask ] );

	for ( var i in this.class.skills )
		if ( !this.class.skills[ i ].passive )
			returnSkills.push( this.class.skills[ i ] );

	var sets = {};
	for ( var piece in Constants.ARMOR_ELEMENTS ) {
		if ( sets[ Constants.ARMOR_ELEMENTS[ piece ] ] === undefined )
			sets[ this[ Constants.ARMOR_ELEMENTS[ piece ] ].armorSet.id ] = {
				set: this[ Constants.ARMOR_ELEMENTS[ piece ] ].armorSet,
				amount: 0
			};
		sets[ this[ Constants.ARMOR_ELEMENTS[ piece ] ].armorSet.id ].amount++;
	}

	for ( var set in sets )
		for ( var ssk in sets[ set ].skills )
			if ( sets[ set ].amount >= sets[  set ].skills[ ssk ].amount )
				returnSkills.push( sets[  set ].skills[ ssk ].skill );

	return returnSkills;
};

/**
 * Returns whether this character can use given skill or not.
 *
 * @method skillAvailable
 * @public
 *
 * @param  {string}  skill Skill ID to check.
 * @return {Boolean}       True if character has skill available.
 */
var has_skill_available = function ( skill ) {
	var sk = this.skills();
	for ( var i in sk )
		if ( sk[ i ].id === skill ) return true;
	return false;
};

/**
 * Returns whether this character is in given team or not.
 *
 * @method isInTeam
 * @public
 *
 * @param  {Team}    team Array of characters forming team.
 * @return {Boolean}      True if character is in given team.
 */
var is_in_team = function ( team ) {
	for ( var c in team.characters )
		if ( team.characters[ c ].id === this.id ) return true;
	return false;
};

/**
 * Returns the array of stats of this character.
 *
 * @method stats
 * @public
 *
 * @return {Object} Array of stats.
 */
var stats = function () {
	// We return a copy, not the actual one.
	return JSON.parse( JSON.stringify( this._stats ) );
};

/**
 * Initializes internal stats array.
 * Should be called just once.
 *
 * @method initStats
 * @private
 */
var init_stats = function () {
	// Here we will store any skill affecting a stat.
	this._stat_alterations = {};
	// We don't want to alter base stats.
	this._stats = JSON.parse( JSON.stringify( this.class.stats ) );
	// To prevent redefining these variables in each loop.
	var stat, stat_id, stat_value;

	for ( var weap in this.weapons ) {
		for ( stat in this.weapons[ weap ].weapon.stats ) {
			stat_id = this.weapons[ weap ].weapon.stats[ stat ].stat.id;
			stat_value = this.weapons[ weap ].weapon.stats[ stat ].value;
			if ( this._stats[ stat_id ] === undefined )
				this._stats[ stat_id ] = 0;
			this._stats[ stat_id ] += stat_value;
		}
	}

	for ( var piece in Constants.ARMOR_ELEMENTS ) {
		var _piece = Constants.ARMOR_ELEMENTS[ piece ];
		for ( stat in this[ _piece ].stats ) {
			stat_id = this[ _piece ].stats[ stat ].stat.id;
			stat_value = this[ _piece ].stats[ stat ].value;
			if ( this._stats[ stat_id ] === undefined )
				this._stats[ stat_id ] = 0;
			this._stats[ stat_id ] += stat_value;
		}
	}

	for ( var acc in this.accessories ) {
		for ( stat in this.accessories[ acc ].stats ) {
			stat_id = this.accessories[ acc ].stats[ stat ].stat.id;
			stat_value = this.accessories[ acc ].stats[ stat ].value;
			if ( this._stats[ stat_id ] === undefined )
				this._stats[ stat_id ] = 0;
			if ( ( stat_value <= 1 ) )
				this._stats[ stat_id ] *= 1 + stat_value;
			else
				this._stats[ stat_id ] += stat_value;

		}
	}
};

/**
 * Returns the minimum value of given ranged stat.
 *
 * @method  getMinimumValueOfRangedStat
 * @public
 *
 * @param  {string} id ID of ranged stat whose minimum will be returned.
 * @return {number}    Minimum value of given ranged stat.
 */
var get_minimum_value_of_ranged_stat = function ( id ) {
	switch ( id ) {
	case Constants.ACTUALHP_STAT_ID:
	case Constants.ACTUALMP_STAT_ID:
	case Constants.ACTUALKI_STAT_ID:
		return 0;
	default:
		log.warn(
			'Trying to get minimum value of a non-ranged stat: ' + id,
			'STAT'
		);
		return 0;
	}
};

/**
 * Returns the maximum value of given ranged stat.
 *
 * @method  getMaximumValueOfRangedStat
 * @public
 *
 * @param  {string} id ID of ranged stat whose maximum will be returned.
 * @return {number}    Maximum value of given ranged stat.
 */
var get_maximum_value_of_ranged_stat = function ( id ) {
	switch ( id ) {
	case Constants.ACTUALHP_STAT_ID:
		return this.getStat( Constants.HP_STAT_ID );
	case Constants.ACTUALMP_STAT_ID:
		return this.getStat( Constants.MP_STAT_ID );
	case Constants.ACTUALKI_STAT_ID:
		return this.getStat( Constants.KI_STAT_ID );
	default:
		log.warn(
			'Trying to get maximum value of a non-ranged stat: ' + id,
			'STAT'
		);
		return 0;
	}
};

/**
 * Returns desired stat.
 *
 * @method  getStat
 * @public
 *
 * @param  {string}  id ID of stat to return.
 * @return {integer}    Value of desired stat.
 */
var get_stat = function ( id ) {
	var v = this.stats();

	if ( v[ id ] === undefined ) {
		switch ( id ) {
		case Constants.ACTUALHP_STAT_ID:
			this._stats[ id ] = this.getStat( Constants.HP_STAT_ID );
			return this._stats[ id ];
		case Constants.ACTUALMP_STAT_ID:
			this._stats[ id ] = this.getStat( Constants.MP_STAT_ID );
			return this._stats[ id ];
		case Constants.ACTUALKI_STAT_ID:
			this._stats[ id ] = this.getStat( Constants.KI_STAT_ID );
			return this._stats[ id ];
		default:
			this._stats[ id ] = 1;
			return this._stats[ id ];
		}
	}

	return v[ id ];
};

/**
 * Returns whether this character is alive or not.
 *
 * @method alive
 * @public
 *
 * @return {boolean} Whether this character is alive or not.
 */
var alive = function () {
	return ( this.getStat( Constants.ACTUALHP_STAT_ID ) > 0 );
};

/**
 * Alters a stat.
 *
 * @method alterStat
 * @public
 *
 * @todo When amount is lower than 1 and greater than 0 decide if the change
 *       to apply is a reduction or a set to an absolute value.
 * @todo Refactor boon attribute to be a Skill model's attribute.
 * @todo Decide what to do when the stat being altered is undefined (a bug, a
 *       hack?)
 *
 * @param  {Number}          amount   Stat multiplier.
 * @param  {SkillDefinition} skill    Definition of skill that is setting these
 *                                    statuses.
 * @param  {String}          id       Stat's id.
 */
var alter_stat = function ( amount, id, skill ) {
	// If status was not altered or the priority is lower than the new one's...
	if ( this._stats[ id ] !== undefined ) {
		var c, diff = -this._stats[ id ];

		if ( amount < 1 && amount > 0 ) {
			var abs_value = this._stats[ id ] * ( 1 - amount );
			// @TODO What do we want? Changing the stat from X to N% X or
			//       reducing stat by a factor of N% X?
			//       Remove «this._stats[ id ] +» to change stat TO rather than
			//       changing stat IN.
			c = new Change(
				this, "stat",
				id,
				'-' + ( this._stats[ id ] + abs_value )
			);
			this._stats[ id ] *= ( 1 - amount );
		} else {
			this._stats[ id ] += amount;
			c = new Change( this, "stat", id, amount );
		}

		diff += this._stats[ id ];

		// Add given skill to the list of skills affecting given stat.
		if ( this._stat_alterations[ id ] === undefined )
			this._stat_alterations[ id ] = {};

		// If this is the first time given instance of the skill alters given
		// stat, act normal.
		if ( this._stat_alterations[ id ][ skill.uuid ] === undefined ) {
			// Use UUID to get the ID of this instance of the skill.
			this._stat_alterations[ id ][ skill.uuid ] = {
				skill: skill,
				// @TODO Refactor this to an attribute of the model.
				// If the increment is positive, boon, if it is negative, cond.
				boon: ( diff > 0 ) ? true : false
			};
		}
		// If this is the second time an instance of a skill acs on a stat we
		// assume it is cleaning the changes it previously introduced so we
		// remove it from list.
		else {
			delete this._stat_alterations[ id ][ skill.uuid ];
		}

		// Notify round.
		Round.notifyChanges( [ c ], skill );
	} else {
		// @TODO What happens when the stat is undefined?
		// I think this won't happen as everything should be initialized with
		// initStats().
		log.error( 'Altering undefined stat: ' + id, 'STATS' );
	}
};

/**
 * Cleans any change affecting given stat.
 * This will only affect skills registered as boons if boons = true.
 * Otherwise it will only affect skills registered as debuffs.
 *
 * @method  clearStat
 * @public
 *
 * @param  {string}  id    ID of stat to clear.
 * @param  {boolean} boons Whether boons or debuffs should be removed.
 */
var clear_stat = function ( id, boons ) {
	if ( this._stat_alterations[ id ] !== undefined )
		for ( var uuid in this._stat_alterations[ id ] )
			if ( this._stat_alterations[ id ][ uuid ].boon === boons )
				this._stat_alterations[ id ][ uuid ].skill.cancel();
};

/**
 * Cleans any change affecting any stat.
 * This will only affect skills registered as boons if boons = true.
 * Otherwise it will only affect skills registered as debuffs.
 *
 * @method clearAllStats
 * @public
 *
 * @param  {boolean} boons Whether boons or debuffs should be removed.
 */
var clear_all_stats = function ( boons ) {
	for ( var i in this._stat_alterations )
		for ( var uuid in this._stat_alterations[ i ] )
			if ( this._stat_alterations[ i ][ uuid ].boon === boons )
				this._stat_alterations[ i ][ uuid ].skill.cancel();
};

/**
 * Returns whether this character is affected by given altered status or not.
 *
 * @method  hasStatus
 * @public
 *
 * @param  {Array[string]}  statuses Array of altered status to be checked.
 * @return {boolean}                 Whether this character is affected by ANY
 *                                   of given status.
 */
var has_status = function ( statuses ) {
	for ( var s in statuses )
		if ( this.altered_statuses[ statuses[ s ] ] !== undefined )
			return true;
	return false;
};

/**
 * Returns whether this character is affected by given altered status or not.
 *
 * @method  hasAllStatus
 * @public
 *
 * @param  {Array[string]}  statuses Array of altered status to be checked.
 * @return {boolean}                 Whether this character is affected by ALL
 *                                   given status.
 */
var has_all_status = function ( statuses ) {
	var affected = true;
	for ( var s in statuses )
		affected = affected &&
			( this.altered_statuses[ statuses[ s ] ] !== undefined );
	return affected;
};

/**
 * Sets altered status if priority is bigger than current reason's priority.
 *
 * @method  setStatus
 * @public
 *
 * @param {Array[string]}   statuses Array of altered status to set.
 * @param {SkillDefinition} skill    Definition of skill that is setting these
 *                                   statuses.
 * @param {integer|boolean} priority Priority of new skill affecting given
 *                                   status. The bigger the more priority it
 *                                   has. A value of true means maximuim
 *                                   priority.
 * @return {Array[boolean]}          Whether each status was affected by given
 *                                   skill or not.
 */
var set_status = function ( statuses, skill, priority ) {
	var affected = [];
	var changes = [];

	for ( var s in statuses ) {
		var status = statuses[ s ];
		// If status was not altered or the priority is lower than the new
		// one's...
		if (
			this.altered_statuses[ status ] === undefined ||
			this.altered_statuses[ status ].priority <= priority
		) {
			if ( this.altered_statuses[ status ] !== undefined )
				this.altered_statuses[ status ].skill.cancel( [ status ] );

			this.altered_statuses[ status ] = {
				skill: skill,
				priority: priority
			};
			affected[ s ] = true;

			Statistics.increaseStatistic(
				Constants.STATISTIC_TIMES_STATUS_ALTERED_PREFIX + status,
				1
			);

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
 * Unsets given altered status if and only if given skill skill is the one
 * responsible for the altered status or priority is true.
 *
 * This also calls cancel() method of skills removed.
 *
 * @method  unsetStatus
 * @public
 *
 * @param  {Array[string]}   statuses Altered statuses to remove.
 * @param  {SkillDefinition} skill    Definition os skill that is the reason to
 *                                    remove the statuses.
 * @param  {boolean}         override Whether this skill should ignore
 *                                    priorities or not.
 */
var unset_status = function ( statuses, skill, override ) {
	var changes = [];
	for ( var s in statuses ) {
		var status = statuses[ s ];
		// If status was not altered or the priority is lower than the new
		// one's...
		if ( this.altered_statuses[ status ] !== undefined )
			if ( override || this.altered_statuses[ status ].skill === skill ) {
				// Create change representation.
				var c = new Change( this, "status", status, "-" );
				changes.push( c );

				var i = Constants.STATISTIC_TIMES_HEALED_STATUS_ALTERED_PREFIX +
					status;
				Statistics.increaseStatistic( i, 1 );

				// Actually change status.
				this.altered_statuses[ status ].skill.cancel( statuses );
				delete this.altered_statuses[ status ];
			}
	}
	// This SHOULD NOT HAPPEN in deployment, but it happens in testing.
	if ( skill !== null ) {
		// Notify round.
		Round.notifyChanges( changes, skill );
	}
};

// Similar to set_status but changing character's class.
// @todo Implement this method.
var change_class = function () {};

/**
 * Gets character armor's type.
 *
 * @method  getArmorType
 * @private
 *
 * @return {ArmorType} This character armor's type.
 */
var get_armor_type = function () {
	return this[ Constants.ARMOR_ELEMENTS[ 0 ] ].type;
};

/**
 * Gets character's armor defense factor agains given type of damage.
 *
 * @method  getArmorDefenseFactorAgainst
 * @private
 *
 * @param  {string} defType Type of damage.
 * @return {number}         Defense factor of this character's armor
 *                          against given type of damage.
 */
var get_armor_defense_factor_against = function ( defType ) {
	if ( defType == Constants.PHYSICAL )
		return this[ Constants.ARMOR_ELEMENTS[ 0 ] ].type.phyFactor;
	else
		return this[ Constants.ARMOR_ELEMENTS[ 0 ] ].type.magFactor;
};

/**
 * Damages one of the character's damagable stats, given the amount of damage
 * the skill and the id of the damage stat to damage.
 *
 * @method _damage
 * @private
 *
 * @todo Take into account the type of damage and the element.
 *
 * @param  {integer}     amount  Base amount of points to decrease.
 * @param  {CalledSkill} skill   Skill that performes this damage.
 * @param  {string}      id      ID of skill to damage.
 */
var _damage = function ( amount, skill, id ) {
	// @TODO Take into account the type of damage and the element.
	var type = skill.type;
	var element = skill.element;
	var caster = skill.caller;
	var eleDmg = 0;
	var eleDef = 0;
	resistencias = 1;
	//Resistencias = 1 - Resistencia1 - Resistencia2 - Resistencia 3
	//ej. Daño no mitigado por resistencias = 1 - 0.1 (Daño mágico -10%) = 0.9%

	var actual_damage;

	var criticalProbability = 0;
	if ( skill.criticalProbability !== 0 )
		criticalProbability = 1 + skill.criticalProbability;

	var critMulti = 1;
	if (
		Math.random() <=
		caster.getStat( Constants.CRITICAL_STAT_ID ) * criticalProbability
	)
		critMulti = 1.5;

	if ( type === Constants.MAGICAL ) {
		var caster_int = caster.getStat( Constants.INT_STAT_ID );
		var target_men = this.getStat( Constants.MEN_STAT_ID );
		var accuracy_factor = Math.min( caster_int / target_men, 1 );
		var probability_accuracy = skill.accuracy - ( 1 - accuracy_factor );
		var probability_damage_resisted = probability_accuracy;
		if ( skill.accuracy > 1 )
			probability_damage_resisted = 0;
		probability_damage_resisted = probability_damage_resisted || 0;

		var resMulti = ( Math.random() <= probability_damage_resisted ) ? 0 : 1;

		var dmg_factor = caster_int + amount + Math.max( 0, eleDmg - eleDef );
		var magical_multiplier = Math.max( 0.8, dmg_factor / target_men );

		// Maybe this check is not needed any more...
		if ( !isFinite( magical_multiplier ) ) magical_multiplier = 0;

		actual_damage =
			magical_multiplier *
			caster_int *
			this.getArmorDefenseFactorAgainst( Constants.MAGICAL ) *
			critMulti *
			resMulti *
			resistencias;
	} else if ( type === Constants.PHYSICAL ) {
		var probability_damage_evaded =
			( skill.accuracy > 1 ) ?
			0 :
			this.getStat( Constants.EVS_STAT_ID ) / skill.accuracy;

		var evaMulti = ( Math.random() <= probability_damage_evaded ) ? 0 : 1;

		var caster_str = caster.getStat( Constants.STR_STAT_ID );
		var target_def = this.getStat( Constants.DEF_STAT_ID );

		var physical_multiplier = Math.max(
			0.8, ( caster_str + amount ) / target_def
		);

		// Maybe this check is not needed any more...
		if ( !isFinite( physical_multiplier ) ) physical_multiplier = 0;

		actual_damage =
			physical_multiplier *
			caster_str *
			this.getArmorDefenseFactorAgainst( Constants.PHYSICAL ) *
			critMulti *
			evaMulti *
			resistencias;
	} else {
		// Just to allow altering skills to skip damage algorithms.
		actual_damage = amount;
	}

	actual_damage = Math.round( actual_damage ); // Damage should be an integer!
	// Don't do more damage than character can stand.
	var maximum_damage_allowed =
		this.getStat( id ) - this.getMinimumValueOfRangedStat( id );
	actual_damage = Math.min( maximum_damage_allowed, actual_damage );
	// Don't do less negativa damage (heal more) than allowed.
	var maximum_healed_allowed = -(
		this.getMaximumValueOfRangedStat( id ) - this.getStat( id )
	);
	actual_damage = Math.max( maximum_healed_allowed, actual_damage );

	// Actually apply damage.
	this._stats[ id ] -= actual_damage;

	// Gather statistics about damages.
	if ( id === Constants.ACTUALHP_STAT_ID ) {
		Statistics.increaseStatistic(
			Constants.STATISTIC_DAMAGE_DEALED,
			actual_damage
		);
		Statistics.increaseStatistic(
			Constants.STATISTIC_DAMAGE_BY_SKILL_PREFIX + skill.id,
			actual_damage
		);

		if ( skill.type === Constants.PHYSICAL )
			Statistics.increaseStatistic(
				Constants.STATISTIC_PHYSICAL_DAMAGE_DEALED,
				actual_damage
			);
		else
			Statistics.increaseStatistic(
				Constants.STATISTIC_MAGICAL_DAMAGE_DEALED,
				actual_damage
			);

		if ( this.getStat( id ) === 0 && actual_damage > 0 ) {
			Statistics.increaseStatistic(
				Constants.STATISTIC_TIMES_CLASS_DEFEATS_A_CHARACTER +
				caster.class.id,
				1
			);
			Statistics.increaseStatistic(
				Constants.STATISTIC_CHARACTERS_DIE,
				1
			);
		}
	}

	// Get change object.
	var c = new Change( this, "stat", id, "-" + actual_damage );
	// Notify round.
	Round.notifyChanges( [ c ], skill );

	return actual_damage;
};

/**
 * Damages character's health with given base damage and given skill.
 *
 * @method  damage
 * @public
 *
 * @param  {number}      amount Base amount of points to decrease.
 * @param  {CalledSkill} skill  Skill used.
 */
var damage = function ( amount, skill ) {
	return _damage.apply( this, [ amount, skill, Constants.ACTUALHP_STAT_ID ] );
};

/**
 * Damages character's MP with given base damage and given skill.
 *
 * @method consumeMP
 * @public
 *
 * @param  {number}      amount Base amount of points to decrease.
 * @param  {CalledSkill} skill  Skill used.
 */
var consumeMP = function ( amount, skill ) {
	this.realDamage( amount, Constants.ACTUALMP_STAT_ID );
	// Get change object.
	var c = new Change(
		this,
		"stat",
		Constants.ACTUALMP_STAT_ID,
		"-" + amount
	);
	// Notify round.
	Round.notifyChanges( [ c ], skill );
};

/**
 * Damages character's KI with given base damage and given skill.
 *
 * @method consumeKI
 * @public
 *
 * @param  {number}      amount Base amount of points to decrease.
 * @param  {CalledSkill} skill  Skill used.
 */
var consumeKI = function ( amount, skill ) {
	this.realDamage( amount, Constants.ACTUALKI_STAT_ID );
	// Get change object.
	var c = new Change(
		this,
		"stat",
		Constants.ACTUALKI_STAT_ID,
		"-" + amount
	);
	// Notify round.
	Round.notifyChanges( [ c ], skill );
};

/**
 * Allows dealing direct damage to a stat without passing through
 * damage algorithms.
 *
 * @method realDamage
 * @public
 *
 * @note   This WILL NOT be notified to the round API if no skill is provided.
 *
 * @param  {number} amount Amount to reduce given stat.
 * @param  {string} id     ID of stat to reduce.
 * @param  {Skill} [skill] Optional. Skill performing the damage. If it is
 *                         given then Round API will be notified.
 */
var real_damage = function ( amount, id, skill ) {
	var actual_damage = Math.round( amount ); // Damage should be an integer!
	// Don't do more damage than character can stand.
	var maximum_damage_allowed =
		this.getStat( id ) - this.getMinimumValueOfRangedStat( id );
	actual_damage = Math.min( maximum_damage_allowed, actual_damage );
	// Don't do less negativa damage (heal more) than allowed.
	var maximum_healed_allowed = -(
		this.getMaximumValueOfRangedStat( id ) - this.getStat( id )
	);
	actual_damage = Math.max( maximum_healed_allowed, actual_damage );
	// Actually change stat.
	this._stats[ id ] -= actual_damage;
	if ( skill !== undefined ) {
		// Get change object.
		var c = new Change( this, "stat", id, "-" + actual_damage );
		// Notify round.
		Round.notifyChanges( [ c ], skill );
	}
};

/**
 * Returns whether a skill can be performed by this player or not (due to
 * altered status).
 *
 * @method  canPerformAction
 * @public
 *
 * @param  {SkillDefinition} skill Skill to be checked.
 * @return {boolean}               Whether this character can perform this skill
 *                                 or not.
 */
var can_perform_action = function ( skill ) {
	var blocked_by_ids = [];
	for ( var i = 0; i < skill.blockedBy.length; i++ )
		blocked_by_ids.push( skill.blockedBy[ i ].id );
	return this.alive() && !this.hasStatus( blocked_by_ids ) &&
		this.getStat( skill.cost.stat ) >= skill.cost.amount;
};

/**
 * Returns an array of passive skills of this character.
 *
 * @method passiveSkills
 * @public
 *
 * @return {Array} Array of passive skills of this character.
 */
var get_passive_skills = function () {
	var returnSkills = [];

	for ( var weap in this.weapons )
		for ( var sk in this.weapons[ weap ].skills )
			if ( this.weapons[ weap ].skills[ sk ].passive )
				returnSkills.push( this.weapons[ weap ].skills[ sk ] );

	for ( var acc in this.accessories )
		for ( var ask in this.accessories[ acc ].skills )
			if ( this.accessories[ acc ].skills[ ask ].passive )
				returnSkills.push( this.accessories[ acc ].skills[ ask ] );

	for ( var i in this.class.skills )
		if ( this.class.skills[ i ].passive )
			returnSkills.push( this.class.skills[ i ] );

	var sets = {};
	for ( var piece in Constants.ARMOR_ELEMENTS ) {
		if ( sets[ Constants.ARMOR_ELEMENTS[ piece ] ] === undefined )
			sets[ this[ Constants.ARMOR_ELEMENTS[ piece ] ].armorSet.id ] = {
				set: this[ Constants.ARMOR_ELEMENTS[ piece ] ].armorSet,
				amount: 0
			};
		sets[ this[ Constants.ARMOR_ELEMENTS[ piece ] ].armorSet.id ].amount++;
	}

	for ( var set in sets )
		for ( var ssk in sets[ set ].skills )
			if ( sets[ set ].amount >= sets[  set ].skills[ ssk ].amount )
				returnSkills.push( sets[  set ].skills[ ssk ].skill );

	return returnSkills;
};

/**
 * Returns a JSON version of this Character.
 *
 * @method toJSON
 * @public
 *
 * @return {string} JSON representation of this Character.
 */
var toJSON = function () {
	ret = {};
	for ( var i in this )
		if ( typeof this[ i ] !== 'function' )
			ret[ i ] = this[ i ];
	delete ret._stat_alterations;
	delete ret.altered_statuses;
	ret.stats = this.stats();
	ret.alive = this.alive();
	ret.skills = this.skills();
	ret.passives = this.passiveSkills();
	return ret;
};

// Add here any instance method you want to make public.
// Key: public name.
// Value: function to be called.
var INSTANCE_METHODS = {
	toJSON: toJSON,
	skills: get_skills,
	skillAvailable: has_skill_available,
	isInTeam: is_in_team,
	passiveSkills: get_passive_skills,
	stats: stats,
	initStats: init_stats,
	getStat: get_stat,
	getMinimumValueOfRangedStat: get_minimum_value_of_ranged_stat,
	getMaximumValueOfRangedStat: get_maximum_value_of_ranged_stat,
	alterStat: alter_stat,
	clearStat: clear_stat,
	clearAllStats: clear_all_stats,
	clientObject: clientObject,
	getArmorType: get_armor_type,
	getArmorDefenseFactorAgainst: get_armor_defense_factor_against,
	// API
	canPerformAction: can_perform_action,
	damage: damage,
	realDamage: real_damage,
	hasStatus: has_status,
	hasAllStatus: has_all_status,
	setStatus: set_status,
	unsetStatus: unset_status,
	alive: alive,
	consumeMP: consumeMP,
	consumeKI: consumeKI
};

/**
 * CharacterHelper constructor.
 *
 * @class CharacterHelper
 * @constructor
 *
 * @param  {Character} db_source Character object as returned by model methods.
 * @return {Promise}     Promise that will be resolved giving a character object
 *                       featuring helper methods without needing database
 *                       access to process anything.
 */
module.exports = function ( db_source ) {
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
	model.ready.then( function () {
		// Load class.
		model.Class.find( {
			_id: db_source.class
		} ).populate( model.Class.join ).exec( function ( err, docs ) {
			if ( err )
				class_loaded.reject( err );
			else if ( docs.length === 0 )
				class_loaded.reject( Constants.ERROR_CLASS_NOT_FOUND );
			else {
				character.class = JSON.parse( JSON.stringify( docs[ 0 ] ) );
				var stats = {};
				for ( var i in character.class.stats ) {
					var pair = character.class.stats[ i ];
					stats[ pair.stat.id ] = pair.value;
				}
				character.class.stats = stats;
				class_loaded.resolve();
			}
		} );

		// Load weapons.
		var weapon_loaded_promises = [];

		var assign_weapon = function ( i ) {
			var _dw = Q.defer();
			var _ds = Q.defer();

			model.Weapon.find( {
				_id: db_source.weapons[ i ].weapon
			} ).populate( model.Weapon.join ).exec( function ( err, docs ) {
				if ( err ) _dw.reject( err );
				else if ( docs.length === 0 )
					_dw.reject( Constants.ERROR_WEAPON_NOT_FOUND );
				else {
					character.weapons[ i ].weapon = JSON.parse(
						JSON.stringify( docs[ 0 ] )
					);
					for ( var j in character.weapons[ i ].weapon.skills )
						character
							.weapons[ i ]
							.weapon
							.skills[ j ]
							.skill
							.definition =
							docs[ 0 ].skills[ j ].skill.definition;
					_dw.resolve();
				}
			} );

			model.WeaponSlot.find( {
				_id: db_source.weapons[ i ].slot
			} ).populate( model.WeaponSlot.join ).exec( function ( err, docs ) {
				if ( err )
					_ds.reject( err );
				else if ( docs.length === 0 )
					_ds.reject( Constants.ERROR_WEAPON_NOT_FOUND );
				else {
					character.weapons[ i ].slot = docs[ 0 ];
					_ds.resolve();
				}
			} );

			return Q.all( [ _dw.promise, _ds.promise ] );
		};

		// Use traditional for because database objects have hidden attributes
		// that affect foreach loops.
		for ( var i = 0; i < db_source.weapons.length; i++ )
			weapon_loaded_promises.push( assign_weapon( i ) );

		weapons_loaded = Q.all( weapon_loaded_promises );

		// Armors.
		armor_loaded_promises = [];

		var assign_armor = function ( element ) {
			var _d = Q.defer();

			model.ArmorPiece.find( {
				_id: db_source[ element ]
			} ).populate( model.ArmorPiece.join ).exec( function ( err, docs ) {
				if ( err ) _d.reject( err );
				else if ( docs.length === 0 )
					_d.reject( Constants.ERROR_ARMOR_PIECE_NOT_FOUND );
				else {
					character[ element ] = JSON.parse(
						JSON.stringify( docs[ 0 ] )
					);

					var _dat = Q.defer();
					var _das = Q.defer();

					model.ArmorType.find( {
						_id: docs[ 0 ].type._id
					} ).populate( model.ArmorType.join )
						.exec( function ( err, docs ) {
							if ( err ) _dat.reject( err );
							else if ( docs.length === 0 )
								_dat.reject(
									Constants.ERROR_ARMOR_TYPE_NOT_FOUND
								);
							else {
								character[ element ]
									.type
									.phyFactor = docs[ 0 ].phyFactor;
								character[ element ]
									.type
									.magFactor = docs[ 0 ].magFactor;
								_dat.resolve();
							}
						} );

					model.ArmorSet.find( {
						id: docs[ 0 ].armorSet.id
					} ).populate( model.ArmorSet.join )
						.exec( function ( err, docs ) {
							if ( err ) _das.reject( err );
							else if ( docs.length === 0 )
								_das.reject(
									Constants.ERROR_ARMOR_SET_NOT_FOUND
								);
							else {
								character[ element ].armorSet = JSON.parse(
									JSON.stringify( docs[ 0 ] )
								);
								var armor_set = character[ element ].armorSet;
								var components = armor_set.components;
								for ( var i in components )
									components[ i ] = components[ i ].id;
								var set_skills = armor_set.skills;
								for ( var j in set_skills )
									set_skills[ j ].skill.definition = docs[ 0 ]
										.skills[ j ].skill.definition;
								_das.resolve();
							}
						} );

					Q.all( [ _dat.promise, _das.promise ] )
						.then( _d.resolve ).fail( _d.reject );
				}
			} );

			return _d.promise;
		};

		for ( i in Constants.ARMOR_ELEMENTS )
			armor_loaded_promises.push(
				assign_armor( Constants.ARMOR_ELEMENTS[ i ] )
			);

		armors_loaded = Q.all( armor_loaded_promises );

		// Load accessories.
		var accessory_loaded_promises = [];

		var assign_accessory = function ( i ) {
			var _d = Q.defer();

			model.Accessory.find( {
				_id: db_source.accessories[ i ]
			} ).populate( model.Accessory.join ).exec( function ( err, docs ) {
				if ( err ) _d.reject( err );
				else if ( docs.length === 0 )
					_d.reject( Constants.ERROR_ACCESSORY_NOT_FOUND );
				else {
					character.accessories[ i ] = JSON.parse(
						JSON.stringify( docs[ 0 ] )
					);
					for ( var j in character.accessories[ i ].skills )
						character
							.accessories[ i ]
							.skills[ j ]
							.skill
							.definition =
							docs[ 0 ]
							.skills[ j ]
							.skill
							.definition;
					_d.resolve();
				}
			} );

			return _d.promise;
		};

		// Use traditional for because database objects have hidden attributes
		// that affect foreach loops.
		for ( i = 0; i < db_source.accessories.length; i++ )
			accessory_loaded_promises.push( assign_accessory( i ) );

		accessories_loaded = Q.all( accessory_loaded_promises );

		// Check references are loaded.

		Q.all( [
			class_loaded.promise,
			weapons_loaded,
			armors_loaded,
			accessories_loaded
		] ).then( function () {

			// Transform character to a standard Javascript object.
			character = JSON.parse( JSON.stringify( character ) );

			// Data structures.

			character.altered_statuses = {};

			// Here we will assign methods to the character.
			for ( var j in INSTANCE_METHODS )
				character[ j ] = INSTANCE_METHODS[ j ];

			character.initStats();
			defer.resolve( character );
		} ).fail( defer.reject );
	} );

	return defer.promise;
};