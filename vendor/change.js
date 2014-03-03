/**
 * Returns a new Change.
 * @param  {Character} target Character that suffers the change.
 * @param  {string}    key    Element that is changing: "stat" | "status" | "class".
 * @param  {string}    value  Instance of the element that is changing: stat to change or status to change.
 *                            For example, for a stat this could be "00000001", for a status
 *                            if could be "poison" and for a class it is always null.
 * @param  {string}    change Change performed. For a stat is would be a number: +50, -20, etc.
 *                            For a status it is just "+"" or "-".
 *                            For a class it's the ID of the new class.
 * @return {Change}           Change representing given parameters.
 */
module.exports = function ( target, key, value, change )
{
	this.character = target;
	this.change = change;
	this.item = {
		key: key,
		value: value
	};
};