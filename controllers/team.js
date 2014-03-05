var Q = require( 'q' ),
	Model = require( '../models/model.js' ),
	log = require( '../vendor/log.js' );

module.exports = {
	model: 'Team',
	getByPlayerUsername: function ( key )
	{
		return function ( req, res )
		{
			var defer = Q.defer();

			var id = req.params[ key ];
			Model.Player.find(
			{
				id: id
			}, function ( err, docs )
			{
				if ( err ) defer.reject( err );
				else if ( docs.length === 0 ) defer.reject( 404 );
				else
				{
					Model.Team.find(
					{
						_id:
						{
							$in: docs[ 0 ].teams
						}
					} ).populate( Model.Team.join ).exec( function ( err, docs )
					{
						res.send( JSON.stringify( docs ) );
					} );
				}
			} );

			defer.promise.then( function ( teams )
			{
				res.send( teams );
			} ).fail( function ( err )
			{
				log.error( err );
				if ( err === 404 ) res.send( 404 );
				else res.send( 500 );
			} );
		};
	}
};