var log = require( './log.js' );

function get()
{
	var model = this.model;

	return function ( req, res )
	{
		var page = Number( req.get( 'page' ) || 1 ) - 1;
		if ( page < 0 ) page = 0;

		model.find().skip( page * model.pagesize ).limit( model.pagesize ).sort( 'slug' ).populate( model.join ).exec( function ( err, docs )
		{
			if ( err )
			{
				log.error( err, 'DB' );
				res.send( 500 );
			}
			else
			{
				res.send( docs );
			}
		} );

	};
}

function get_by( field, variable )
{
	var model = this.model;

	return function ( req, res )
	{
		var value = req.params[ variable ];

		if ( value === undefined )
		{
			res.send( 404 );
		}
		else
		{
			var query = {};
			query[ field ] = value;

			model.find( query ).populate( model.join ).exec( function ( err, docs )
			{
				if ( err )
				{
					log.error( err, 'DB' );
					res.send( 500 );
				}
				else if ( docs.length === 0 )
				{
					res.send( 404 );
				}
				else
				{
					res.send( docs[ 0 ] );
				}
			} );
		}
	};
}

module.exports = {
	get: get,
	getBy: get_by
};