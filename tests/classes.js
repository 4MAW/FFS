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

describe( 'Classes', function ()
{

	describe( 'Block retrieval', function ()
	{
		var options = {
			uri: baseURL + '/class',
			pagesize: config.pagesize,
			compare: compare.sameClass,
			compareDifferent: compare.differentClass,
			checkPageTwo: false
		};

		Crud.blockRetrieval( options );
	} );

	describe( 'Singular retrieval', function ()
	{
		var options = {
			uri: baseURL + '/class/:id',
			uriReplace:
			{
				':id': 'id'
			},
			sources: Mocks.classes,
			compare: compare.sameClass,
			nonExistingID: Mocks.NON_EXISTING_ID
		};

		Crud.singularRetrieval( options );
	} );

} );