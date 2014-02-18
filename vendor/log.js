var colors = require( 'colors' );

/**
 * Prints given error in console.
 * @param  {error} err Error to print.
 * @param {string} label Label to print instead of "ERROR".
 */
function logError( err, label )
{
	if ( typeof label === 'undefined' ) label = 'ERROR';
	console.log( ( '[' + label + ']' ).red + ' ' + err );
}

/**
 * Prints given info in console.
 * @param  {string} inf Information to print.
 * @param {string} label Label to print instead of "INFO".
 */
function logInfo( inf, label )
{
	if ( typeof label === 'undefined' ) label = 'INFO';
	console.log( ( '[' + label + ']' ).blue + ' ' + inf );
}

/**
 * Prints given success info in console.
 * @param {string} suc Information to print.
 * @param {string} label Label to print instead of "OK".
 */
function logSuccess( suc, label )
{
	if ( typeof label === 'undefined' ) label = 'OK';
	console.log( ( '[' + label + ']' ).green + ' ' + suc );
}

/**
 * Prints given status info in console.
 * @param {string} status Information to print.
 * @param {string} label Label to print instead of "STATUS".
 */
function logStatus( status, label )
{
	if ( typeof label === 'undefined' ) label = 'STATUS';
	console.log( ( '[' + label + ']' ).magenta + ' ' + status );
}

/**
 * Prints given status info in console.
 * @param {string} status Information to print.
 * @param {string} label Label to print instead of "STATUS".
 */
function logWarn( status, label )
{
	if ( typeof label === 'undefined' ) label = 'WARNING';
	console.log( ( '[' + label + ']' ).yellow.bold + ' ' + status );
}

module.exports = {
	error: logError,
	info: logInfo,
	success: logSuccess,
	status: logStatus,
	warn: logWarn
};