// Dependencies.

var Q = require( 'q' );

// Initialization methods.

/**
 * Modifies given item so that any reference to an external collection is replaced by the proper ObjectID.
 * @param  {Team} item Basic Team object (just attributes, without methods).
 * @return {promise}   Promise about updating given object.
 */
function process_item( item )
{
	var model = require( './model.js' );

	// Find all characters.

	var all_characters_found_promise;

	var find_character_and_resolve_promise = function ( item, _character, character_defer )
	{
		model.Character.find(
		{
			id: item.characters[ _character ].id
		},
		{
			_id: 1
		}, function ( err, docs )
		{
			if ( err ) character_defer.reject( err );
			else if ( docs.length < 1 ) character_defer.reject( 404 );
			else
			{
				var doc = docs[ 0 ];
				item.characters[ _character ] = doc._id;
				character_defer.resolve();
			}
		} );
	};

	var character_promises = [];
	for ( var _character in item.characters )
	{
		var character_defer = Q.defer();
		character_promises.push( character_defer.promise );
		find_character_and_resolve_promise( item, _character, character_defer );
	}

	all_characters_found_promise = Q.all( character_promises );

	// Find everything.

	return Q.all( [ all_characters_found_promise ] );
}

// Static methods.

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
			type: String
		},
		characters:
		{
			type: [
			{
				type: require( 'mongoose' ).Schema.Types.ObjectId,
				ref: 'Character'
			} ]
		}
	},
	join: 'characters',
	phases: [
	{
		name: 'init',
		requirements: [ 'Character' ],
		callback: process_item
	} ],
	set:
	{
		// To prevent returning values used only in the backend, like the list of published issues.
		'toJSON':
		{
			transform: function ( doc, ret, options )
			{
				for ( var _i in ret.characters )
				{
					ret.characters[ _i ] = {
						id: ret.characters[ _i ].id,
						name: ret.characters[ _i ].name
					};
				}

				delete ret._id;
				delete ret.__v;
			}
		}
	}
};