// Dependencies.

var Q = require( 'q' );

// Initialization methods.

/**
 * Modifies given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {Player} item Basic Player object (just attributes, without methods).
 * @return {promise}     Promise about updating given object.
 */
function process_item( item )
{
	var model = require( './model.js' );

	// Find all teams.

	var all_teams_found_promise;

	var find_team_and_resolve_promise = function ( item, _team, team_defer )
	{
		model.Team.find(
		{
			id: item.teams[  _team ].id
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) team_defer.reject( err );
			else if ( docs.length < 1 ) team_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.teams[ _team ] = doc._id;
				team_defer.resolve();
			}
		} );
	};

	var team_promises = [];
	for ( var _team in item.teams )
	{
		var team_defer = Q.defer();
		team_promises.push( team_defer.promise );
		find_team_and_resolve_promise( item, _team, team_defer );
	}

	all_teams_found_promise = Q.all( team_promises );

	// Find everything.

	return Q.all( [ all_teams_found_promise ] );
}

// Static methods.

// Model definition.

var crypt = require( '../vendor/crypt.js' );

module.exports = {
	schema:
	{
		id:
		{
			type: String,
			index:
			{
				unique: true,
				dropDups: true
			}
		},
		username:
		{
			type: String,
			index:
			{
				unique: true,
				dropDups: true
			}
		},
		password:
		{
			type: String,
			set: function ( v )
			{
				return crypt.hash( v );
			}
		},
		teams:
		{
			type: [
			{
				type: require( 'mongoose' ).Schema.Types.ObjectId,
				ref: 'Team'
			} ]
		},
		gamesPlayed:
		{
			type: Number
		},
		gamesWon:
		{
			type: Number
		}
	},
	join: 'teams',
	phases: [
	{
		name: 'init',
		requirements: [ 'Team' ],
		callback: process_item
	} ],
	statics:
	{},
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				delete ret.password;
				delete ret._id;
				delete ret.__v;
			}
		}
	}
};