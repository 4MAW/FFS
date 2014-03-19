// Model definition.

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
		}
	},
	//join: 'type',
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