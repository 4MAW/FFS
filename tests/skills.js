// Dependencies.

var request = require( 'request' ),
	assert = require( 'assert' ),
	config = require( '../config.js' ),
	Constants = require( '../vendor/constants.js' ),
	Mocks = require( './deps/mocks.js' ),
	Crud = require( './deps/crud.js' ),
	compare = require( './deps/compare.js' ),
	Q = require( 'q' ),
	log = require( '../vendor/log.js' ),
	io = require( 'socket.io-client' );

// Settings.

var baseURL = config.baseURL + ':' + config.port;

describe( 'Skills', function ()
{

	describe( 'Block retrieval', function ()
	{

		// GET /skill -> [...] (array of up to 25 skills)
		it( "API should respond with an array with at most " + config.pagesize + " skills", function ( done )
		{
			request( baseURL + '/skill', function ( err, resp )
			{
				assert.ifError( err );
				assert.equal( resp.statusCode, 200 );
				assert.ok( JSON.parse( resp.body ).length <= config.pagesize );
				done();
			} );
		} );

		// GET /skill { page: -1 } -> [...] (same results as GET /skill )
		it( "API should return the same results when asking for a negative page than when asking for default page", function ( done )
		{
			request( baseURL + '/skill', function ( err, desired_response )
			{
				assert.ifError( err );
				assert.equal( desired_response.statusCode, 200 );
				var desired_array = JSON.parse( desired_response.body );
				assert.ok( desired_array.length <= config.pagesize );

				request(
				{
					uri: baseURL + '/skill',
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
						compare.sameSkill( actual_array[ i ], desired_array[ i ] );
					done();
				} );
			} );
		} );

		// GET /skill { page: 0 } -> [...] (same results as GET /skill )
		it( "API should return the same results when asking for page 0 than when asking for default page", function ( done )
		{
			request( baseURL + '/skill', function ( err, desired_response )
			{
				assert.ifError( err );
				assert.equal( desired_response.statusCode, 200 );
				var desired_array = JSON.parse( desired_response.body );
				assert.ok( desired_array.length <= config.pagesize );

				request(
				{
					uri: baseURL + '/skill',
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
						compare.sameSkill( actual_array[ i ], desired_array[ i ] );
					done();
				} );
			} );
		} );

		// GET /skill { page: 1 } -> [...] (same results as GET /skill )
		it( "API should return the same results when asking for page 1 than when asking for default page", function ( done )
		{
			request( baseURL + '/skill', function ( err, desired_response )
			{
				assert.ifError( err );
				assert.equal( desired_response.statusCode, 200 );
				var desired_array = JSON.parse( desired_response.body );
				assert.ok( desired_array.length <= config.pagesize );

				request(
				{
					uri: baseURL + '/skill',
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
						compare.sameSkill( actual_array[ i ], desired_array[ i ] );
					done();
				} );
			} );
		} );

		// GET /skill { page: 2 } -> [...] (different results than GET /skill )
		it( "API should return different results when asking for page 2 than when asking for default page", function ( done )
		{
			request( baseURL + '/skill', function ( err, desired_response )
			{
				assert.ifError( err );
				assert.equal( desired_response.statusCode, 200 );
				var desired_array = JSON.parse( desired_response.body );
				assert.ok( desired_array.length <= config.pagesize );

				request(
				{
					uri: baseURL + '/skill',
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
						compare.differentSkill( actual_array[ i ], desired_array[ i ] );
					done();
				} );
			} );
		} );

		// GET /skill { page: 999 } -> [] (empty page)
		it( "API should respond with an empty page when asking for a very big page", function ( done )
		{
			request(
			{
				uri: baseURL + '/skill',
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

	} );

	describe( 'Singular retrieval', function ()
	{

		// GET /skill/{valid-id} -> { valid-skill }
		it( "API should return desired skill if it exists", function ( done )
		{
			var chosen_skill = Mocks.skills[ 0 ];
			request( baseURL + '/skill/' + chosen_skill.id, function ( err, resp )
			{
				assert.ifError( err );
				assert.equal( resp.statusCode, 200 );
				compare.sameSkill( JSON.parse( resp.body ), chosen_skill );
				done();
			} );
		} );

		// GET /skill/{non-existing-id} -> 404
		it( "API should return an error 404 if desired skill does not exist", function ( done )
		{
			request( baseURL + '/skill/' + Mocks.NON_EXISTING_ID, function ( err, resp )
			{
				assert.ifError( err );
				assert.equal( resp.statusCode, 404 );
				done();
			} );
		} );

	} );

} );