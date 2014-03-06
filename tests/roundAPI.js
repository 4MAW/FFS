// Dependencies.

var Q = require( 'q' ),
	assert = require( 'assert' ),
	model = require( '../models/model.js' ),
	Skill = require( '../skills/skill.js' ),
	Round = require( '../vendor/roundAPI.js' ),
	Constants = require( '../vendor/constants.js' ),
	Character = require( '../vendor/characterHelper.js' );

// Tests.

describe( "Round Skill API", function ()
{

	var character, initial_health, other_character;

	// Load a character and initialize a helper.
	before( function ( done )
	{
		Q.all( [ model.ready, Skill.ready ] ).then( function ()
		{
			model.Character.find(
			{
				id: "00000001"
			}, function ( err, docs )
			{
				assert.ifError( err );
				assert.notEqual( docs.length, 0 );
				Character( docs[ 0 ] ).then( function ( c )
				{
					character = c;
					model.Character.find(
					{
						id: "00000002"
					}, function ( err, docs )
					{
						assert.ifError( err );
						assert.notEqual( docs.length, 0 );
						Character( docs[ 0 ] ).then( function ( c )
						{
							other_character = c;
							done();
						} );
					} );
				} );
			} );
		} );
	} );

	var poison, esuna, paralyze;

	before( function ( done )
	{
		// Poison skill.
		poison = Skill.cast( character, [ character ], "00000004" );

		// Poison skill.
		superpoison = Skill.cast( character, [ character ], "00000002" );

		// Esuna skill.
		esuna = Skill.cast( character, [ character ], "00000003" );

		// Attack skill.
		attack = Skill.cast( character, [ character ], "00000001" );

		// Nova skill.
		nova = Skill.cast( character, [ character, other_character ], "00000005" );

		// Paralyze skill.
		paralyze = Skill.cast( character, [ character ], "00000006" );

		initial_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];

		done();
	} );

	it( "Character can use Poison", function ( done )
	{
		assert.ok( character.canPerformAction( poison ) );
		done();
	} );

	it( "Character can use Esuna", function ( done )
	{
		assert.ok( character.canPerformAction( esuna ) );
		done();
	} );

	it( "Character can use Paralyze", function ( done )
	{
		assert.ok( character.canPerformAction( paralyze ) );
		done();
	} );

	it( "Character can use Attack", function ( done )
	{
		assert.ok( character.canPerformAction( attack ) );
		done();
	} );

	it( "After character uses poison it is hurt", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.strictEqual( original_health, initial_health );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( poison ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			poison.init();
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		var diff = "" + Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.POISON_STATUS_ID );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change, diff );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.ACTUALHP_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "After character uses esuna it is not hurt any more", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( esuna ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			esuna.init();
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.strictEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		// Commit should include information about character being healed.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, esuna.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.POISON_STATUS_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "After character uses poison again it is hurt", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( poison ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			poison.init();
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		var diff = "" + Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.POISON_STATUS_ID );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change, diff );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.ACTUALHP_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "After character uses paralyze it is hurt by poison", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( paralyze.caller.canPerformAction( poison ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			paralyze.init();
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		var diff = "" + Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		// Commit should include information about character being paralyzed and hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 2 );
		assert.strictEqual( commit[ 0 ].skill.id, paralyze.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, paralyze.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.PARALYSIS_STATUS_ID );
		assert.strictEqual( commit[ 1 ].skill.id, poison.id );
		assert.strictEqual( commit[ 1 ].changes.length, 1 );
		assert.strictEqual( commit[ 1 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 1 ].changes[ 0 ].change, diff );
		assert.strictEqual( commit[ 1 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 1 ].changes[ 0 ].item.value, Constants.ACTUALHP_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "When character is paralyzed it can't use esuna so it is hurt by poison", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( esuna ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			esuna.init();
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		var diff = "" + Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		// Commit should include information about character being hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, diff );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.ACTUALHP_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Poison should expire after 2 rounds", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( esuna ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			esuna.init(); // Won't do anything as player is still paralyzed.
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.strictEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		// Commit should include information about character being hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.POISON_STATUS_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Magically remove paralysis (we are merciful gods)", function ( done )
	{
		character.unsetStatus( [ Constants.PARALYSIS_STATUS_ID ], null, true );
		assert( poison.caller.canPerformAction( superpoison ) );
		// We are GODS and don't introduce any perceptable change in the round.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 0 );
		done();
	} );

	it( "After character uses poison it is hurt", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( poison ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			poison.init();
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		var diff = "" + Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.POISON_STATUS_ID );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change, diff );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.ACTUALHP_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "After character uses superpoison it is hurt by superpoison and previous poison is removed", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( superpoison.caller.canPerformAction( poison ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			superpoison.init();
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		var diff = Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		var diff_str = "" + Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		// Health should have changed after running a round.
		assert.strictEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health + diff ); // Hardcoded value!

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, superpoison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.POISON_STATUS_ID );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change, diff_str ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.ACTUALHP_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Character should be hurt by superpoison", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...

		// Before damage event, but this is special and should be handled in a way I have not clear yet.

		// This round we do nothing.

		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		var diff = "" + Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		// Commit should include information about character being hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, superpoison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, diff ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.ACTUALHP_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Character should be hurt by superpoison (again)", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...

		// Before damage event, but this is special and should be handled in a way I have not clear yet.

		// This round we do nothing.

		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		var diff = "" + Math.round( ( character.stats()[ Constants.ACTUALHP_STAT_ID ] - original_health ) * 10, 10 ) / 10;

		// Commit should include information about character being hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, superpoison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, diff ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.ACTUALHP_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Superpoison should expire after 2 rounds", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( esuna ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			esuna.init(); // Won't do anything as player is still paralyzed.
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// Health should have changed after running a round.
		assert.strictEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 2 );
		assert.strictEqual( commit[ 0 ].skill.id, superpoison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.POISON_STATUS_ID );
		assert.strictEqual( commit[ 1 ].skill.id, esuna.id );
		assert.strictEqual( commit[ 1 ].changes.length, 0 );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Character should damage target when using Attack during damage phase", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// Damage shouldn't have been done yet.
		assert.strictEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( attack ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			attack.init(); // Won't do anything as player is still paralyzed.
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		// Damage should have been done.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );
		var after_damage_phase = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// No more damage should be done.
		assert.strictEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], after_damage_phase );

		// Commit should include information about character being damaged.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, attack.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change.indexOf( "-" ), 0 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.ACTUALHP_STAT_ID );

		var hit = parseInt( commit[ 0 ].changes[ 0 ].change.substring( 1 ), 10 );
		assert.strictEqual( after_damage_phase, original_health - hit );

		Round.finishRound();

		done();
	} );

	it( "Character should damage multiple targets when using Nova during damage phase", function ( done )
	{
		var original_health = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		var other_character_health = other_character.stats()[ Constants.ACTUALHP_STAT_ID ];
		assert.notEqual( original_health, 0 );
		assert.notEqual( other_character_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// Damage shouldn't have been done yet.
		assert.strictEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( nova ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			nova.init(); // Won't do anything as player is still paralyzed.
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		// Damage should have been done.
		assert.notEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], original_health );
		assert.notEqual( other_character.stats()[ Constants.ACTUALHP_STAT_ID ], other_character_health );
		var after_damage_phase = character.stats()[ Constants.ACTUALHP_STAT_ID ];
		var other_after_damage_phase = other_character.stats()[ Constants.ACTUALHP_STAT_ID ];
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// No more damage should be done.
		assert.strictEqual( character.stats()[ Constants.ACTUALHP_STAT_ID ], after_damage_phase );
		assert.strictEqual( other_character.stats()[ Constants.ACTUALHP_STAT_ID ], other_after_damage_phase );

		// Commit should include information about character being damaged.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, nova.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, nova.targets[ 0 ].id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change.indexOf( "-" ), 0 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.ACTUALHP_STAT_ID );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, nova.targets[ 1 ].id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change.indexOf( "-" ), 0 );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.ACTUALHP_STAT_ID );

		var hit = parseInt( commit[ 0 ].changes[ 0 ].change.substring( 1 ), 10 );
		assert.strictEqual( after_damage_phase, original_health - hit );

		var other_hit = parseInt( commit[ 0 ].changes[ 1 ].change.substring( 1 ), 10 );
		assert.strictEqual( other_after_damage_phase, other_character_health - other_hit );

		Round.finishRound();

		done();
	} );

} );