// You can safely assume that the following attributes are set:
//
// - id:          ID of this skill.
// - name:        Name of this skill.
// - target:      Target of this skill (if there is only one target). Character.
// - targets:     Array of targets of this skill. [Character].
// - caller:      Character performing using this skill.
// - Round:       Round API.
// - accuracy:    Accuracy of the skill (0...1).
// - multiTarget: Whether this skill is a multi target skill or not.

module.exports = function () {

	/*
	 *
	 *  Injected attributes.
	 *
	 */

	/**
	 * ID of this skill.
	 * This value will be injected later by the Skill loader.
	 * @type {string}
	 * @injected
	 */
	this.id = null;
	/**
	 * Name of this skill.
	 * This value will be injected later by the Skill loader.
	 * @type {string}
	 * @injected
	 */
	this.name = null;
	/**
	 * Round API.
	 * This value will be injected later by the Skill loader.
	 * @type {RoundAPI}
	 * @injected
	 */
	this.Round = null;
	/**
	 * Target who will suffer the effects of this skill.
	 * This value will be injected later by the Skill loader.
	 * @type {Character}
	 * @injected
	 */
	this.target = null;
	/**
	 * Array of targets who will suffer the effects of this skill.
	 * This value will be injected later by the Skill loader.
	 * @type {[Character]}
	 * @injected
	 */
	this.targets = null;
	/**
	 * Character who uses this skill.
	 * This value will be injected later by the Skill loader.
	 * @type {Character}
	 * @injected
	 */
	this.caller = null;
	/**
	 * Accuracy of this skill.
	 * This value will be injected later by the skill loader.
	 * @type {number}
	 * @injected
	 */
	this.accuracy = null;
	/**
	 * Whether this skill is multi target or not.
	 * @type {boolean}
	 * @injected
	 */
	this.multiTarget = null;

	/*
	 *
	 *  Real attributes.
	 *
	 */

	/**
	 * Type of skill, used to choose the appropriate damage algorithm.
	 * This could be either "physical" or "magical"
	 * @type {String}
	 * @required
	 */
	this.type = "physical";
	/**
	 * Elenent of skill, used to choose the appropriate damage algorithm.
	 * This is optional.
	 * @type {String}
	 */
	this.element = "poison";

	/*
	 *
	 *  Required methods.
	 *
	 */

	/**
	 * Initialization method. Called when a skill is used.
	 * This method should register any repeatable action or enqueue damage.
	 * This method MUST NOT alter the environment DIRECTLY.
	 */
	this.init = function () {
		// Use Round.do to inflict damage this round at the appropriate time.
		// Parameters:
		// - callback that performs damage.
		// - skill that causes damage (to notify clients later and have access
		//   to this in the callback).
		this.Round.do( this.damage, this );
	};

	/**
	 * This method is called when other skill cancels the effects
	 * produced by this skill.
	 *
	 * It is expected that this method removes any callback registered
	 * by this skill.
	 *
	 * @param {[string]} reaons Optional array of status, used to
	 *                          allow cancelling just the effects
	 *                          produced by a skill due to one
	 *                          altered status.
	 *
	 *                          For instance:  «Vómito de Molbol» will
	 *                          affect several status, one of them might
	 *                          be poison and other might be blind.
	 *                          If you cast a spell that heals "blind"
	 *                          altered status you should affect the poison
	 *                          damage triggered by this skill, even if blind
	 *                          status was triggered also by this skill.
	 */
	this.cancel = function ( reasons ) {
		// Empty implementation for this template.
	};

	/*
	 *
	 *  Optional methods (methods called by other methods defined in this file).
	 *
	 */

	/**
	 * Optional. Method that alters the environment, dealing damage to target.
	 */
	this.damage = function () {
		// Damage target.
		// Parameters:
		// - base damage.
		// - ± range. Use 0 to inflict always the same amount.
		// - skill performing the damage (to notify clients later).
		this.target.damage( 100, this );
	};
};