// Dependencies.

var request = require( 'request' ),
	assert = require( 'assert' ),
	compare = require( './compare.js' );

// Function declaration.

/**
 * Define tests cases for retrieval of blocks of items.
 */
function block_retrieval( options )
{

	// GET /path -> [...] (array of up to 25 items)
	it( "API should respond with an array with at most " + options.pagesize + " items", function ( done )
	{
		request( options.uri, function ( err, resp )
		{
			assert.ifError( err );
			assert.equal( resp.statusCode, 200 );
			assert.ok( JSON.parse( resp.body ).length <= options.pagesize );
			done();
		} );
	} );

	// GET /path { page: -1 } -> [...] (same results as GET /path )
	it( "API should return the same results when asking for a negative page than when asking for default page", function ( done )
	{
		request( options.uri, function ( err, desired_response )
		{
			assert.ifError( err );
			assert.equal( desired_response.statusCode, 200 );
			var desired_array = JSON.parse( desired_response.body );
			assert.ok( desired_array.length <= options.pagesize );

			request(
			{
				uri: options.uri,
				headers:
				{
					page: -1
				}
			}, function ( err, actual_response )
			{
				assert.ifError( err );
				assert.equal( actual_response.statusCode, 200 );
				var actual_array = JSON.parse( actual_response.body );
				assert.strictEqual( actual_array.length, desired_array.length );
				for ( var i = 0; i < actual_array.length; i++ )
					options.compare( actual_array[ i ], desired_array[ i ] );
				done();
			} );
		} );
	} );

	// GET /path { page: 0 } -> [...] (same results as GET /path )
	it( "API should return the same results when asking for page 0 than when asking for default page", function ( done )
	{
		request( options.uri, function ( err, desired_response )
		{
			assert.ifError( err );
			assert.equal( desired_response.statusCode, 200 );
			var desired_array = JSON.parse( desired_response.body );
			assert.ok( desired_array.length <= options.pagesize );

			request(
			{
				uri: options.uri,
				headers:
				{
					page: 0
				}
			}, function ( err, actual_response )
			{
				assert.ifError( err );
				assert.equal( actual_response.statusCode, 200 );
				var actual_array = JSON.parse( actual_response.body );
				assert.strictEqual( actual_array.length, desired_array.length );
				for ( var i = 0; i < actual_array.length; i++ )
					options.compare( actual_array[ i ], desired_array[ i ] );
				done();
			} );
		} );
	} );

	// GET /path { page: 1 } -> [...] (same results as GET /path )
	it( "API should return the same results when asking for page 1 than when asking for default page", function ( done )
	{
		request( options.uri, function ( err, desired_response )
		{
			assert.ifError( err );
			assert.equal( desired_response.statusCode, 200 );
			var desired_array = JSON.parse( desired_response.body );
			assert.ok( desired_array.length <= options.pagesize );

			request(
			{
				uri: options.uri,
				headers:
				{
					page: 1
				}
			}, function ( err, actual_response )
			{
				assert.ifError( err );
				assert.equal( actual_response.statusCode, 200 );
				var actual_array = JSON.parse( actual_response.body );
				assert.strictEqual( actual_array.length, desired_array.length );
				for ( var i = 0; i < actual_array.length; i++ )
					options.compare( actual_array[ i ], desired_array[ i ] );
				done();
			} );
		} );
	} );

	if ( options.checkPageTwo )
	{

		// GET /path { page: 2 } -> [...] (different results than GET /path )
		it( "API should return different results when asking for page 2 than when asking for default page", function ( done )
		{
			request( options.uri, function ( err, desired_response )
			{
				assert.ifError( err );
				assert.equal( desired_response.statusCode, 200 );
				var desired_array = JSON.parse( desired_response.body );
				assert.ok( desired_array.length <= options.pagesize );

				request(
				{
					uri: options.uri,
					headers:
					{
						page: 2
					}
				}, function ( err, actual_response )
				{
					assert.ifError( err );
					assert.equal( actual_response.statusCode, 200 );
					var actual_array = JSON.parse( actual_response.body );
					assert.strictEqual( actual_array.length, desired_array.length );
					for ( var i = 0; i < actual_array.length; i++ )
						options.compareDifferent( actual_array[ i ], desired_array[ i ] );
					done();
				} );
			} );
		} );

	}

	// GET /path { page: 999 } -> [] (empty page)
	it( "API should respond with an empty page when asking for a very big page", function ( done )
	{
		request(
		{
			uri: options.uri,
			headers:
			{
				page: 999
			}
		}, function ( err, resp )
		{
			assert.ifError( err );
			assert.equal( resp.statusCode, 200 );
			assert.strictEqual( JSON.parse( resp.body ).length, 0 );
			done();
		} );
	} );

}

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