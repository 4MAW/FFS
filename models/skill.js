// Model definition.

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
		name:
		{
			type: String,
			index:
			{
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
		definition:
		{
			type: String
		},
		passive:
		{
			type: Boolean
		},
		multiTarget:
		{
			type: Boolean
		}
	},
	//join: 'type',
	statics:
	{},
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				delete ret.definition;
				delete ret._id;
				delete ret.__v;
			}
		}
	}
};