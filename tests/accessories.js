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

describe( 'Accessories', function ()
{

	describe( 'Block retrieval', function ()
	{
		var options = {
			uri: baseURL + '/accessory',
			pagesize: config.pagesize,
			compare: compare.sameAccessory,
			compareDifferent: compare.differentAccessory,
			checkPageTwo: false
		};

		Crud.blockRetrieval( options );
	} );

	describe( 'Singular retrieval', function ()
	{
		var options = {
			uri: baseURL + '/accessory/:id',
			uriReplace:
			{
				':id': 'id'
			},
			sources: Mocks.accessories,
			compare: compare.sameAccessoryMock,
			nonExistingID: Mocks.NON_EXISTING_ID
		};

		Crud.singularRetrieval( options );
	} );

} );