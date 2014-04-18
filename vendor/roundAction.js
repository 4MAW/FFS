/**
 * A RoundAction is a representation of an action performed by a
 * character at some round.
 *
 * @class RoundAction
 * @constructor
 */
module.exports = function ( skill ) {
	/**
	 * UUID of the skill used.
	 *
	 * @property uuid
	 * @type {string}
	 * @private
	 */
	this.uuid = skill.uuid;
	/**
	 * Actual representation of the skill used.
	 *
	 * @property skill
	 * @type {CalledSkill}
	 * @private
	 */
	this.skill = skill;
	/**
	 * Array of changes introduced by called skill.
	 *
	 * @property changes
	 * @type {[Change]}
	 * @public
	 */
	this.changes = [];
};