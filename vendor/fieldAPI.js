/**
 * This class represents a battlefield.
 *
 * @class Field
 * @constructor
 */
module.exports = function () {

	this.fields = [
		[
			[]
		],
		[
			[]
		]
	];

	/**
	 * Returns the list of characters in the same row as given one.
	 *
	 * @method sameRow
	 * @public
	 *
	 * @param  {Character} character Character whose row-mates will be returned.
	 * @return {[Character]}         Characters in the same row as given one.
	 */
	this.sameRow = function ( character ) {
		for ( var f in this.fields )
			for ( var r in this.fields[ f ] )
				if ( this.fields[ f ][ r ].id === character.id )
					return this.fields[ f ][  r ];
		return [];
	};

	/**
	 * Returns the list of characters in the same area as given one.
	 *
	 * @method sameArea
	 * @public
	 *
	 * @param  {Character} character Character whose area-mates will be returned.
	 * @return {[Character]}         Characters in the same area as given one.
	 */
	this.sameArea = function ( character ) {
		var field = -1;
		for ( var f in this.fields )
			for ( var r in this.fields[ f ] )
				for ( var c in this.fields[ f ][ r ] )
					if ( this.fields[ f ][ r ][ c ].id === character.id ) {
						field = f;
						break;
					}
		if ( field > -1 ) {
			var ret = [];
			for ( var k in this.fields[ field ] )
				ret = ret.concat( this.fields[ field ][ k ] );
			return ret;
		}
		return [];
	};

	/**
	 * Returns the list of all characters in the field.
	 *
	 * @method all
	 * @public
	 *
	 * @return {[Character]} All characters in the field.
	 */
	this.all = function () {
		var ret = [];
		for ( var f in this.fields )
			for ( var r in this.fields[ f ] )
				ret = ret.concat( this.fields[ f ][ r ] );
		return ret;
	};

	/**
	 * Adds given character to given field and row.
	 *
	 * @method addCharacter
	 * @public
	 *
	 * @param {integer}   field     Field where character should be added.
	 * @param {integer}   row       Row where character should be added.
	 * @param {Character} character Character that should be added.
	 */
	this.addCharacter = function ( field, row, character ) {
		if ( this.fields[ field ] === undefined ) this.fields[ field ] = [];
		if ( this.fields[ field ][ row ] === undefined )
			this.fields[ field ][ row ] = [];
		this.fields[ field ][ row ].push( character );
	};

};