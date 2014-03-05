$( document ).ready( function ()
{

	// set up the timeout variable
	var t;
	// setup the sizing function,
	// with an argument that tells the chart to animate or not
	function size( animate )
	{
		// If we are resizing, we don't want the charts drawing on every resize event.
		// This clears the timeout so that we only run the sizing function
		// when we are done resizing the window
		clearTimeout( t );
		// This will reset the timeout right after clearing it.
		t = setTimeout( function ()
		{
			$( "canvas" ).each( function ( i, el )
			{
				// Set the canvas element's height and width to it's parent's height and width.
				// The parent element is the div.canvas-container
				$( el ).attr(
				{
					"width": $( el ).parent().width(),
					"height": $( el ).parent().outerHeight()
				} );
			} );
			// kickoff the redraw function, which builds all of the charts.
			redraw( animate );

		}, 100 ); // the timeout should run after 100 milliseconds
	}

	function redraw( animation )
	{
		var options = {};

		if ( !animation )
			options.animation = false;
		else
			options.animation = true;

		var ctx = {
			skills: $( "#skills" ).get( 0 ).getContext( "2d" ),
			skills_won: $( "#skills_won" ).get( 0 ).getContext( "2d" ),
			skills_damages: $( "#skills_damages" ).get( 0 ).getContext( "2d" ),
			skills_damages_per_hit: $( "#skills_damages_per_hit" ).get( 0 ).getContext( "2d" ),
			classes_won: $( "#classes_won" ).get( 0 ).getContext( "2d" ),
			team_won: $( "#team_won" ).get( 0 ).getContext( "2d" ),
			classes_killed: $( "#classes_killed" ).get( 0 ).getContext( "2d" ),
			classes_rounds: $( "#classes_rounds" ).get( 0 ).getContext( "2d" ),
			status: $( "#status" ).get( 0 ).getContext( "2d" ),
			damages: $( "#damages" ).get( 0 ).getContext( "2d" )
		};

		var base_dataset = function ()
		{
			this.fillColor = "rgba(151,187,205,0.5)";
			this.strokeColor = "rgba(151,187,205,1)";
			this.pointColor = "rgba(151,187,205,1)";
			this.pointStrokeColor = "#fff";
			this.data = [];
		};

		var alt_dataset = function ()
		{
			this.fillColor = "rgba(220,220,220,0.5)";
			this.strokeColor = "rgba(220,220,220,1)";
			this.pointColor = "rgba(220,220,220,1)";
			this.pointStrokeColor = "#fff";
			this.data = [];
		};

		var exclude = [ "skills_used", "status_altered", "status_healed" ];

		var data_radar = function ( values, aux, callback )
		{
			var data = {
				labels: [],
				datasets: [ new base_dataset() ]
			};

			for ( var i in values )
			{
				data.labels.push( i );
				if ( aux === undefined ||  callback === undefined )
					data.datasets[ 0 ].data.push( values[ i ] );
				else
					data.datasets[ 0 ].data.push( callback( values[ i ], aux[ i ] ) );
			}

			return data;
		};

		var data_radar_multiset = function ( a, b )
		{
			var data = {
				labels: [],
				datasets: [ new base_dataset(), new alt_dataset() ]
			};

			var indexes = {}, i;

			for ( i in a )
			{
				data.labels.push( i );
				data.datasets[ 0 ].data.push( a[ i ] );
				indexes[ i ] = data.labels.length;
			}

			var c = 0;
			for ( i in b )
			{
				var j = indexes[ i ];

				if ( j === undefined )
				{
					data.labels.push( i );
					j = data.labels.length;
				}

				if ( data.datasets[ 1 ].data[ c ] === undefined )
					data.datasets[ 1 ].data[ c ] = 0;
				data.datasets[ 1 ].data[ j ] = b[ i ];

				c++;
			}

			return data;
		};

		var radar_charts = [];

		radar_charts.push(
		{
			data: data_radar( json.skills_used ),
			selector: ctx.skills
		} );

		radar_charts.push(
		{
			data: data_radar( json.skills_damage ),
			selector: ctx.skills_damages
		} );

		radar_charts.push(
		{
			data: data_radar( json.skills_won ),
			selector: ctx.skills_won
		} );

		radar_charts.push(
		{
			data: data_radar( json.skills_damage, json.skills_used, function ( a, b )
			{
				return a / b;
			} ),
			selector: ctx.skills_damages_per_hit
		} );

		radar_charts.push(
		{
			data: data_radar( json.class_won ),
			selector: ctx.classes_won
		} );

		radar_charts.push(
		{
			data: data_radar( json.class_kills ),
			selector: ctx.classes_killed
		} );

		radar_charts.push(
		{
			data: data_radar( json.class_rounds ),
			selector: ctx.classes_rounds
		} );

		radar_charts.push(
		{
			data: data_radar( json.team_won ),
			selector: ctx.team_won
		} );

		radar_charts.push(
		{
			data: data_radar_multiset( json.status_altered, json.status_healed ),
			selector: ctx.status
		} );

		for ( var i in radar_charts )
			new Chart( radar_charts[ i ].selector ).Radar( radar_charts[ i ].data,
			{
				scaleShowLabels: true
			} );


		var damagesChart = new Chart( ctx.damages ).Doughnut( [
		{
			value: json.magical_damage_dealed,
			color: "#F7464A"
		},
		{
			value: json.physical_damage_dealed,
			color: "#4D5360"
		} ],
		{
			scaleShowLabels: true
		} );

		for ( var j in json )
			if ( exclude.indexOf( j ) === -1 )
				$( "#" + j ).text( json[ j ] );

	}
	size(); // this kicks off the first drawing; note that the first call to size will animate the charts in.

	var json;

	$.get(
		'json.json',
		function ( _json )
		{
			json = _json;
			$( window ).on( 'resize', size );
			setTimeout( size, 100 );
			redraw();
		}
	);
} );