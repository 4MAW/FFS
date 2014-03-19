/**
 * A Change is a representation of a modification of the environtment,
 * specifically a change in a Character's attribute. That attribute can be
 * a statistic, an altered status, its class or a different lifecycle change.
 *
 * @class  Change
 * @constructor
 *
 * @param  {Character} target Character that suffers the change.
 * @param  {string}    key    Element that is changing:
 *                            "stat" | "status" | "class" | "lifecycle".
 * @param  {string}    value  Instance of the element that is changing: stat to change or status to change.
 *                            For example, for a stat this could be "00000001", for a status
 *                            if could be "poison" and for a class it is always null.
 * @param  {string}    change Change performed. For a stat is would be a number: +50, -20, etc.
 *                            For a status it is just "+"" or "-".
 *                            For a class it's the ID of the new class.
 * @return {Change}           Change representing given parameters.
 */
module.exports = function ( target, key, value, change ) {
	/**
	 * Character affected by this change.
	 * @property character
	 * @type {Character}
	 */
	this.character = target;
	/**
	 * Modification performed by this change.
	 * Values: "+", "-", "+N", "-N", "className", "appear" or "disappear"
	 * @property change
	 * @type {string}
	 */
	this.change = change;
	/**
	 * Attribute being modified by this change.
	 * @property item
	 * @type {AttributeChanged}
	 */
	/**
	 * Attribute being modified by a change.
	 * @class AttributeChanged
	 */
	this.item = {
		/**
		 * Type of attribute being modified by this change.
		 * Possible values: "stat" | "status" | "class" | "lifecycle"
		 * @property key
		 * @type {string}
		 */
		key: key,
		/**
		 * Specific attribute being modified by this change.
		 * For instance, ID of stat being altered.
		 * When not applicable (changing class) it is null.
		 * @property value
		 * @type {string}
		 */
		value: value
	};
};