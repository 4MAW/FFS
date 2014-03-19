// Dependencies.

var Q = require( 'q' );

// Model definition.

/**
 * Modifies given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {Skill}  item Basic Skill object (just attributes, without methods).
 * @return {promise}     Promise about updating given object.
 */
function process_item( item ) {
	var model = require( './model.js' );

	// Find all statuses.

	var all_statuses_found_promise;

	var find_status_and_resolve_promise = function ( item, _status, status_defer ) {
		model.Status.find( {
			id: item.blockedBy[ _status ]
		}, {
			_id: 1
		}, function ( err, docs ) {
			if ( err ) status_defer.reject( err );
			else if ( docs.length < 1 ) status_defer.reject( 404 );
			else {
				var doc = docs[ 0 ];
				item.blockedBy[ _status ] = doc._id;
				status_defer.resolve();
			}
		} );
	};

	var status_promises = [];
	for ( var _status in item.blockedBy ) {
		var status_defer = Q.defer();
		status_promises.push( status_defer.promise );
		find_status_and_resolve_promise( item, _status, status_defer );
	}

	all_status_found_promise = Q.all( status_promises );

	// Find everything.

	return Q.all( [ all_status_found_promise ] );
}

module.exports = {
	schema: {
		id: {
			type: String,
			index: {
				unique: true,
				dropDups: true
			}
		},
		name: {
			type: String,
			index: {
				unique: true,
				dropDups: true
			}
		},
		/*
		type:
		{
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'SkillType'
		},
		*/
		definition: {
			type: String
		},
		passive: {
			type: Boolean
		},
		multiTarget: {
			type: String,
			enum: [ 'single', '2', 'fixedRow', 'fixedCol', 'adjacentRow', 'adjacentCol', 'adjacentBoth', 'area', 'all' ]
		},
		defaultTeam: {
			type: String,
			enum: [ 'own', 'enemy' ]
		},
		accuracy: {
			type: Number,
			max: 1,
			min: 0
		},
		criticalProbability: {
			type: Number,
			max: 1,
			min: 0
		},
		cost: {
			// @TODO: Add support to multi-cost skills.
			type: {
				amount: {
					type: Number,
					set: function ( v ) {
						return Math.floor( v );
					}
				},
				stat: {
					type: String
				}
			}
		},
		blockedBy: [ {
			type: require( 'mongoose' ).Schema.Types.ObjectId,
			ref: 'Status'
		} ],
	},
	phases: [ {
		name: 'init',
		requirements: [ 'Status' ],
		callback: process_item
	} ],
	join: 'blockedBy',
	statics: {},
	set: {
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON': {
			transform: function ( doc, ret, options ) {
				delete ret.definition;
				delete ret._id;
				delete ret.__v;
			}
		}
	}
};