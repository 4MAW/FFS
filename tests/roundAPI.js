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
			id: "00000001", // This will be injected by SkillLoader when implemented.
			type: "magical",
			element: "poison",
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
			// Unregisters the damage callback.
			unpoison: function ()
			{
				// Unpoison only if this skill did poison the character.
				if ( this.internalVariables.did_poison )
					this.target.unsetStatus( [ "poison" ], this, false );
			},
			// Performs some damage.
			damage: function ()
			{
				this.target.damage( 20, 0, this );
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

		// Poison skill.
		superpoison = {
			id: "00000002", // This will be injected by SkillLoader when implemented.
			type: "magical",
			element: "poison",
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
				this.target.damage( 100, 0, this );
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
			id: "00000003", // This will be injected by SkillLoader when implemented.
			type: "magical",
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

		// Attack skill.
		attack = {
			id: "00000004", // This will be injected by SkillLoader when implemented.
			type: "physical",
			// Initialization, called when a skill is used.
			init: function ()
			{
				Round.do( this.damage, this );
			},
			damage: function ()
			{
				this.target.damage( 100, 50, this );
			},
			// Target of this skill.
			target: character,
			// Character how will use this skill.
			caller: character,
			// Array of altered status that prevent this skill to be performed.
			blockedBy: [ "paralysis" ]
		};

		// Paralyze skill.
		paralyze = {
			id: "00000005", // This will be injected by SkillLoader when implemented.
			type: "magical",
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
				duration = 3; // Just to make the tests deterministic.
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

	it( "Character can use Attack", function ( done )
	{
		assert.ok( character.canPerformAction( attack ) );
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

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, "poison" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change, "-20" ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.HEALTH_STAT_ID );

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

		// Commit should include information about character being healed.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, esuna.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, "poison" );

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

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, "poison" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change, "-20" ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.HEALTH_STAT_ID );

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

		// Commit should include information about character being paralyzed and hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 2 );
		assert.strictEqual( commit[ 0 ].skill.id, paralyze.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, paralyze.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, "paralysis" );
		assert.strictEqual( commit[ 1 ].skill.id, poison.id );
		assert.strictEqual( commit[ 1 ].changes.length, 1 );
		assert.strictEqual( commit[ 1 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 1 ].changes[ 0 ].change, "-20" ); // Hardcoded value!
		assert.strictEqual( commit[ 1 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 1 ].changes[ 0 ].item.value, Constants.HEALTH_STAT_ID );

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

		// Commit should include information about character being hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-20" ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.HEALTH_STAT_ID );

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

		// Commit should include information about character being hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, "poison" );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Magically remove paralysis (we are merciful gods)", function ( done )
	{
		character.unsetStatus( [ "paralysis" ], null, true );
		assert( poison.caller.canPerformAction( superpoison ) );
		// We are GODS and don't introduce any perceptable change in the round.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 0 );
		done();
	} );

	it( "After character uses poison it is hurt", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];

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

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, poison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, "poison" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, poison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change, "-20" ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.HEALTH_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "After character uses superpoison it is hurt by superpoison and previous poison is removed", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];

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

		// Health should have changed after running a round.
		assert.strictEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health - 100 ); // Hardcoded value!

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, superpoison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 2 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "+" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, "poison" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].change, "-100" ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 1 ].item.value, Constants.HEALTH_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Character should be hurt by superpoison", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
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
		assert.notEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );

		// Commit should include information about character being hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, superpoison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-100" ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.HEALTH_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Character should be hurt by superpoison (again)", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
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
		assert.notEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );

		// Commit should include information about character being hurt.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, superpoison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-100" ); // Hardcoded value!
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.HEALTH_STAT_ID );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Superpoison should expire after 2 rounds", function ( done )
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
		assert.strictEqual( character.stats()[ Constants.HEALTH_STAT_ID ], initial_health - 400 ); // Hardcoded value!

		// Commit should include information about character being poisoned.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 2 );
		assert.strictEqual( commit[ 0 ].skill.id, superpoison.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change, "-" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "status" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, "poison" );
		assert.strictEqual( commit[ 1 ].skill.id, esuna.id );
		assert.strictEqual( commit[ 1 ].changes.length, 0 );

		// Finishes this round, returning the summary of actions that happened during the round.
		Round.finishRound();

		done();
	} );

	it( "Character should damage target when using Attack during damage phase", function ( done )
	{
		var original_health = character.stats()[ Constants.HEALTH_STAT_ID ];
		assert.notEqual( original_health, 0 );

		Round.performPhaseCallbacks( Constants.BEFORE_ORDER_PHASE_EVENT );
		// A real server would compute order here.
		Round.performPhaseCallbacks( Constants.AFTER_ORDER_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.BEFORE_DAMAGE_PHASE_EVENT );
		// Damage shouldn't have been done yet.
		assert.strictEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );
		// For each action to be performed (in order)...
		if ( poison.caller.canPerformAction( attack ) )
		// Before damage event, but this is special and should be handled in a way I have not clear yet.
			attack.init(); // Won't do anything as player is still paralyzed.
		// After damage event, but this is special and should be handled in a way I have not clear yet.
		// Damage should have been done.
		assert.notEqual( character.stats()[ Constants.HEALTH_STAT_ID ], original_health );
		var after_damage_phase = character.stats()[ Constants.HEALTH_STAT_ID ];
		Round.performPhaseCallbacks( Constants.AFTER_DAMAGE_PHASE_EVENT );
		Round.performPhaseCallbacks( Constants.ENDROUND_EVENT );

		// No more damage should be done.
		assert.strictEqual( character.stats()[ Constants.HEALTH_STAT_ID ], after_damage_phase );

		// Commit should include information about character being damaged.
		var commit = Round.changes();
		assert.strictEqual( commit.length, 1 );
		assert.strictEqual( commit[ 0 ].skill.id, attack.id );
		assert.strictEqual( commit[ 0 ].changes.length, 1 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].character.id, superpoison.target.id );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].change.indexOf( "-" ), 0 );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.key, "stat" );
		assert.strictEqual( commit[ 0 ].changes[ 0 ].item.value, Constants.HEALTH_STAT_ID );

		var hit = parseInt( commit[ 0 ].changes[ 0 ].change.substring( 1 ), 10 );
		assert.strictEqual( after_damage_phase, original_health - hit );

		Round.finishRound();

		done();
	} );

} );