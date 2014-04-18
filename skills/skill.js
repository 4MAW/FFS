// Dependencies.

var Constants = require( '../vendor/constants.js' ),
	Q = require( 'q' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	model = require( '../models/model.js' ),
	log = require( '../vendor/log.js' ),
	controllers_path = path.resolve( __dirname );

module.exports = {
	/**
	 * Returns a CalledSkill given caller, target(s) and skill ID.
	 * A CalledSkill is a unique instantiation of a skill. Each time a skill
	 * is used a new CalledSkill is created to represent that time the skill
	 * was used.
	 *
	 * @class CalledSkill
	 * @constructor
	 *
	 * @todo Implement fixed_row targets.
	 * @todo Implement fixed_col targets.
	 * @todo Implement adjacent_row targets.
	 * @todo Implement adjacent_col targets.
	 * @todo Implement adjacent_both targets.
	 *
	 * @param  {Character}      caller  Character casting the skill.
	 * @param  {[Character]}    targets Array of targets of the skill. If only
	 *                                  one target, array of one item.
	 * @param  {string}         skillID ID of skill being casted.
	 * @param  {BattleHandler}  Battle  Battle handler of battle where this
	 *                                  skill is being used.
	 * @return {CalledSkill}            CalledSkill object representing this
	 *                                  instance of skill.
	 */
	cast: function ( caller, targets, skillID, Battle ) {
		var casted = new module.exports[ skillID ]();

		/**
		 * Character that used this skill.
		 *
		 * @property caller
		 * @type {Character}
		 */
		casted.caller = caller;

		/**
		 * When skill is a single-target skill, target who will suffer the
		 * effects of this skill.
		 *
		 * @property target
		 * @type {Character}
		 */
		// casted.target;

		/**
		 * When skill is a multi-target skill, array of targets who will suffer
		 * the effects of this skill. Most important character is the first one.
		 *
		 * @property targets
		 * @type {[Character]}
		 */
		// casted.targets;

		// Injected attributes.

		/**
		 * Direct access to RoundAPI.
		 *
		 * @property Round
		 * @type {RoundAPI}
		 */
		casted.Round = Battle.getRoundAPI();

		/**
		 * Direct access to the Field.
		 *
		 * @property Field
		 * @type {Field}
		 */
		casted.Field = Battle.getFieldAPI();

		/**
		 * Direct access to the Battle Handler.
		 *
		 * @property Battle
		 * @type {BattleHandler}
		 */
		casted.Battle = Battle;

		/**
		 * Number of round when this skill was used.
		 *
		 * @property roundNumber
		 * @type {integer}
		 */
		casted.roundNumber = casted.Round.currentRound();

		switch ( casted.multiTarget ) {
		case Constants.TARGET_SINGLE:
			casted.target = targets[ 0 ];
			break;
		case Constants.TARGET_TWO:
			casted.targets = [ targets[ 0 ], targets[ 1 ] ];
			break;
		case Constants.TARGET_FIXED_ROW:
			casted.targets = casted.Field.sameRow( targets[ 0 ] );
			break;
		case Constants.TARGET_FIXED_COL:
			casted.targets = targets;
			break;
		case Constants.TARGET_ADJACENT_ROW:
			casted.targets = targets;
			break;
		case Constants.TARGET_ADJACENT_COL:
			casted.targets = targets;
			break;
		case Constants.TARGET_ADJACENT_BOTH:
			casted.targets = targets;
			break;
		case Constants.TARGET_AREA:
			casted.targets = casted.Field.sameArea( targets[ 0 ] );
			break;
		case Constants.TARGET_ALL:
			casted.targets = casted.Field.all();
			break;
		}

		return casted;
	}
};

// Promise about loading all skills.
var defer = Q.defer();
module.exports.ready = defer.promise;

// Load files synchronous: this is startup time, so this is fine.

var files = fs.readdirSync( controllers_path );

var dependencies = [];

for ( var _f in files )
	if (
		/.*\.js$/.test( files[ _f ] ) &&
		files[ _f ] !== path.basename( __filename )
	)
		dependencies.push( path.resolve( controllers_path, files[ _f ] ) );

for ( var _d in dependencies ) {
	var filename = path.basename( dependencies[ _d ], '.js' );
	filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
	module.exports[ filename ] = require( path.resolve( dependencies[ _d ] ) );

	log.info( filename + " - Loaded", "SKILLS" );
}

// Load skills from database.

model.Skill.find().populate( model.Skill.join ).exec( function ( err, docs ) {
	if ( err )
		defer.reject( err );
	else {
		var filename;

		var to_json_skill = function () {
			var ret = {};
			for ( var j in this )
				if ( typeof this[ j ] !== 'function' )
					ret[ j ] = this[ j ];
			ret.id = this.id;
			ret.name = this.name;
			delete ret.Round;
			delete ret.Battle;
			delete ret.Field;
			return ret;
		};

		for ( var i in docs ) {
			filename = path.basename( docs[ i ].definition, '.js' );
			filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
			if ( module.exports[ filename ] !== undefined ) {
				// Perform injections.
				var proto = {
					/**
					 * ID of skill being used.
					 *
					 * @property id
					 * @type {string}
					 */
					id: docs[ i ].id,
					/**
					 * Name of skill being used.
					 *
					 * @property name
					 * @type {string}
					 */
					name: docs[ i ].name,
					/**
					 * Type of multi-target offered by skill being used.
					 *
					 * @property multiTarget
					 * @type {string}
					 */
					multiTarget: docs[ i ].multiTarget,
					/**
					 * Accuracy of skill being used.
					 *
					 * @property accuracy
					 * @type {number}
					 */
					accuracy: docs[ i ].accuracy,
					/**
					 * Critical probablity of skill being used.
					 *
					 * @property criticalProbability
					 * @type {number}
					 */
					criticalProbability: docs[ i ].criticalProbability,
					/**
					 * Cost of skill being used.
					 *
					 * @property cost
					 * @type {SkillCost}
					 */
					cost: docs[ i ].cost,
					/**
					 * Altered statutes that might block skill being used.
					 *
					 * @property blockedBy
					 * @type {[Status]}
					 */
					blockedBy: docs[ i ].blockedBy,
					toJSON: to_json_skill
				};
				module.exports[ filename ].prototype = proto;
				// Allow direct access by skill ID.
				module.exports[ docs[ i ].id ] = module.exports[  filename ];
			} else
				log.warn( "Dependency " + filename + " (" +
					docs[ i ].definition + ") not found!", "SKILL" );
		}

		// Log orphan skills, for debug's sake.
		for ( var j in dependencies ) {
			filename = path.basename( dependencies[ j ], '.js' );
			filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
			if ( module.exports[ filename ].prototype === undefined )
				log.warn( "Orphan definition: " + dependencies[ j ], "SKILL" );
			delete module.exports[ filename ];
		}

		// Notify load has finished.
		log.status( "All skills loaded", "SKILLS" );
		defer.resolve();

	}
} );