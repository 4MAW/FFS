// Model definition.

module.exports = {
	schema:
	{
		value:
		{
			type:
			{
				value:
				{
					type: Number,
					set: function ( v )
					{
						return Math.floor( v );
					}
				}
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
	},
	statics:
	{},
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options ) {}
		}
	}
};