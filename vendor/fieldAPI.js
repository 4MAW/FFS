var fields = [
	[
		[]
	],
	[
		[]
	]
];

/**
 * Returns the list of characters in the same row as given one.
 * @param  {Character} character Character whose row-mates will be returned.
 * @return {[Character]}         Characters in the same row as given one.
 */
var get_characters_in_same_row = function ( character ) {
	for ( var f in fields )
		for ( var r in fields[ f ] )
			if ( fields[ f ][ r ].id === character.id ) return fields[ f ][  r ];
	return [];
};

/**
 * Returns the list of characters in the same area as given one.
 * @param  {Character} character Character whose area-mates will be returned.
 * @return {[Character]}           Characters in the same area as given one.
 */
var get_characters_in_same_area = function ( character ) {
	var field = -1;
	for ( var f in fields )
		for ( var r in fields[ f ] )
			if ( fields[ f ][ r ].id === character.id ) {
				field = 1;
				break;
			}
	if ( field > -1 ) {
		var ret = [];
		for ( var c in fields[ field ] )
			ret.concat( fields[ field ][ c ] );
		return ret;
	}
	return [];
};

/**
 * Returns the list of all characters in the field.
 * @return {[Character]} All characters in the field.
 */
var get_all_characters = function () {
	var ret = [];
	for ( var f in fields )
		for ( var r in fields[ f ] )
			ret.concat( fields[ f ][ r ] );
	return ret;
};

/**
 * Adds given character to given field and row.
 * @param {integer}   field     Field where character should be added.
 * @param {integer}   row       Row where character should be added.
 * @param {Character} character Character that should be added.
 */
var add_character = function ( field, row, character ) {
	if ( fields[ field ] === undefined ) fields[ field ] = [];
	if ( fields[ field ][ row ] === undefined ) fields[ field ][ row ] = [];
	fields[ field ][ row ].push( character );
};

module.exports = {
	addCharacter: add_character,
	sameRow: get_characters_in_same_row,
	sameArea: get_characters_in_same_area,
	all: get_all_characters
};