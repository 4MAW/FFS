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
		{
			options.animation = false;
		}
		else
		{
			options.animation = true;
		}

		var ctx_skills = $( "#skills" ).get( 0 ).getContext( "2d" );
		var ctx_skills_damages = $( "#skills_damages" ).get( 0 ).getContext( "2d" );
		var ctx_skills_damages_per_hit = $( "#skills_damages_per_hit" ).get( 0 ).getContext( "2d" );
		var ctx_status = $( "#status" ).get( 0 ).getContext( "2d" );
		var ctx_damages = $( "#damages" ).get( 0 ).getContext( "2d" );

		var exclude = [ "skills_used", "status_altered", "status_healed" ];

		var skills_data_src = json.skills_used;
		var skills_data = {
			labels: [],
			datasets: [
			{
				fillColor: "rgba(151,187,205,0.5)",
				strokeColor: "rgba(151,187,205,1)",
				pointColor: "rgba(151,187,205,1)",
				pointStrokeColor: "#fff",
				data: []
			} ]
		};

		var i, j, c;

		for ( i in skills_data_src )
		{
			skills_data.labels.push( i );
			skills_data.datasets[ 0 ].data.push( skills_data_src[ i ] );
		}

		var skills_damage_data_src = json.skills_damage;
		var skills_damage_data = {
			labels: [],
			datasets: [
			{
				fillColor: "rgba(151,187,205,0.5)",
				strokeColor: "rgba(151,187,205,1)",
				pointColor: "rgba(151,187,205,1)",
				pointStrokeColor: "#fff",
				data: []
			} ]
		};

		for ( i in skills_damage_data_src )
		{
			skills_damage_data.labels.push( i );
			skills_damage_data.datasets[ 0 ].data.push( skills_damage_data_src[ i ] );
		}

		var skills_damage_per_hit_data = {
			labels: [],
			datasets: [
			{
				fillColor: "rgba(151,187,205,0.5)",
				strokeColor: "rgba(151,187,205,1)",
				pointColor: "rgba(151,187,205,1)",
				pointStrokeColor: "#fff",
				data: []
			} ]
		};

		for ( i in skills_damage_data_src )
		{
			skills_damage_per_hit_data.labels.push( i );
			skills_damage_per_hit_data.datasets[ 0 ].data.push( skills_damage_data_src[ i ] / skills_data_src[ i ] );
		}

		var status_src = json.status_altered;
		var healed_status_src = json.status_healed;
		var status_indexes = {};

		var status_data = {
			labels: [],
			datasets: [
			{
				fillColor: "rgba(220,220,220,0.5)",
				strokeColor: "rgba(220,220,220,1)",
				pointColor: "rgba(220,220,220,1)",
				pointStrokeColor: "#fff",
				data: []
			},
			{
				fillColor: "rgba(151,187,205,0.5)",
				strokeColor: "rgba(151,187,205,1)",
				pointColor: "rgba(151,187,205,1)",
				pointStrokeColor: "#fff",
				data: []
			} ]
		};

		for ( i in status_src )
		{
			status_data.labels.push( i );
			status_indexes[ i ] = status_data.labels.length;
			status_data.datasets[ 0 ].data.push( status_src[ i ] );
		}

		c = 0;
		for ( i in healed_status_src )
		{
			j = status_indexes[ i ];
			if ( j === undefined )
			{
				status_data.labels.push( i );
				j = status_data.labels.length;
			}
			if ( status_data.datasets[ 1 ].data[ c ] === undefined )
				status_data.datasets[ 1 ].data[ c ] = 0;
			status_data.datasets[ 1 ].data[ j ] = status_src[ i ];
			c++;
		}

		//This will get the first returned node in the jQuery collection.
		var skillsChart = new Chart( ctx_skills ).Radar( skills_data,
		{
			scaleShowLabels: true
		} );
		var skillsDamageChart = new Chart( ctx_skills_damages ).Radar( skills_damage_data,
		{
			scaleShowLabels: true
		} );
		var skillsDamagePerHitChart = new Chart( ctx_skills_damages_per_hit ).Radar( skills_damage_per_hit_data,
		{
			scaleShowLabels: true
		} );
		var statusChart = new Chart( ctx_status ).Radar( status_data,
		{
			scaleShowLabels: true
		} );
		var damagesChart = new Chart( ctx_damages ).Doughnut( [
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

		for ( j in json )
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