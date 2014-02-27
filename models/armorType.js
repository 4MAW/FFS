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
		phyFactor:
		{
			type: Number
		},
		magFactor:
		{
			type: Number
		}

	},
	statics:
	{},
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				delete ret.phyFactor;
				delete ret.magFactor;
				delete ret._id;
				delete ret.__v;
			}
		}
	}
};