// Dependencies.

var Q = require( 'q' ),
	assert = require( 'assert' ),
	model = require( '../models/model.js' ),
	Round = require( '../vendor/roundAPI.js' ),
	Constants = require( '../vendor/constants.js' ),
	Character = require( '../vendor/characterHelper.js' );

// Tests.

describe( "Round Skill API", function ()
{

	var character, initial_health;

	// Load a character and initialize a helper.
	before( function ( done )
	{
		model.ready.then( function ()
		{
			model.Character.find(
			{
				id: "00000001"
			} ).exec( function ( err, docs )
			{
				assert.ifError( err );
				assert.notEqual( docs.length, 0 );
				Character( docs[ 0 ] ).then( function ( c )
				{
					character = c;
					done();
				} );
			} );
		} );
	} );

	var poison, esuna, paralyze;

	before( function ( done )
	{
		// Poison skill.
		poison = {
			internalVariables:
			{},
			// Initialization, called when a skill is used.
			init: function ()
			{
				Round.do( this.poison, this );
			},
			// Registers the damage and unregister callbacks.
			poison: function ()
			{
				// Compute duration: 2±1 rounds.
				var duration = 2 + Math.round( Math.random() * 2 - 1 );
				duration = 2; // Just to make the tests deterministic.
				// Store whether character was poisoned or not: in
				// some cases a character won't be poisoned because
				// it has inmunity or it is poisoned by a skill with
				// more duration or it is poisoned by a skill with
				// more priority.
				this.internalVariables.did_poison = this.target.setStatus( [ "poison" ], this, Round.currentRound() + duration )[ 0 ]; // Poison's priority will be the round number where it ends. This could be modified to be a linear combination of duration and damage, for instance.
				// If character was poisoned by this skill then register callbacks.
				if ( this.internalVariables.did_poison )
				{
					// Store UUIDs to cancel callbacks in the future.
					this.internalVariables.in_uuid = Round. in ( duration, this.unpoison, this, Constants.ENDROUND_EVENT );
					this.internalVariables.each_uuid = Round.each( this.damage, this, Constants.AFTER_DAMAGE_PHASE_EVENT );
				}
			},
			// Unregisters the damage callbacl.
			unpoison: function ()
			{
				// Unpoison only if this skill did poison the character.
				if ( this.internalVariables.did_poison )
					this.target.unsetStatus( [ "poison" ], this, false );
			},
			// Performs some damage.
			damage: function ()
			{
				this.target.damage( 20, 0, "physic", "poison" );
			},
			// Cancels the effects produced by this skill.
			//
			// Reasons is an optional array of status, used to
			// allow cancelling just the effects produced by a
			// skill due to one altered status.
			//
			// For instance:  «Vómito de Molbol» will affect
			// several status, one of them might be poison and
			// other might be blind. If you cast a spell that
			// heals "blind" altered status you should affect
			// the poison damage triggered by this skill, even
			// if blind status was triggered also by this skill.
			cancel: function ( reasons )
			{
				// Unpoison only if this skill did poison the character.
				if ( this.internalVariables.did_poison )
				{
					// In this case this is trivial but if this skill
					// affected more than one altered status this
					// won't be so trivial.
					if ( reasons.indexOf( "poison" ) > -1 )
					{
						Round.cancel( this.internalVariables.in_uuid );
						Round.uneach( this.internalVariables.each_uuid );
					}
				}
			},
			// Target of this skill.
			target: character,
			// Character how will use this skill.
			caller: character,
			// Array of altered status that prevent this skill to be performed.
			blockedBy: [ "paralysis" ]
		};

		// Esuna skill.
		esuna = {
			// Initialization, called when a skill is used.
			init: function ()
			{
				Round.do( this.heal, this );
			},
			// Healing action.
			heal: function ()
			{
				// Unset given status and retrieve array of skills that affected those status.
				this.target.unsetStatus( [ "poison", "blind" ], this, true );
			},
			// Target of this skill.
			target: character,
			// Character how will use this skill.
			caller: character,
			// Array of altered status that prevent this skill to be performed.
			blockedBy: [ "paralysis", "mutis" ]
		};

		// Paralyze skill.
		paralyze = {
			internalVariables:
			{},
			// Initialization, called when a skill is used.
			init: function ()
			{
				Round.do( this.paralyze, this );
			},
			// Registers the unregister callback.
			paralyze: function ()
			{
				// Compute duration: 2±1 rounds.
				var duration = 2 + Math.round( Math.random() * 2 - 1 );
				duration = 2; // Just to make the tests deterministic.
				// Store whether character was paralyzed or not.
				this.internalVariables.did_paralyze = this.target.setStatus( [ "paralysis" ], this, Round.currentRound() + duration )[ 0 ];
				// If character was paralyzed by this skill then register unregister callback.
				if ( this.internalVariables.did_paralyze )
				{
					// Store UUIDs to cancel callbacks in the future.
					this.internalVariables.in_uuid = Round. in ( duration, this.unparalyze, this, Constants.ENDROUND_EVENT );
				}
			},
			// Unsets altered status.
			unparalyze: function ()
			{
				// Unpoison only if this skill did poison the character.
				if ( this.internalVariables.did_paralyze )
					this.target.unsetStatus( [ "paralysis" ], this, false );
			},
			// Cancels the effects produced by this skill.
			cancel: function ( reasons )
			{
				// Unparalyses only if this skill did paralyze the character.
				if ( this.internalVariables.did_paralyze && reasons.indexOf( "paralysis" ) > -1 )
					Round.cancel( this.internalVariables.in_uuid );
			},
			// Target of this skill.
			target: character,
			// Character how will use this skill.
			caller: character,
			// Array of altered status that prevent this skill to be performed.
			blockedBy: [ "paralysis" ]
		};

		initial_health = character.stats()[ Constants.HEALTH_STAT_ID ];

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

	it( "After character uses poison it is hurt", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
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
		assert.notEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "After character uses esuna it is not hurt any more", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
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
		assert.strictEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "After character uses poison again it is hurt", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
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
		assert.notEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "After character uses paralyze it is hurt by poison", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
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
		assert.notEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "When character is paralyzed it can't use esuna so it is hurt by poison", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
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
		assert.notEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Poison should expire after 2 rounds", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
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
		assert.strictEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );
		assert.strictEqual( character.stats()[ Constants.HEALTH_STAT_ID ], initial_health - 80 ); // Hardcoded value!

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

} );