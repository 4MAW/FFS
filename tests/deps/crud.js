// Dependencies.

var request = require( 'request' ),
	assert = require( 'assert' ),
	compare = require( './compare.js' );

// Function declaration.

/**
 * Define tests cases for retrieval of blocks of items.
 */
function block_retrieval()
{}

/**
 * Define tests cases for retrieval of blocks of items.
 * @param {Object} options Object containing settings for these tests.
 */
function singular_retrieval( options )
{

	// GET /path/{valid-object} -> { valid-object }
	it( "API should return desired object if it exists", function ( done )
	{
		var chosen = options.sources[ 0 ];

		var composed_uri = options.uri;
		for ( var i in options.uriReplace )
			composed_uri = composed_uri.replace( new RegExp( i, 'i' ), chosen[ options.uriReplace[ i ] ] );

		request( composed_uri, function ( err, resp )
		{
			assert.ifError( err );
			assert.equal( resp.statusCode, 200 );
			options.compare( JSON.parse( resp.body ), chosen );
			done();
		} );
	} );

	// This function returns a test that should find an error 404.
	var test_404 = function ( composed_uri )
	{
		return function ( done )
		{
			request( composed_uri, function ( err, resp )
			{
				assert.ifError( err );
				assert.equal( resp.statusCode, 404 );
				done();
			} );
		};
	};

	// We have to create a test case for each possible invalid input, so for each parameter in path...
	for ( var j in options.uriReplace )
	{
		// Replace it with an invalid parameter and...
		var composed_uri = options.uri.replace( new RegExp( j, 'i' ), options.nonExistingID );
		// ... replace all the others with the corect paramters.
		for ( var i in options.uriReplace )
			composed_uri = composed_uri.replace( new RegExp( i, 'i' ), options.uriReplace[ i ] );

		// GET /path/{non-existing-id} -> 404
		it( "API should return an error 404 if desired object does not exist", test_404( composed_uri ) );
	}

}

// Make functions public.

module.exports = {
	blockRetrieval: block_retrieval,
	singularRetrieval: singular_retrieval
};