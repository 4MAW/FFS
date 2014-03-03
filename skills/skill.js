module.exports = {
	/**
	 * Returns a CalledSkill given caller, target(s) and skill ID.
	 * @param  {Character}   caller  Character casting the skill.
	 * @param  {[Character]} targets Array of targets of the skill. If only one target, array of one item.
	 * @param  {string}      skillID ID of skill being casted
	 * @return {CalledSkil}          CalledSkill object representing this instance of skill.
	 */
	cast: function ( caller, targets, skillID )
	{
		var casted = new module.exports[ skillID ]();
		casted.caller = caller;
		if ( casted.multiTarget )
			casted.targets = targets;
		else
			casted.target = targets[ 0 ];
		return casted;
	}
};

// Dependencies.

var Q = require( 'q' ),
	path = require( 'path' ),
	fs = require( 'fs' ),
	model = require( '../models/model.js' ),
	log = require( '../vendor/log.js' ),
	Round = require( '../vendor/roundAPI.js' ),
	controllers_path = path.resolve( __dirname );

// Promise about loading all skills.
var defer = Q.defer();
module.exports.ready = defer.promise;

// Load files synchronous: this is startup time, so this is fine.

var files = fs.readdirSync( controllers_path );

var dependencies = [];

for ( var _f in files )
	if ( /.*\.js$/.test( files[ _f ] ) && files[ _f ] !== path.basename( __filename ) )
		dependencies.push( path.resolve( controllers_path, files[ _f ] ) );

for ( var _d in dependencies )
{
	var filename = path.basename( dependencies[ _d ], '.js' );
	filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
	module.exports[ filename ] = require( path.resolve( dependencies[ _d ] ) );

	log.info( filename + " - Loaded", "SKILLS" );
}

// Load skills from database.

model.Skill.find(
{}, function ( err, docs )
{
	if ( err )
		defer.reject( err );
	else
	{
		var filename;

		var to_json_skill = function ()
		{
			var ret = {};
			for ( var j in this )
				if ( typeof this[ j ] !== 'function' )
					ret[ j ] = this[ j ];
			ret.id = this.id;
			ret.name = this.name;
			return ret;
		};

		for ( var i in docs )
		{
			filename = path.basename( docs[ i ].definition, '.js' );
			filename = filename.charAt( 0 ).toUpperCase() + filename.slice( 1 );
			if ( module.exports[ filename ] !== undefined )
			{
				// Perform injections.
				var proto = {
					id: docs[ i ].id,
					name: docs[ i ].name,
					multiTarget: docs[ i ].multiTarget,
					accuracy: docs[ i ].accuracy,
					Round: Round,
					toJSON: to_json_skill
				};
				module.exports[ filename ].prototype = proto;
				// Allow direct access by skill ID.
				module.exports[ docs[ i ].id ] = module.exports[  filename ];
			}
			else
				log.warn( "Dependency " + filename + " (" + docs[ i ].definition + ") not found!", "SKILL" );
		}

		// Log orphan skills, for debug's sake.
		for ( var j in dependencies )
		{
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